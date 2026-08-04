import { describe, expect, it } from "vitest";
import {
  IR_SCHEMA_VERSION,
  IR_NODE_KINDS,
  migrateToCurrentIr,
  parseSemanticDocument,
  serializeSemanticDocument,
  sourceEvidenceFromSnapshot,
  stableNodeId,
  validateSemanticDocument,
  type NodeKind,
  type SemanticDocument,
  type SemanticNode,
  type SourceEvidence,
} from "../lib/ir";
import { ACQUISITION_CONTRACT_VERSION } from "../lib/acquisition/contract";
import type { ArchivedPageSnapshot } from "../lib/acquisition/contract";

function evidence(path: string, snapshotId = "snapshot-1"): SourceEvidence {
  return {
    snapshotId,
    locator: { kind: "structural-path", value: path },
    htmlExcerpt: {
      contentKind: "decoded-html",
      contentSha256: "abc123",
      storageKey: "blobs/html/abc123.html",
      startOffset: 0,
      endOffset: 12,
    },
  };
}

function node(kind: NodeKind, path: string, children: SemanticNode[] = []): SemanticNode {
  const base = {
    id: stableNodeId({ snapshotId: "snapshot-1", structuralPath: path, kind }),
    kind,
    source: evidence(path),
    children,
    text: kind === "image" ? null : kind,
    attributes: { role: kind },
    assetRefs: kind === "image" ? [{ assetId: "asset-1", role: "content", ordinal: 0, extensions: {} }] : [],
    classification: { confidence: 0.92, method: "rule" as const },
    auditEvents: [
      {
        type: "extracted" as const,
        code: "fixture",
        message: "Fixture extraction.",
        at: "2026-08-03T00:00:00.000Z",
      },
    ],
    extensions: {},
  };
  if (kind === "unknown") {
    return {
      ...base,
      kind: "unknown",
      unknown: {
        originalKind: "custom-widget",
        rawHtml: '<custom-widget data-id="7">Keep me</custom-widget>',
        reason: "No supported semantic mapping.",
        rawAttributes: { "data-id": "7" },
      },
    };
  }
  return base as SemanticNode;
}

function fixtureDocument(): SemanticDocument {
  const kinds = IR_NODE_KINDS.filter((kind) => kind !== "document");
  const root = node("document", "/") as SemanticDocument["root"];
  root.children = kinds.map((kind, index) => node(kind, `/main/child[${index}]`));
  return {
    schemaVersion: IR_SCHEMA_VERSION,
    documentId: "document-1",
    source: evidence("/"),
    title: "IR fixture",
    root,
    compatibility: {
      reader: "forward-compatible",
      minimumReaderVersion: IR_SCHEMA_VERSION,
      unknownFields: "preserve",
    },
    extensions: { fixture: true },
  };
}

