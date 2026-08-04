import { JSDOM } from "jsdom";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface MediaManifestEntry {
  originalUrl: string;
  finalUrl: string | null;
  localPath: string | null;
  mimeType: string | null;
  byteLength: number | null;
  dimensions: { width: number; height: number } | null;
  checksum: string | null;
  httpEvidence: {
    statusCode: number;
    statusText: string;
    headers: Record<string, string>;
    redirects: string[];
  } | null;
  failureStatus: string | null;
}

export interface MediaManifest {
  version: "1.0.0";
  media: MediaManifestEntry[];
}

export interface CrawlOptions {
  concurrency?: number;
  timeout?: number;
  sizeLimit?: number;
  retries?: number;
}

/**
 * Scans HTML elements (including <img>, <picture>, and <source>) for standard and
 * lazy-loaded attributes (such as src, srcset, or any data- attributes containing src or srcset).
 * Resolves relative URLs to absolute URLs using the provided base URL.
 */
export function discoverImageCandidates(html: string, baseUrl: string): string[] {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const urls = new Set<string>();

  const addUrl = (val: string | null) => {
    if (!val) return;
    const trimmed = val.trim();
    if (!trimmed || trimmed.startsWith("data:")) return;
    try {
      const resolved = new URL(trimmed, baseUrl).href;
      urls.add(resolved);
    } catch {
      // Keep raw URL if it can't be parsed as a URL
      urls.add(trimmed);
    }
  };

  const processSrcset = (srcset: string | null) => {
    if (!srcset) return;
    // Split on commas followed by spaces, or standard srcset delimiters
    const parts = srcset.split(/,(?=\s)/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const firstToken = trimmed.split(/\s+/)[0];
      if (firstToken) {
        addUrl(firstToken);
      }
    }
  };

  // Process all img tags
  const imgs = doc.querySelectorAll("img");
  for (const img of Array.from(imgs) as any[]) {
    // 1. standard src
    addUrl(img.getAttribute("src"));
    // 2. standard srcset
    processSrcset(img.getAttribute("srcset"));
    // 3. custom data- attributes with 'src' or 'srcset' in their names
    for (let i = 0; i < img.attributes.length; i++) {
      const attr = img.attributes[i];
      const name = attr.name.toLowerCase();
      if (name.startsWith("data-")) {
        if (name.includes("srcset")) {
          processSrcset(attr.value);
        } else if (name.includes("src")) {
          addUrl(attr.value);
        }
      }
    }
  }

  // Process all source tags (e.g. within picture tags)
  const sources = doc.querySelectorAll("source");
  for (const src of Array.from(sources) as any[]) {
    // 1. standard src
    addUrl(src.getAttribute("src"));
    // 2. standard srcset
    processSrcset(src.getAttribute("srcset"));
    // 3. custom data- attributes
    for (let i = 0; i < src.attributes.length; i++) {
      const attr = src.attributes[i];
      const name = attr.name.toLowerCase();
      if (name.startsWith("data-")) {
        if (name.includes("srcset")) {
          processSrcset(attr.value);
        } else if (name.includes("src")) {
          addUrl(attr.value);
        }
      }
    }
  }

  return Array.from(urls);
}

/**
 * Extracts a base URL candidate from standard HTML elements (canonical link, og:url, base tag, or custom comment).
 */
export function extractBaseUrlFromHtml(html: string): string | null {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const baseEl = doc.querySelector("base");
  if (baseEl && baseEl.getAttribute("href")) {
    return baseEl.getAttribute("href");
  }

  const canonicalEl = doc.querySelector("link[rel='canonical']");
  if (canonicalEl && canonicalEl.getAttribute("href")) {
    return canonicalEl.getAttribute("href");
  }

  const ogUrlEl = doc.querySelector("meta[property='og:url']");
  if (ogUrlEl && ogUrlEl.getAttribute("content")) {
    return ogUrlEl.getAttribute("content");
  }

  // Check for comment <!-- source: URL -->
  const match = html.match(/<!--\s*source:\s*(\S+)\s*-->/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

function getPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length >= 24) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }
  return null;
}

function getJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let i = 2; // skip SOI (0xFFD8)
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) {
      break; // invalid JPEG
    }
    const marker = buffer[i + 1];
    if (marker === 0xd9 || marker === 0xda) {
      break; // End of image or Start of Scan
    }
    // SOF markers: 0xC0-0xC3, 0xC5-0xC7, 0xC9-0xCB, 0xCD-0xCF
    const isSOF =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (i + 3 >= buffer.length) break;
    const length = buffer.readUInt16BE(i + 2);
    if (isSOF) {
      if (i + 9 < buffer.length) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        return { width, height };
      }
      break;
    }
    i += 2 + length;
  }
  return null;
}

function getGifDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length >= 10) {
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    return { width, height };
  }
  return null;
}

function getWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null;
  const type = buffer.toString("ascii", 12, 16);
  if (type === "VP8 ") {
    const signatureOffset = 23;
    if (
      buffer[signatureOffset] === 0x9d &&
      buffer[signatureOffset + 1] === 0x01 &&
      buffer[signatureOffset + 2] === 0x2a
    ) {
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      return { width, height };
    }
  } else if (type === "VP8L") {
    if (buffer[20] === 0x2f) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { width, height };
    }
  } else if (type === "VP8X") {
    const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
    const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
    return { width, height };
  }
  return null;
}

export function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    if (buffer.length < 4) return null;
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return getPngDimensions(buffer);
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      return getJpegDimensions(buffer);
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return getGifDimensions(buffer);
    }
    if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
      return getWebpDimensions(buffer);
    }
  } catch {
    // ignore parsing errors
  }
  return null;
}

export async function runWithConcurrency<T, R>(
  concurrency: number,
  items: T[],
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  const promises: Promise<void>[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];
      try {
        results[currentIndex] = await fn(item);
      } catch (err) {
        results[currentIndex] = err as any;
      }
    }
  }

  const numWorkers = Math.min(concurrency, items.length);
  for (let i = 0; i < numWorkers; i++) {
    promises.push(worker());
  }

  await Promise.all(promises);
  return results;
}

async function fetchWithManualRedirects(
  initialUrl: string,
  timeout: number,
  sizeLimit: number,
  retries: number,
): Promise<{
  buffer: Buffer;
  mimeType: string;
  finalUrl: string;
  httpEvidence: {
    statusCode: number;
    statusText: string;
    headers: Record<string, string>;
    redirects: string[];
  };
}> {
  let attempt = 0;
  while (true) {
    try {
      let currentUrl = initialUrl;
      const redirects: string[] = [];
      let response: Response | null = null;
      const maxRedirects = 5;

      for (let r = 0; r < maxRedirects; r++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const res = await fetch(currentUrl, {
            redirect: "manual",
            signal: controller.signal,
            headers: { "User-Agent": "BlockifyMediaCrawler/1.0" },
          });
          clearTimeout(timeoutId);

          if (res.status >= 300 && res.status < 400) {
            const loc = res.headers.get("location");
            if (loc) {
              const nextUrl = new URL(loc, currentUrl).href;
              redirects.push(nextUrl);
              currentUrl = nextUrl;
              continue;
            }
          }
          response = res;
          break;
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      }

      if (!response) {
        throw new Error("Too many redirects");
      }

      if (!response.ok) {
        // Collect headers for evidence even on failure status
        const headersMap: Record<string, string> = {};
        response.headers.forEach((v, k) => {
          headersMap[k] = v;
        });
        const err: any = new Error(`HTTP error: ${response.status} ${response.statusText}`);
        err.statusCode = response.status;
        err.statusText = response.statusText;
        err.headers = headersMap;
        err.redirects = redirects;
        throw err;
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > sizeLimit) {
        throw new Error(`Size limit exceeded`);
      }

      const reader = response.body?.getReader();
      let buffer: Buffer;
      if (reader) {
        const chunks: Uint8Array[] = [];
        let total = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              total += value.length;
              if (total > sizeLimit) {
                throw new Error(`Size limit exceeded`);
              }
              chunks.push(value);
            }
          }
          buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
        } finally {
          reader.releaseLock();
        }
      } else {
        const arrayBuf = await response.arrayBuffer();
        if (arrayBuf.byteLength > sizeLimit) {
          throw new Error(`Size limit exceeded`);
        }
        buffer = Buffer.from(arrayBuf);
      }

      const headersMap: Record<string, string> = {};
      response.headers.forEach((v, k) => {
        headersMap[k] = v;
      });

      return {
        buffer,
        mimeType: contentType,
        finalUrl: currentUrl,
        httpEvidence: {
          statusCode: response.status,
          statusText: response.statusText,
          headers: headersMap,
          redirects,
        },
      };
    } catch (err: any) {
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
    }
  }
}

function getExtension(mimeType: string | null, originalUrl: string): string {
  if (mimeType) {
    const mt = mimeType.toLowerCase();
    if (mt.includes("jpeg") || mt.includes("jpg")) return "jpg";
    if (mt.includes("png")) return "png";
    if (mt.includes("gif")) return "gif";
    if (mt.includes("webp")) return "webp";
    if (mt.includes("svg")) return "svg";
  }
  try {
    const pathname = new URL(originalUrl).pathname;
    const ext = pathname.split(".").pop();
    if (ext && /^[a-z0-9]{1,4}$/i.test(ext)) {
      return ext.toLowerCase();
    }
  } catch {
    // ignore
  }
  return "";
}

