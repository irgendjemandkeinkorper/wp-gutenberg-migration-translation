#!/usr/bin/env node
// Same-origin site crawler → crawl/pages.json for Blockify's Batch tab.
//
//   node scripts/crawl.mjs https://example.com [--max 50] [--delay 500] [--timeout 10000] [--max-size 10485760] [--out crawl]
//
// BFS over same-site links, HTML pages only. Skips WordPress plumbing
// (wp-admin, wp-json, feeds, uploads), asset URLs, and query-string URLs
// (archives/calendars — rarely importable pages). Respects robots.txt
// Disallow rules for User-agent: *.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const USER_AGENT = "BlockifyCrawler/1.0 (site migration; one request per delay)";

const SKIP_EXT =
  /\.(css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|pdf|zip|gz|xml|rss|atom|mp3|mp4|mov|webm|woff2?|ttf|eot|docx?|xlsx?|pptx?)$/i;
const SKIP_PATH = [
  "/wp-admin",
  "/wp-json",
  "/wp-login",
  "/wp-content/",
  "/wp-includes/",
  "/feed",
  "/trackback",
  "/comment-page-",
  "xmlrpc.php",
];

function parseArgs(argv) {
  const args = {
    max: 50,
    delay: 500,
    out: "crawl",
    start: "",
    timeout: 10000,
    maxSize: 10485760,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--max") args.max = parseInt(argv[++i], 10);
    else if (a === "--delay") args.delay = parseInt(argv[++i], 10);
    else if (a === "--timeout") args.timeout = parseInt(argv[++i], 10);
    else if (a === "--max-size") args.maxSize = parseInt(argv[++i], 10);
    else if (a === "--out") args.out = argv[++i];
    else if (!a.startsWith("--") && !args.start) args.start = a;
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(1);
    }
  }
  if (
    !args.start ||
    !Number.isFinite(args.max) ||
    !Number.isFinite(args.delay) ||
    !Number.isFinite(args.timeout) ||
    !Number.isFinite(args.maxSize)
  ) {
    console.error(
      "Usage: node scripts/crawl.mjs <start-url> [--max 50] [--delay 500] [--timeout 10000] [--max-size 10485760] [--out crawl]",
    );
    process.exit(1);
  }
  return args;
}

function normalizeUrl(href, base) {
  let u;
  try {
    u = new URL(href, base);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.search) return null;
  u.hash = "";
  // WordPress canonicalizes to trailing slash; normalizing avoids fetching
  // /page and /page/ as two entries.
  if (!u.pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(u.pathname)) {
    u.pathname += "/";
  }
  return u.href;
}

function sameSite(url, startUrl) {
  const strip = (h) => h.replace(/^www\./, "");
  return strip(new URL(url).hostname) === strip(new URL(startUrl).hostname);
}

function shouldSkip(url) {
  const { pathname } = new URL(url);
  const lower = pathname.toLowerCase();
  if (SKIP_EXT.test(lower)) return true;
  return SKIP_PATH.some((p) => lower.includes(p));
}