describe("semantic IR v1", () => {
  it("anchors evidence to the existing archived acquisition snapshot", () => {
    const snapshot: ArchivedPageSnapshot = {
      record: {
        contractVersion: ACQUISITION_CONTRACT_VERSION,
        semanticVersion: "1.0.0",
        recordId: "archived-1",
        recordKind: "page-snapshot",
        outcome: "success",
        requestedUrl: "https://example.test/page",
        finalUrl: "https://example.test/page",
        redirectChain: [],
        retrieval: {
          retrievedAt: "2026-08-03T00:00:00.000Z",
          method: "GET",
          userAgent: "fixture",
          durationMs: 1,
          responseHeaders: {},
        },
        status: 200,
        encoding: { declared: "utf-8", used: "utf-8", source: "content-type" },
        discovery: { parentUrl: null, depth: 0 },
        policy: { decision: "allow", reason: "fixture", robots: "allowed" },
        errors: [],
        content: {
          rawBytes: { sha256: "raw", byteLength: 10, storageKey: "blobs/raw/raw" },
          decodedHtml: { sha256: "decoded", byteLength: 12, storageKey: "blobs/html/decoded.html" },
        },
        compatibility: {
          reader: "forward-compatible",
          minimumReaderVersion: "1.0.0",
          unknownFields: "ignore",
        },
      },
      decodedHtml: "<p>Archived</p>",
    };

    expect(
      sourceEvidenceFromSnapshot(
        snapshot,
        { kind: "css", value: "main p" },
        {
          startOffset: 3,
          endOffset: 12,
        },
      ),
    ).toEqual({
      snapshotId: "archived-1",
      locator: { kind: "css", value: "main p" },
      htmlExcerpt: {
        contentKind: "decoded-html",
        contentSha256: "decoded",
        storageKey: "blobs/html/decoded.html",
        startOffset: 3,
        endOffset: 12,
      },
    });
  });

  it("covers the PRD node vocabulary and validates ordered, evidenced nodes", () => {
    const document = fixtureDocument();
    const result = validateSemanticDocument(document);

    expect(result).toEqual({ valid: true, errors: [] });
    expect(document.root.children.map((child) => child.kind)).toEqual(
      IR_NODE_KINDS.filter((kind) => kind !== "document"),
    );
    expect(document.root.children.every((child) => child.source.snapshotId === "snapshot-1")).toBe(true);
    expect(document.root.children.every((child) => child.classification.method === "rule")).toBe(true);
  });

  it("round-trips without changing order, IDs, evidence, or extensions", () => {
    const document = fixtureDocument();
    const roundTripped = parseSemanticDocument(serializeSemanticDocument(document));

    expect(roundTripped).toEqual(document);
    expect(roundTripped.root.children.map((child) => child.id)).toEqual(
      document.root.children.map((child) => child.id),
    );
    expect(roundTripped.extensions).toEqual({ fixture: true });
  });

  it("preserves unsupported content as a lossless unknown node", () => {
    const unknown = fixtureDocument().root.children.find((child) => child.kind === "unknown");
    expect(unknown?.kind).toBe("unknown");
    if (unknown?.kind !== "unknown") throw new Error("unknown fixture missing");

    expect(unknown.unknown.rawHtml).toBe('<custom-widget data-id="7">Keep me</custom-widget>');
    expect(validateSemanticDocument(fixtureDocument()).valid).toBe(true);
  });

  it("rejects duplicate IDs, out-of-range confidence, and URL-only assets", () => {
    const invalid = JSON.parse(serializeSemanticDocument(fixtureDocument())) as Record<string, unknown>;
    const root = invalid.root as Record<string, unknown>;
    const children = root.children as Record<string, unknown>[];
    children[1].id = children[0].id;
    (children[2].classification as Record<string, unknown>).confidence = 1.5;
    (children[3].assetRefs as Record<string, unknown>[]).push({
      assetId: "asset-2",
      role: "source",
      ordinal: 1,
      extensions: {},
      src: "https://example.test/image.jpg",
    });

    const result = validateSemanticDocument(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["duplicate-id", "range", "asset-url"]),
    );
  });

  it("migrates the documented 0.1.0 shape and preserves unknown legacy HTML", () => {
    const legacy = {
      schemaVersion: "0.1.0",
      documentId: "legacy-document",
      sourceSnapshotId: "legacy-snapshot",
      title: "Legacy page",
      nodes: [
        {
          id: "legacy-heading",
          type: "text",
          sourcePath: "/main/h1[1]",
          htmlExcerpt: "<h1>Legacy</h1>",
          text: "Legacy",
        },
        {
          id: "legacy-widget",
          type: "vendor-widget",
          sourcePath: "/main/div[1]",
          htmlExcerpt: '<vendor-widget data-id="9">Do not drop</vendor-widget>',
          assetIds: ["asset-legacy"],
          extensions: { legacyFlag: true },
        },
      ],
    };

    const result = migrateToCurrentIr(legacy);
    expect(result.fromVersion).toBe("0.1.0");
    expect(result.toVersion).toBe("1.0.0");
    expect(result.document.root.children[0].kind).toBe("paragraph");
    expect(result.document.root.children[1].kind).toBe("unknown");
    const unknown = result.document.root.children[1];
    if (unknown.kind !== "unknown") throw new Error("migration did not preserve unknown node");
    expect(unknown.unknown.rawHtml).toBe('<vendor-widget data-id="9">Do not drop</vendor-widget>');
    expect(unknown.assetRefs[0].assetId).toBe("asset-legacy");
    expect(validateSemanticDocument(result.document).valid).toBe(true);
  });

  it("accepts additive future 1.x.y documents without rewriting them", () => {
    const future = fixtureDocument() as unknown as Record<string, unknown>;
    future.schemaVersion = "1.2.0";
    (future.extensions as Record<string, unknown>).futureField = { retained: true };

    const result = migrateToCurrentIr(future);
    expect(result.fromVersion).toBe("1.2.0");
    expect(result.toVersion).toBe("1.2.0");
    expect(result.changes).toEqual([]);
    expect(result.document.extensions).toEqual({ fixture: true, futureField: { retained: true } });
  });
});