export async function crawlMedia(
  urls: string[],
  outputDir: string,
  opts: CrawlOptions = {},
): Promise<{
  downloaded: number;
  deduplicated: number;
  skipped: number;
  failed: number;
  manifest: MediaManifest;
}> {
  const concurrency = opts.concurrency ?? 3;
  const timeout = opts.timeout ?? 10000;
  const sizeLimit = opts.sizeLimit ?? 10 * 1024 * 1024;
  const retries = opts.retries ?? 3;

  const mediaDir = path.join(outputDir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });

  const manifestPath = path.join(outputDir, "manifest.json");
  let existingManifest: MediaManifest = { version: "1.0.0", media: [] };
  const existingMap = new Map<string, MediaManifestEntry>();

  if (fs.existsSync(manifestPath)) {
    try {
      const content = fs.readFileSync(manifestPath, "utf-8");
      existingManifest = JSON.parse(content);
      if (existingManifest && Array.isArray(existingManifest.media)) {
        for (const entry of existingManifest.media) {
          existingMap.set(entry.originalUrl, entry);
        }
      }
    } catch {
      // Ignore corrupted manifest, overwrite it
    }
  }

  const resultsMap = new Map<string, MediaManifestEntry>();
  const checksumToPath = new Map<string, string>();

  // Populate initial checksum mapping from already existing verified files
  for (const entry of existingMap.values()) {
    if (!entry.failureStatus && entry.localPath && entry.checksum) {
      const fullPath = path.join(outputDir, entry.localPath);
      if (fs.existsSync(fullPath)) {
        checksumToPath.set(entry.checksum, entry.localPath);
      }
    }
  }

  let downloadedCount = 0;
  let deduplicatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  const uniqueUrls = Array.from(new Set(urls));

  await runWithConcurrency(concurrency, uniqueUrls, async (url) => {
    const existing = existingMap.get(url);
    if (existing && !existing.failureStatus && existing.localPath) {
      const fullPath = path.join(outputDir, existing.localPath);
      if (fs.existsSync(fullPath)) {
        resultsMap.set(url, existing);
        skippedCount++;
        return;
      }
    }

    try {
      const download = await fetchWithManualRedirects(url, timeout, sizeLimit, retries);
      const sha256 = crypto.createHash("sha256").update(download.buffer).digest("hex");

      let finalLocalPath: string;
      const cachedPath = checksumToPath.get(sha256);
      if (cachedPath) {
        finalLocalPath = cachedPath;
        deduplicatedCount++;
      } else {
        const ext = getExtension(download.mimeType, url);
        const filename = ext ? `${sha256}.${ext}` : sha256;
        finalLocalPath = `media/${filename}`;

        fs.writeFileSync(path.join(outputDir, finalLocalPath), download.buffer);
        checksumToPath.set(sha256, finalLocalPath);
        downloadedCount++;
      }

      const dims = getImageDimensions(download.buffer);

      const entry: MediaManifestEntry = {
        originalUrl: url,
        finalUrl: download.finalUrl,
        localPath: finalLocalPath,
        mimeType: download.mimeType,
        byteLength: download.buffer.length,
        dimensions: dims,
        checksum: sha256,
        httpEvidence: download.httpEvidence,
        failureStatus: null,
      };

      resultsMap.set(url, entry);
    } catch (err: any) {
      failedCount++;
      let failureStatus = "unknown_error";
      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        failureStatus = "timeout";
      } else if (err.message?.includes("Size limit exceeded")) {
        failureStatus = "size_limit_exceeded";
      } else if (err.message?.includes("HTTP error")) {
        failureStatus = err.message;
      } else if (err.message) {
        failureStatus = err.message;
      }

      const evidence = err.headers
        ? {
            statusCode: err.statusCode,
            statusText: err.statusText,
            headers: err.headers,
            redirects: err.redirects || [],
          }
        : null;

      const entry: MediaManifestEntry = {
        originalUrl: url,
        finalUrl: err.redirects && err.redirects.length > 0 ? err.redirects[err.redirects.length - 1] : null,
        localPath: null,
        mimeType: null,
        byteLength: null,
        dimensions: null,
        checksum: null,
        httpEvidence: evidence,
        failureStatus,
      };

      resultsMap.set(url, entry);
    }
  });

  const finalMedia: MediaManifestEntry[] = [];
  for (const url of uniqueUrls) {
    const entry = resultsMap.get(url);
    if (entry) {
      finalMedia.push(entry);
    }
  }

  for (const [url, entry] of existingMap.entries()) {
    if (!resultsMap.has(url)) {
      finalMedia.push(entry);
    }
  }

  const manifest: MediaManifest = {
    version: "1.0.0",
    media: finalMedia,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  return {
    downloaded: downloadedCount,
    deduplicated: deduplicatedCount,
    skipped: skippedCount,
    failed: failedCount,
    manifest,
  };
}
