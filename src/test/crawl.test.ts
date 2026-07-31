import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import {
  discoverImageCandidates,
  extractBaseUrlFromHtml,
  getImageDimensions,
  crawlMedia,
} from "../lib/crawl-media";

const MINIMAL_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789cc3070000020001614723c70000000049454e44ae426082",
  "hex"
);

const MINIMAL_GIF = Buffer.from(
  "47494638396101000100800000ffffff00000021f90401000000002c00000000010001000002024401003b",
  "hex"
);

const MOCK_JPEG = Buffer.from(
  "ffd8ffc0000b080002000301011100ffd9",
  "hex"
);

const MOCK_WEBP = Buffer.from(
  "524946461a00000057454250565038580a00000000000000090000130000",
  "hex"
);

describe("Candidate Image Discovery & Base URL Extraction", () => {
  it("discovers all kinds of images, picture/sources, and custom lazy-loading attributes", () => {
    const html = `
      <html>
        <body>
          <img src="/direct.png" alt="Direct Image">
          <img data-src="/lazy-data.jpg">
          <img data-lazy-src="relative/path/lazy.gif">
          <picture>
            <source srcset="/source1.webp 1x, /source2.webp 2x" media="(min-width: 800px)">
            <source data-srcset="/source-lazy.webp">
            <img src="/fallback.png">
          </picture>
          <img src="data:image/png;base64,invalid-data-uri-should-be-ignored">
        </body>
      </html>
    `;

    const candidates = discoverImageCandidates(html, "https://example.com/blog/page-1");

    expect(candidates).toContain("https://example.com/direct.png");
    expect(candidates).toContain("https://example.com/lazy-data.jpg");
    expect(candidates).toContain("https://example.com/blog/relative/path/lazy.gif");
    expect(candidates).toContain("https://example.com/source1.webp");
    expect(candidates).toContain("https://example.com/source2.webp");
    expect(candidates).toContain("https://example.com/source-lazy.webp");
    expect(candidates).toContain("https://example.com/fallback.png");

    // Ignore data URIs
    candidates.forEach(c => {
      expect(c.startsWith("data:")).toBe(false);
    });
  });

  it("extracts base URL from standard HTML canonical, og:url, base tags and comments", () => {
    const html1 = `<link rel="canonical" href="https://canonical.example.com/p1">`;
    expect(extractBaseUrlFromHtml(html1)).toBe("https://canonical.example.com/p1");

    const html2 = `<meta property="og:url" content="https://og.example.com/p2">`;
    expect(extractBaseUrlFromHtml(html2)).toBe("https://og.example.com/p2");

    const html3 = `<base href="https://base.example.com/p3">`;
    expect(extractBaseUrlFromHtml(html3)).toBe("https://base.example.com/p3");

    const html4 = `<!-- source: https://comment.example.com/p4 -->`;
    expect(extractBaseUrlFromHtml(html4)).toBe("https://comment.example.com/p4");
  });
});

describe("Binary Image Dimensions Parser", () => {
  it("parses minimal PNG image dimensions", () => {
    const dims = getImageDimensions(MINIMAL_PNG);
    expect(dims).toEqual({ width: 1, height: 1 });
  });

  it("parses minimal GIF image dimensions", () => {
    const dims = getImageDimensions(MINIMAL_GIF);
    expect(dims).toEqual({ width: 1, height: 1 });
  });

  it("parses mock JPEG segment dimensions", () => {
    const dims = getImageDimensions(MOCK_JPEG);
    expect(dims).toEqual({ width: 3, height: 2 });
  });

  it("parses mock WebP header dimensions", () => {
    const dims = getImageDimensions(MOCK_WEBP);
    expect(dims).toEqual({ width: 10, height: 20 });
  });

  it("returns null for invalid/truncated images", () => {
    const dims = getImageDimensions(Buffer.from([1, 2, 3, 4]));
    expect(dims).toBeNull();
  });
});

