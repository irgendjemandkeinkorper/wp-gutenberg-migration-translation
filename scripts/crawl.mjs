#!/usr/bin/env node
// Same-origin site crawler → crawl/pages.json for Blockify's Batch tab.
//
//   node scripts/crawl.mjs https://example.com [--max 50] [--delay 500] [--out crawl]
//
// BFS over same-site links, HTML pages only. Skips WordPress plumbing
// (wp-admin, wp-json, feeds, uploads), asset URLs, and query-string URLs
// (archives/calendars — rarely importable pages). Respects robots.txt
// Disallow rules for User-agent: *.

import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import {
  appendArchive,
  contentReference,
  createRecord,
  sha256,
} from "./acquisition/archive.mjs";
import {
  extractLinks,
  isRobotsDisallowed,
  normalizeUrl,
  parseRobotsDisallows,
  sameSite,
  shouldSkip,
} from "./crawler/logic.mjs";

const USER_AGENT = "BlockifyCrawler/1.0 (site migration; one request per delay)";

function parseArgs(argv) {
  const args = { max: 50, delay: 500, out: "crawl", start: "" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--max") args.max = parseInt(argv[++i], 10);
    else if (a === "--delay") args.delay = parseInt(argv[++i], 10);
    else if (a === "--out") args.out = argv[++i];
    else if (!a.startsWith("--") && !args.start) args.start = a;
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(1);
    }
  }
  if (!args.start || !Number.isFinite(args.max) || !Number.isFinite(args.delay)) {
    console.error(
      "Usage: node scripts/crawl.mjs <start-url> [--max 50] [--delay 500] [--out crawl]",
    );
    process.exit(1);
  }
  return args;
}

