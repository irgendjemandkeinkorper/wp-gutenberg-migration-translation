import { afterEach, describe, expect, it, vi } from "vitest";
import { convertPage } from "../lib/pipeline";
import { ImmutableSourceArchive } from "../lib/acquisition/archive";
import { ACQUISITION_CONTRACT_VERSION, archivedSnapshotSource } from "../lib/acquisition/contract";
import type { AcquisitionRecord, ArchivedPageSnapshot } from "../lib/acquisition/contract";

function record(id: string): AcquisitionRecord {
  return {
    contractVersion: ACQUISITION_CONTRACT_VERSION,
    semanticVersion: "1.0.0",
    recordId: id,
    recordKind: "page-snapshot",
    outcome: "success",
    requestedUrl: "https://example.test/about",
    finalUrl: "https://example.test/about/",
    redirectChain: [],
    retrieval: {
      retrievedAt: "2026-08-03T00:00:00.000Z",
      method: "GET",
      userAgent: "test",
      durationMs: 10,
      responseHeaders: { "content-type": "text/html; charset=utf-8" },
    },
    status: 200,
    encoding: { declared: "utf-8", used: "utf-8", source: "content-type" },
    discovery: { parentUrl: null, depth: 0 },
    policy: { decision: "allow", reason: "test", robots: "allowed" },
    errors: [],
    content: {
      rawBytes: { sha256: "raw", byteLength: 10, storageKey: "blobs/raw/raw" },
      decodedHtml: { sha256: "html", byteLength: 10, storageKey: "blobs/html/html.html" },
    },
    compatibility: {
      reader: "forward-compatible",
      minimumReaderVersion: "1.0.0",
      unknownFields: "ignore",
    },
  };
}

describe("versioned acquisition archive", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("appends evidence without replacing an earlier record", () => {
    const firstRecord = record("first");
    const first = new ImmutableSourceArchive().append(firstRecord, "<p>first</p>");
    const second = first.append({ ...firstRecord, recordId: "second" }, "<p>second</p>");

    expect(first.records()).toHaveLength(1);
    expect(second.records()).toHaveLength(2);
    expect(first.latestSnapshot("https://example.test/about")?.decodedHtml).toBe("<p>first</p>");
    expect(() => first.append(firstRecord)).toThrow("already exists");
  });

  it("exposes an archived source for conversion without source networking", async () => {
    const snapshot: ArchivedPageSnapshot = {
      record: record("offline") as ArchivedPageSnapshot["record"],
      decodedHtml: "<html><head><title>Offline</title></head><body><main><p>Archived</p></main></body></html>",
    };
    expect(archivedSnapshotSource(snapshot)).toMatchObject({
      kind: "archive",
      snapshotId: "offline",
      finalUrl: "https://example.test/about/",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network must not be used");
      }),
    );

    const result = await convertPage(
      {
        archivedSnapshot: snapshot,
        apiKey: "",
        model: "offline",
        skipLlm: true,
      },
      () => {},
    );

    expect(result.sourceUrl).toBe("https://example.test/about/");
    expect(result.sourceHtml).toBe(snapshot.decodedHtml);
    expect(result.blocks).toContain("Archived");
    expect(fetch).not.toHaveBeenCalled();
  });
});