describe("crawlMedia Pipeline Integration Tests", () => {
  let server: http.Server;
  let serverUrl: string;
  const tempDir = path.join(__dirname, "temp_test_crawl_out");

  beforeAll(async () => {
    // Set up local deterministic mock HTTP fixture server
    server = http.createServer((req, res) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const pathname = url.pathname;

      if (pathname === "/image.png") {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(MINIMAL_PNG);
      } else if (pathname === "/image.jpg") {
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(MOCK_JPEG);
      } else if (pathname === "/redirect") {
        res.writeHead(302, { "Location": "/image.png" });
        res.end();
      } else if (pathname === "/double-redirect") {
        res.writeHead(302, { "Location": "/redirect" });
        res.end();
      } else if (pathname === "/404") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      } else if (pathname === "/huge") {
        res.writeHead(200, { "Content-Type": "image/png", "Content-Length": "99999999" });
        res.end(Buffer.alloc(100000)); // returns 100KB which exceeds small limit we will configure
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          serverUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    server.close();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("crawls expected images once, follows redirects, preserves query parameters, and generates manifest", async () => {
    const urls = [
      `${serverUrl}/image.png`,
      `${serverUrl}/image.png?version=123`, // query parameters
      `${serverUrl}/redirect`, // redirect
      `${serverUrl}/double-redirect`, // multi-redirect
      `${serverUrl}/404`, // failure
    ];

    const stats = await crawlMedia(urls, tempDir, {
      concurrency: 2,
      timeout: 2000,
      retries: 0,
    });

    // Check stats summary
    expect(stats.downloaded).toBe(1);
    expect(stats.deduplicated).toBe(3);
    expect(stats.failed).toBe(1);

    // Verify manifest file exists on disk
    const manifestPath = path.join(tempDir, "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifestData.version).toBe("1.0.0");
    expect(manifestData.media).toHaveLength(5);

    // Validate image.png entry
    const pngEntry = manifestData.media.find((m: any) => m.originalUrl === `${serverUrl}/image.png`);
    expect(pngEntry).toBeDefined();
    expect(pngEntry.failureStatus).toBeNull();
    expect(pngEntry.mimeType).toBe("image/png");
    expect(pngEntry.byteLength).toBe(MINIMAL_PNG.length);
    expect(pngEntry.dimensions).toEqual({ width: 1, height: 1 });
    expect(pngEntry.localPath).toContain("media/");
    expect(fs.existsSync(path.join(tempDir, pngEntry.localPath))).toBe(true);

    // Validate redirect entry
    const redirectEntry = manifestData.media.find((m: any) => m.originalUrl === `${serverUrl}/redirect`);
    expect(redirectEntry).toBeDefined();
    expect(redirectEntry.finalUrl).toBe(`${serverUrl}/image.png`);
    expect(redirectEntry.localPath).toBe(pngEntry.localPath); // deduplicated!
    expect(redirectEntry.httpEvidence.redirects).toEqual([`${serverUrl}/image.png`]);

    // Validate failure entry
    const failEntry = manifestData.media.find((m: any) => m.originalUrl === `${serverUrl}/404`);
    expect(failEntry).toBeDefined();
    expect(failEntry.failureStatus).toContain("404");
    expect(failEntry.localPath).toBeNull();
  });

  it("applies size limits and records failure in manifest", async () => {
    // Reset tempDir specifically for this test
    const sizeLimitDir = path.join(tempDir, "size_limit_test");
    const urls = [`${serverUrl}/huge`];

    const stats = await crawlMedia(urls, sizeLimitDir, {
      sizeLimit: 1000, // extremely small size limit
      retries: 0,
    });

    expect(stats.failed).toBe(1);
    const manifestPath = path.join(sizeLimitDir, "manifest.json");
    const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifestData.media[0].failureStatus).toBe("size_limit_exceeded");
  });

  it("resumes interrupted run by skipping successfully verified downloaded assets", async () => {
    const resumeDir = path.join(tempDir, "resume_test");
    const urls = [`${serverUrl}/image.png`];

    // 1. Run first crawl
    const stats1 = await crawlMedia(urls, resumeDir, { retries: 0 });
    expect(stats1.downloaded).toBe(1);
    expect(stats1.skipped).toBe(0);

    // 2. Run second crawl on same target directory
    const stats2 = await crawlMedia(urls, resumeDir, { retries: 0 });
    expect(stats2.downloaded).toBe(0);
    expect(stats2.skipped).toBe(1); // successfully skipped as verified resume asset!
  });
});
