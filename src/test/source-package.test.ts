import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildSourceEvidencePackage,
  readSourceEvidencePackage,
  snapshotsFromSourceEvidencePackage,
  writeSourceEvidencePackage,
} from "../lib/acquisition/source-package";
import type { ArchivedPageSnapshot } from "../lib/acquisition/contract";

function snapshot(id: string, url: string): ArchivedPageSnapshot {
  return {
    record: {
      contractVersion: "1.0.0",
      semanticVersion: "1.0.0",
      recordId: id,
      recordKind: "page-snapshot",
      outcome: "success",
      requestedUrl: url,
      finalUrl: url,
      redirectChain: [],
      retrieval: {
        retrievedAt: "2026-08-03T00:00:00.000Z",
        method: "GET",
        userAgent: "fixture",
        durationMs: 1,
        responseHeaders: { authorization: "secret", "content-type": "text/html" },
      },
      status: 200,
      encoding: { declared: "utf-8", used: "utf-8", source: "content-type" },
      discovery: { parentUrl: null, depth: 0 },
      policy: { decision: "allow", reason: "fixture", robots: "allowed" },
      errors: [],
      content: {
        rawBytes: { sha256: "raw", byteLength: 5, storageKey: "raw/a" },
        decodedHtml: { sha256: "html", byteLength: 14, storageKey: "html/a" },
      },
      compatibility: { reader: "forward-compatible", minimumReaderVersion: "1.0.0", unknownFields: "ignore" },
    },
    decodedHtml: `<p>${id}</p>`,
  };
}

describe("portable source-evidence package", () => {
  it("exports redacted records, stable duplicate-safe files, and reconstructs offline snapshots", async () => {
    const source = buildSourceEvidencePackage({
      snapshots: [snapshot("page/one", "https://example.test/a"), snapshot("page-two", "https://example.test/a")],
      createdAt: "2026-08-03T00:00:00.000Z",
    });
    expect(source.manifest.files.map((file) => file.path)).toContain("html/page_one.html");
    expect(source.manifest.records[0].retrieval.responseHeaders.authorization).toBeUndefined();
    const directory = await mkdtemp(join(tmpdir(), "blockify-source-package-"));
    try {
      await writeSourceEvidencePackage(directory, source);
      const imported = await readSourceEvidencePackage(directory);
      expect(snapshotsFromSourceEvidencePackage(imported)).toHaveLength(2);
      expect(await readFile(join(directory, "manifest.json"), "utf8")).toContain("source");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects traversal paths and corrupt file hashes", async () => {
    const source = buildSourceEvidencePackage({ snapshots: [snapshot("page-one", "https://example.test/a")] });
    const directory = await mkdtemp(join(tmpdir(), "blockify-source-package-"));
    try {
      await writeSourceEvidencePackage(directory, source);
      const htmlPath = join(directory, "html/page-one.html");
      await import("node:fs/promises").then(({ writeFile }) => writeFile(htmlPath, "tampered"));
      await expect(readSourceEvidencePackage(directory)).rejects.toThrow(/hash mismatch/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
