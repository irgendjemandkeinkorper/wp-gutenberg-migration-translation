import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

function runCrawler(url, out) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      "scripts/crawl.mjs",
      url,
      "--max",
      "2",
      "--delay",
      "0",
      "--out",
      out,
    ], { cwd: process.cwd() });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`crawler exited ${code}: ${output}`));
    });
  });
}

describe("crawler acquisition integration", () => {
  it("archives redirects, non-HTML responses, failures, and successful HTML", async () => {
    const server = createServer((request, response) => {
      if (request.url === "/robots.txt") {
        response.writeHead(200, { "content-type": "text/plain" });
        response.end("User-agent: *\nAllow: /\nDisallow: /private");
      } else if (request.url === "/start/") {
        response.writeHead(302, { location: "/page" });
        response.end();
      } else if (request.url === "/page") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end('<html><head><title>Page</title></head><body><a href="/data">data</a><a href="/missing">missing</a><a href="/private">private</a></body></html>');
      } else if (request.url === "/data/") {
        response.writeHead(200, { "content-type": "application/pdf" });
        response.end("not html");
      } else {
        response.writeHead(404, { "content-type": "text/plain" });
        response.end("missing");
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const root = await mkdtemp(join(tmpdir(), "blockify-crawl-"));

    try {
      await runCrawler(`${baseUrl}/start`, root);
      const pages = JSON.parse(await readFile(join(root, "pages.json"), "utf8"));
      const lines = (await readFile(join(root, "archive", "manifest.jsonl"), "utf8"))
        .trim().split("\n").map((line) => JSON.parse(line));
      const outcomes = lines.map((record) => `${record.recordKind}:${record.outcome}`);

      expect(pages.pages).toHaveLength(1);
      expect(pages.pages[0].finalUrl).toBe(`${baseUrl}/page`);
      expect(pages.pages[0].snapshotId).toBeTruthy();
      expect(outcomes).toContain("page-snapshot:redirect");
      expect(outcomes).toContain("attempt:redirect");
      expect(outcomes).toContain("attempt:non-html");
      expect(outcomes).toContain("attempt:failure");
      const denied = lines.find((record) => record.errors?.some((error) => error.code === "robots-disallowed"));
      expect(denied?.policy).toMatchObject({ decision: "deny", robots: "disallowed" });
    } finally {
      await server.close();
      await rm(root, { recursive: true, force: true });
    }
  });
});
