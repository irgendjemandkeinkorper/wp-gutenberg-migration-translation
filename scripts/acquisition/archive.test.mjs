import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  appendArchive,
  contentReference,
  createRecord,
  sha256,
} from "./archive.mjs";

function snapshotRecord() {
  const rawBytes = Buffer.from("<html><body>Archived</body></html>");
  const html = "<html><body>Archived</body></html>";
  const rawHash = sha256(rawBytes);
  const htmlBytes = Buffer.from(html, "utf8");
  const htmlHash = sha256(htmlBytes);
  return {
    rawBytes,
    html,
    record: createRecord({
      recordId: "snapshot-1",
      recordKind: "page-snapshot",
      outcome: "success",
      requestedUrl: "https://example.test/",
      finalUrl: "https://example.test/",
      retrieval: {
        retrievedAt: "2026-08-03T00:00:00.000Z",
        method: "GET",
        userAgent: "test",
        durationMs: 1,
        responseHeaders: { "content-type": "text/html; charset=utf-8" },
      },
      status: 200,
      encoding: { declared: "utf-8", used: "utf-8", source: "content-type" },
      policy: { decision: "allow", reason: "test", robots: "allowed" },
      content: {
        rawBytes: contentReference(`blobs/raw/${rawHash}`, rawBytes),
        decodedHtml: contentReference(`blobs/html/${htmlHash}.html`, htmlBytes),
      },
    }),
  };
}

describe("filesystem acquisition archive", () => {
  it("stores immutable raw bytes, decoded HTML, and the matching record", async () => {
    const root = await mkdtemp(join(tmpdir(), "blockify-archive-"));
    try {
      const { record, rawBytes, html } = snapshotRecord();
      await appendArchive(root, record, { rawBytes, decodedHtml: html });
      await appendArchive(root, record, { rawBytes: Buffer.from("different"), decodedHtml: html }).catch((error) => {
        expect(error.message).toContain("hashes do not match");
      });

      const storedRaw = await readFile(join(root, "blobs", "raw", record.content.rawBytes.sha256));
      const storedHtml = await readFile(join(root, "blobs", "html", `${record.content.decodedHtml.sha256}.html`), "utf8");
      const storedRecord = JSON.parse(await readFile(join(root, "records", "snapshot-1.json"), "utf8"));
      const manifest = await readFile(join(root, "manifest.jsonl"), "utf8");
      expect(storedRaw.equals(rawBytes)).toBe(true);
      expect(storedHtml).toBe(html);
      expect(storedRecord.content.rawBytes.sha256).toBe(record.content.rawBytes.sha256);
      expect(manifest.trim().split("\n")).toHaveLength(1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
