import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { fetchPage } from "../lib/fetchPage";

describe("Hardened URL fetching and crawler tests", () => {
  let server: http.Server;
  let serverUrl: string;
  const tempDir = path.join(__dirname, "temp_test_fetch_out");

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      let pathname = url.pathname;
      if (pathname.endsWith("/") && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }

      if (pathname === "/normal") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<html><head><title>Normal</title></head><body><a href=\"/slow\">Slow link</a></body></html>");
      } else if (pathname === "/slow") {
        setTimeout(() => {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end("<html><head><title>Slow</title></head><body>Too slow!</body></html>");
        }, 1000); // 1-second delay
      } else if (pathname === "/huge") {
        const largeText = "A".repeat(5000);
        res.writeHead(200, {
          "Content-Type": "text/html",
          "Content-Length": String(largeText.length),
        });
        res.end(largeText);
      } else if (pathname === "/non-html") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Plain text, not HTML content");
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
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

  // --- Group 1: fetchPage browser mode hardening tests ---
  describe("fetchPage function hardening", () => {
    it("fetches normal HTML page successfully", async () => {
      const html = await fetchPage(`${serverUrl}/normal`, { timeoutMs: 2000 });
      expect(html).toContain("Normal");
    });

    it("terminates and throws a descriptive error on slow page (timeout)", async () => {
      await expect(
        fetchPage(`${serverUrl}/slow`, { timeoutMs: 100 }),
      ).rejects.toThrow(/Request timed out after 100ms/);
    });

    it("terminates and throws a descriptive error on oversized page", async () => {
      await expect(
        fetchPage(`${serverUrl}/huge`, { maxBytes: 1000 }),
      ).rejects.toThrow(/exceeds the limit of 1000 bytes/);
    });

    it("rejects non-HTML responses", async () => {
      await expect(
        fetchPage(`${serverUrl}/non-html`),
      ).rejects.toThrow(/Rejected non-HTML response/);
    });
  });

  // --- Group 2: scripts/crawl.mjs command line hardening tests ---
  describe("scripts/crawl.mjs command line crawler hardening", () => {
    const runCrawler = (argsString: string): Promise<{ stdout: string; stderr: string; code: number }> => {
      return new Promise((resolve) => {
        const scriptPath = path.resolve(__dirname, "../../scripts/crawl.mjs");
        exec(`node ${scriptPath} ${argsString}`, (error, stdout, stderr) => {
          resolve({
            stdout,
            stderr,
            code: error ? (typeof error.code === "number" ? error.code : 1) : 0,
          });
        });
      });
    };

    it("saves normal crawled pages and handles/records skipped timeout pages", async () => {
      const crawlOut = path.join(tempDir, "crawl_normal_slow");
      // Run crawl starting with /normal, which links to /slow. Max 2 pages, delay 10ms, timeout 200ms
      const { code } = await runCrawler(`${serverUrl}/normal --max 2 --delay 10 --timeout 200 --out ${crawlOut}`);
      expect(code).toBe(0);

      const manifestPath = path.join(crawlOut, "pages.json");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const data = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(data.pages).toHaveLength(1);
      expect(data.pages[0].url).toBe(`${serverUrl}/normal/`);

      // Verify that the slow page was skipped due to timeout
      expect(data.skipped).toBeDefined();
      const slowSkip = data.skipped.find((s: string) => s.includes(`${serverUrl}/slow/`));
      expect(slowSkip).toBeDefined();
      expect(slowSkip).toContain("timed out after 200ms");
    });

    it("handles and records skipped oversized pages", async () => {
      const crawlOut = path.join(tempDir, "crawl_huge");
      // Seed crawler directly with the huge URL, size limit 1000 bytes
      const { code } = await runCrawler(`${serverUrl}/huge --max 1 --timeout 1000 --max-size 1000 --out ${crawlOut}`);
      expect(code).toBe(0);

      const manifestPath = path.join(crawlOut, "pages.json");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const data = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(data.pages).toHaveLength(0);

      expect(data.skipped).toBeDefined();
      const hugeSkip = data.skipped.find((s: string) => s.includes(`${serverUrl}/huge`));
      expect(hugeSkip).toBeDefined();
      expect(hugeSkip).toContain("exceeds the limit of 1000 bytes");
    });

    it("handles and records skipped non-HTML pages", async () => {
      const crawlOut = path.join(tempDir, "crawl_non_html");
      // Seed crawler directly with the non-HTML URL
      const { code } = await runCrawler(`${serverUrl}/non-html --max 1 --timeout 1000 --out ${crawlOut}`);
      expect(code).toBe(0);

      const manifestPath = path.join(crawlOut, "pages.json");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const data = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(data.pages).toHaveLength(0);

      expect(data.skipped).toBeDefined();
      const nonHtmlSkip = data.skipped.find((s: string) => s.includes(`${serverUrl}/non-html`));
      expect(nonHtmlSkip).toBeDefined();
      expect(nonHtmlSkip).toContain("Rejected non-HTML response");
    });
  });
});