async function loadRobotsDisallows(startUrl, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);
  try {
    const resp = await fetch(new URL("/robots.txt", startUrl), {
      headers: { "user-agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!resp.ok) return [];

    const contentLengthStr = resp.headers.get("content-length");
    if (contentLengthStr) {
      const contentLength = parseInt(contentLengthStr, 10);
      if (Number.isFinite(contentLength) && contentLength > options.maxSize) {
        return [];
      }
    }

    let text = "";
    const reader = resp.body?.getReader();
    if (reader) {
      const chunks = [];
      let bytesReceived = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            bytesReceived += value.length;
            if (bytesReceived > options.maxSize) {
              return [];
            }
            chunks.push(value);
          }
        }
      } finally {
        reader.releaseLock();
      }
      const combined = new Uint8Array(bytesReceived);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      text = new TextDecoder().decode(combined);
    } else {
      text = await resp.text();
      if (text.length > options.maxSize) {
        return [];
      }
    }

    const lines = text.split("\n");
    const disallows = [];
    let applies = false;
    for (const line of lines) {
      const parts = line.split(":");
      const rawKey = parts[0];
      if (!rawKey) continue;
      const key = rawKey.trim().toLowerCase();
      const value = parts.slice(1).join(":").split("#")[0].trim();
      if (key === "user-agent") applies = value === "*";
      else if (applies && key === "disallow" && value) disallows.push(value);
    }
    return disallows;
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractLinks(html, pageUrl) {
  const links = [];
  for (const m of html.matchAll(/href\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const href = (m[2] ?? m[3] ?? "").trim();
    if (href) {
      const n = normalizeUrl(href, pageUrl);
      if (n) links.push(n);
    }
  }
  return links;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seed = normalizeUrl(args.start, undefined);
  if (!seed) {
    console.error(`Not a crawlable URL: ${args.start}`);
    process.exit(1);
  }

  const disallows = await loadRobotsDisallows(seed, args);
  const disallowed = (url) => {
    const p = new URL(url).pathname;
    return disallows.some((d) => p.startsWith(d));
  };

  const queue = [seed];
  const seen = new Set([seed]);
  const pages = [];
  const skipped = [];

  while (queue.length && pages.length < args.max) {
    const url = queue.shift();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), args.timeout);
    let resp;
    try {
      resp = await fetch(url, {
        headers: { "user-agent": USER_AGENT },
        redirect: "follow",
        signal: controller.signal,
      });
    } catch (e) {
      const msg =
        e.name === "AbortError"
          ? `Request timed out after ${args.timeout}ms`
          : e.message;
      skipped.push(`${url} — ${msg}`);
      continue;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!resp.ok) {
      skipped.push(`${url} — HTTP ${resp.status}`);
      continue;
    }

    const contentType = resp.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      skipped.push(
        `${url} — Rejected non-HTML response (content-type: "${contentType}")`,
      );
      continue;
    }

    const contentLengthStr = resp.headers.get("content-length");
    if (contentLengthStr) {
      const contentLength = parseInt(contentLengthStr, 10);
      if (Number.isFinite(contentLength) && contentLength > args.maxSize) {
        skipped.push(
          `${url} — Rejected response as its size (${contentLength} bytes) exceeds the limit of ${args.maxSize} bytes`,
        );
        continue;
      }
    }

    let html = "";
    try {
      const reader = resp.body?.getReader();
      if (reader) {
        const chunks = [];
        let bytesReceived = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              bytesReceived += value.length;
              if (bytesReceived > args.maxSize) {
                throw new Error(
                  `Response size limit of ${args.maxSize} bytes exceeded`,
                );
              }
              chunks.push(value);
            }
          }
        } finally {
          reader.releaseLock();
        }
        const combined = new Uint8Array(bytesReceived);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        html = new TextDecoder().decode(combined);
      } else {
        html = await resp.text();
        if (html.length > args.maxSize) {
          throw new Error(
            `Response size limit of ${args.maxSize} bytes exceeded`,
          );
        }
      }
    } catch (e) {
      skipped.push(`${url} — ${e.message}`);
      continue;
    }

    const title = (html.match(/<title[^>]*>([^<]*)</i)?.[1] ?? "").trim();
    pages.push({ url, title, html });
    console.log(
      `[${pages.length}/${args.max}] ${url}  (${title || "no title"})`,
    );

    for (const link of extractLinks(html, url)) {
      if (seen.has(link)) continue;
      if (!sameSite(link, seed) || shouldSkip(link) || disallowed(link))
        continue;
      seen.add(link);
      queue.push(link);
    }
    if (queue.length) await sleep(args.delay);
  }

  await mkdir(args.out, { recursive: true });
  const outFile = join(args.out, "pages.json");
  await writeFile(
    outFile,
    JSON.stringify(
      {
        crawledAt: new Date().toISOString(),
        start: seed,
        pages,
        skipped,
      },
      null,
      1,
    ),
  );

  console.log(`\n${pages.length} pages → ${outFile}`);
  if (queue.length) {
    console.log(
      `Stopped at --max ${args.max}; ${queue.length} URLs still queued.`,
    );
  }
  if (skipped.length) {
    console.log(`Skipped ${skipped.length}:`);
    for (const s of skipped) console.log(`  ${s}`);
  }
}

main();
