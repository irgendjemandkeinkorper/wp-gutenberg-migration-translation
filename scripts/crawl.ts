import * as fs from "fs";
import * as path from "path";
import {
  crawlMedia,
  discoverImageCandidates,
  extractBaseUrlFromHtml,
} from "../src/lib/crawl-media";

function printHelp() {
  console.log(`
Blockify Media Crawler CLI
==========================

Usage:
  npx tsx scripts/crawl.ts --input <file_or_directory> [options]

Options:
  --input, -i       Path to an HTML file or a directory containing HTML files. (Required)
  --output, -o      Output directory for downloaded media and manifest.json. (Default: ./output_media)
  --baseUrl, -b     Fallback base URL to resolve relative URLs.
  --concurrency, -c Maximum concurrent requests. (Default: 3)
  --timeout, -t     Timeout per request in milliseconds. (Default: 10000)
  --sizeLimit, -s   Max file size in bytes. (Default: 10485760 - 10MB)
  --retries, -r     Number of download retries on failure. (Default: 3)
  --help, -h        Show this help message.
`);
}

async function main() {
  const args = process.argv.slice(2);

  let input: string | undefined;
  let output = "./output_media";
  let baseUrl: string | undefined;
  let concurrency = 3;
  let timeout = 10000;
  let sizeLimit = 10 * 1024 * 1024;
  let retries = 3;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg === "--input" || arg === "-i") {
      input = args[++i];
    } else if (arg === "--output" || arg === "-o") {
      output = args[++i];
    } else if (arg === "--baseUrl" || arg === "-b") {
      baseUrl = args[++i];
    } else if (arg === "--concurrency" || arg === "-c") {
      concurrency = parseInt(args[++i], 10);
    } else if (arg === "--timeout" || arg === "-t") {
      timeout = parseInt(args[++i], 10);
    } else if (arg === "--sizeLimit" || arg === "-s") {
      sizeLimit = parseInt(args[++i], 10);
    } else if (arg === "--retries" || arg === "-r") {
      retries = parseInt(args[++i], 10);
    }
  }

  if (!input) {
    console.error("Error: --input is required.");
    printHelp();
    process.exit(1);
  }

  if (!fs.existsSync(input)) {
    console.error(`Error: Input path '${input}' does not exist.`);
    process.exit(1);
  }

  // Gather HTML files
  const htmlFiles: string[] = [];
  const stat = fs.statSync(input);
  if (stat.isFile()) {
    htmlFiles.push(input);
  } else if (stat.isDirectory()) {
    const files = fs.readdirSync(input);
    for (const f of files) {
      if (f.endsWith(".html") || f.endsWith(".htm")) {
        htmlFiles.push(path.join(input, f));
      }
    }
  }

  if (htmlFiles.length === 0) {
    console.warn(`Warning: No HTML files found in '${input}'.`);
    process.exit(0);
  }

  console.log(`Scanning ${htmlFiles.length} HTML file(s) for images...`);

  const allUrls = new Set<string>();

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf-8");
    const extractedBase = extractBaseUrlFromHtml(html) || baseUrl;
    if (!extractedBase) {
      console.warn(
        `Warning: Could not determine base URL for file '${file}'. Relative URLs may fail. Pass --baseUrl to specify a fallback.`
      );
    }
    const resolvedBase = extractedBase || "http://localhost/";
    const candidates = discoverImageCandidates(html, resolvedBase);
    console.log(`- ${path.basename(file)}: Discovered ${candidates.length} candidate(s)`);
    for (const cand of candidates) {
      allUrls.add(cand);
    }
  }

  const urlsToCrawl = Array.from(allUrls);
  console.log(`Total unique candidate URLs to crawl: ${urlsToCrawl.length}`);

  if (urlsToCrawl.length === 0) {
    console.log("No candidates to crawl. Exiting.");
    process.exit(0);
  }

  console.log(`Starting media crawl with concurrency=${concurrency}, timeout=${timeout}ms, sizeLimit=${sizeLimit} bytes, retries=${retries}...`);

  const stats = await crawlMedia(urlsToCrawl, output, {
    concurrency,
    timeout,
    sizeLimit,
    retries,
  });

  console.log("\n========================================");
  console.log("Crawl Summary");
  console.log("========================================");
  console.log(`Downloaded:  ${stats.downloaded}`);
  console.log(`Deduplicated: ${stats.deduplicated}`);
  console.log(`Skipped:      ${stats.skipped}`);
  console.log(`Failed:       ${stats.failed}`);
  console.log("========================================");
  console.log(`Manifest saved to: ${path.join(output, "manifest.json")}\n`);
}

main().catch((err) => {
  console.error("Critical crawler error:", err);
  process.exit(1);
});