async function loadRobotsDisallows(startUrl) {
  try {
    const resp = await fetch(new URL("/robots.txt", startUrl), {
      headers: { "user-agent": USER_AGENT },
    });
    if (!resp.ok) return [];
    return parseRobotsDisallows(await resp.text());
  } catch {
    return [];
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function responseHeaders(response) {
  return Object.fromEntries(response.headers.entries());
}

function declaredEncoding(contentType) {
  const match = contentType.match(/charset\s*=\s*["']?([^;"'\s]+)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function recordId() {
  return `${new Date().toISOString().replace(/[-:.TZ]/g, "")}-${randomUUID()}`;
}

function retrieval(startedAt, headers) {
  return {
    retrievedAt: new Date(startedAt).toISOString(),
    method: "GET",
    userAgent: USER_AGENT,
    durationMs: Math.max(0, Date.now() - startedAt),
    responseHeaders: headers,
  };
}

function policyMetadata({ decision = "allow", reason = "Allowed by the crawler robots policy check.", robots = "allowed" } = {}) {
  return {
    decision,
    reason,
    robots,
  };
}

async function saveAttempt(archiveRoot, {
  requestedUrl,
  finalUrl = null,
  redirectChain = [],
  startedAt,
  headers = {},
  status = null,
  outcome,
  parentUrl,
  depth,
  policy = policyMetadata(),
  errors = [],
}) {
  const record = createRecord({
    recordId: recordId(),
    recordKind: "attempt",
    outcome,
    requestedUrl,
    finalUrl,
    redirectChain,
    retrieval: retrieval(startedAt, headers),
    status,
    parentUrl,
    depth,
    policy,
    errors,
  });
  await appendArchive(archiveRoot, record);
  return record;
}

async function acquirePage(archiveRoot, requestedUrl, { parentUrl, depth }) {
  const startedAt = Date.now();
  const redirectChain = [];
  let currentUrl = requestedUrl;

  for (let redirects = 0; redirects <= 10; redirects++) {
    let response;
    try {
      response = await fetch(currentUrl, {
        headers: { "user-agent": USER_AGENT },
        redirect: "manual",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const record = await saveAttempt(archiveRoot, {
        requestedUrl,
        finalUrl: currentUrl,
        redirectChain,
        startedAt,
        outcome: "failure",
        parentUrl,
        depth,
        errors: [{ code: "network-error", message, retryable: true }],
      });
      return { record };
    }

    const headers = responseHeaders(response);
    const location = headers.location;
    if (response.status >= 300 && response.status < 400 && location) {
      const nextUrl = new URL(location, currentUrl).href;
      const hop = { fromUrl: currentUrl, toUrl: nextUrl, status: response.status };
      redirectChain.push(hop);
      await saveAttempt(archiveRoot, {
        requestedUrl,
        finalUrl: nextUrl,
        redirectChain: [...redirectChain],
        startedAt,
        headers,
        status: response.status,
        outcome: "redirect",
        parentUrl,
        depth,
      });
      currentUrl = nextUrl;
      continue;
    }

    if (!response.ok) {
      const record = await saveAttempt(archiveRoot, {
        requestedUrl,
        finalUrl: currentUrl,
        redirectChain,
        startedAt,
        headers,
        status: response.status,
        outcome: "failure",
        parentUrl,
        depth,
        errors: [{
          code: "http-error",
          message: `HTTP ${response.status}`,
          retryable: response.status >= 500,
        }],
      });
      return { record };
    }

    const contentType = headers["content-type"] ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      const record = await saveAttempt(archiveRoot, {
        requestedUrl,
        finalUrl: currentUrl,
        redirectChain,
        startedAt,
        headers,
        status: response.status,
        outcome: "non-html",
        parentUrl,
        depth,
        errors: [{
          code: "non-html-response",
          message: `Content-Type ${contentType || "unknown"}`,
          retryable: false,
        }],
      });
      return { record };
    }

    const rawBytes = Buffer.from(await response.arrayBuffer());
    const declared = declaredEncoding(contentType);
    const used = declared || "utf-8";
    let html;
    try {
      html = new TextDecoder(used, { fatal: false }).decode(rawBytes);
    } catch {
      html = new TextDecoder("utf-8", { fatal: false }).decode(rawBytes);
    }
    const rawHash = sha256(rawBytes);
    const htmlBytes = Buffer.from(html, "utf8");
    const htmlHash = sha256(htmlBytes);
    const record = createRecord({
      recordId: recordId(),
      recordKind: "page-snapshot",
      outcome: redirectChain.length ? "redirect" : "success",
      requestedUrl,
      finalUrl: currentUrl,
      redirectChain,
      retrieval: retrieval(startedAt, headers),
      status: response.status,
      encoding: {
        declared,
        used,
        source: declared ? "content-type" : "default",
      },
      parentUrl,
      depth,
      policy: policyMetadata(),
      content: {
        rawBytes: contentReference(`blobs/raw/${rawHash}`, rawBytes),
        decodedHtml: contentReference(`blobs/html/${htmlHash}.html`, htmlBytes),
      },
    });
    await appendArchive(archiveRoot, record, { rawBytes, decodedHtml: html });
    return { record, html, finalUrl: currentUrl };
  }

  const record = await saveAttempt(archiveRoot, {
    requestedUrl,
    finalUrl: currentUrl,
    redirectChain,
    startedAt,
    outcome: "failure",
    parentUrl,
    depth,
    errors: [{ code: "redirect-loop", message: "More than 10 redirects.", retryable: false }],
  });
  return { record };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seed = normalizeUrl(args.start, undefined);
  if (!seed) {
    console.error(`Not a crawlable URL: ${args.start}`);
    process.exit(1);
  }

  const disallows = await loadRobotsDisallows(seed);

  const archiveRoot = join(args.out, "archive");
  const queue = [{ url: seed, parentUrl: null, depth: 0 }];
  const seen = new Set([seed]);
  const pages = [];
  const skipped = [];

  while (queue.length && pages.length < args.max) {
    const { url, parentUrl, depth } = queue.shift();
    const acquisition = await acquirePage(archiveRoot, url, { parentUrl, depth });
    if (!acquisition.html) {
      const detail = acquisition.record.errors[0]?.message ?? acquisition.record.outcome;
      skipped.push(`${url} — ${detail}`);
      continue;
    }
    const { html } = acquisition;
    const title = (html.match(/<title[^>]*>([^<]*)</i)?.[1] ?? "").trim();
    pages.push({
      url,
      title,
      html,
      finalUrl: acquisition.finalUrl,
      snapshotId: acquisition.record.recordId,
      contentHashes: {
        rawBytesSha256: acquisition.record.content.rawBytes.sha256,
        decodedHtmlSha256: acquisition.record.content.decodedHtml.sha256,
      },
    });
    console.log(`[${pages.length}/${args.max}] ${url} → ${acquisition.finalUrl}  (${title || "no title"})`);

    for (const link of extractLinks(html, acquisition.finalUrl)) {
      if (seen.has(link)) continue;
      if (!sameSite(link, seed) || shouldSkip(link)) continue;
      seen.add(link);
      if (isRobotsDisallowed(link, disallows)) {
        await saveAttempt(archiveRoot, {
          requestedUrl: link,
          finalUrl: link,
          startedAt: Date.now(),
          outcome: "failure",
          parentUrl: url,
          depth: depth + 1,
          policy: policyMetadata({
            decision: "deny",
            reason: "Blocked by robots.txt policy.",
            robots: "disallowed",
          }),
          errors: [{
            code: "robots-disallowed",
            message: "URL was not fetched because robots.txt disallows it.",
            retryable: false,
          }],
        });
        skipped.push(`${link} — robots.txt disallowed`);
        continue;
      }
      queue.push({ url: link, parentUrl: url, depth: depth + 1 });
    }
    if (queue.length) await sleep(args.delay);
  }

  await mkdir(args.out, { recursive: true });
  const outFile = join(args.out, "pages.json");
  await writeFile(
    outFile,
    JSON.stringify({ crawledAt: new Date().toISOString(), start: seed, pages }, null, 1),
  );

  console.log(`\n${pages.length} pages → ${outFile}`);
  if (queue.length) {
    console.log(`Stopped at --max ${args.max}; ${queue.length} URLs still queued.`);
  }
  if (skipped.length) {
    console.log(`Skipped ${skipped.length}:`);
    for (const s of skipped) console.log(`  ${s}`);
  }
}

main();
