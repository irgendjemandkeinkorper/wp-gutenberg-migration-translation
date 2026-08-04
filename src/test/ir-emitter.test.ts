import { describe, expect, it } from "vitest";
import { createMediaRegistry } from "../lib/media/registry";
import { emitSemanticIr, SemanticIrEmissionError, serializeSemanticDocument } from "../lib/ir";
import type { ArchivedPageSnapshot } from "../lib/acquisition/contract";
import type { AssetRef, PageResult } from "../lib/types";

const pageUrl = "https://example.test/source-page";
const imageUrl = "https://cdn.example.test/images/hero.jpg";
const sourceHtml = `<html><body>
  <h2>Title</h2>
  <p>Intro <strong>bold</strong></p>
  <ul><li>One</li><li>Two</li></ul>
  <blockquote><p>A quote</p></blockquote>
  <pre>const answer = 42;</pre>
  <table><tbody><tr><td>Cell</td></tr></tbody></table>
  <p><img src="${imageUrl}" alt="Hero"></p>
  <custom-widget data-id="7">Keep me</custom-widget>
</body></html>`;
const deterministicHtml = `<h2>Title</h2>
<p>Intro <strong>bold</strong></p>
<ul><li>One</li><li>Two</li></ul>
<blockquote><p>A quote</p></blockquote>
<pre>const answer = 42;</pre>
<table><tbody><tr><td>Cell</td></tr></tbody></table>
<p>⟦ASSET_0⟧</p>
<custom-widget data-id="7">Keep me</custom-widget>`;

function snapshot(): ArchivedPageSnapshot {
  return {
    record: {
      contractVersion: "1.0.0",
      semanticVersion: "1.0.0",
      recordId: "snapshot-emitter-1",
      recordKind: "page-snapshot",
      outcome: "success",
      requestedUrl: pageUrl,
      finalUrl: pageUrl,
      redirectChain: [],
      retrieval: {
        retrievedAt: "2026-08-03T00:00:00.000Z",
        method: "GET",
        userAgent: "fixture",
        durationMs: 1,
        responseHeaders: { "content-type": "text/html; charset=utf-8" },
      },
      status: 200,
      encoding: { declared: "utf-8", used: "utf-8", source: "content-type" },
      discovery: { parentUrl: null, depth: 0 },
      policy: { decision: "allow", reason: "fixture", robots: "allowed" },
      errors: [],
      content: {
        rawBytes: { sha256: "raw-emitter", byteLength: sourceHtml.length, storageKey: "blobs/raw/raw-emitter" },
        decodedHtml: { sha256: "html-emitter", byteLength: sourceHtml.length, storageKey: "blobs/html/html-emitter" },
      },
      compatibility: {
        reader: "forward-compatible",
        minimumReaderVersion: "1.0.0",
        unknownFields: "ignore",
      },
    },
    decodedHtml: sourceHtml,
  };
}

function image(): AssetRef {
  return {
    index: 0,
    type: "image",
    src: imageUrl,
    alt: "Hero",
    caption: "",
    tagName: "img",
    attributes: { alt: "Hero", src: imageUrl },
    excerpt: `<img src="${imageUrl}" alt="Hero">`,
  };
}

function page(html = deterministicHtml, assets: AssetRef[] = [image()]): PageResult {
  return {
    title: "Emitter fixture",
    sourceUrl: pageUrl,
    blocks: "",
    intermediateHtml: html,
    sourceHtml,
    placeholders: [],
    images: assets,
    lostPositions: [],
    warnings: [],
  };
}

describe("semantic IR emitter", () => {
  it("maps deterministic supported elements in order with structural evidence", () => {
    const document = emitSemanticIr({
      snapshot: snapshot(),
      page: page(),
      boilerplateExclusions: [{ selector: "nav, footer", count: 1, reason: "source chrome" }],
    });

    expect(document.schemaVersion).toBe("1.0.0");
    expect(document.root.children.map((node) => node.kind)).toEqual([
      "heading",
      "paragraph",
      "list",
      "quote",
      "code",
      "table",
      "image",
      "unknown",
    ]);
    expect(document.root.children[0].source.locator).toEqual({
      kind: "structural-path",
      value: "/body[1]/h2[1]",
    });
    expect(document.root.children.every((node) => node.source.snapshotId === "snapshot-emitter-1")).toBe(true);
    expect(document.root.children.every((node) => node.source.htmlExcerpt.excerpt)).toBe(true);
    expect(document.root.children[1].children[0].kind).toBe("rich-text-span");
    expect(document.root.children[1].children[0].text).toBe("bold");
    expect(document.root.children[0].extensions.sourceTag).toBe("h2");
    expect(document.root.children[6].extensions.sourceTag).toBe("img");
    expect(document.root.children[5].extensions.rows).toEqual([{ cells: [{ text: "Cell", header: false }] }]);
    expect(document.root.auditEvents.map((event) => event.code)).toContain("boilerplate-exclusion");
  });

  it("resolves tokenized assets to media-registry IDs without URL references", () => {
    const registry = createMediaRegistry([
      {
        pageUrl,
        sourceUrl: imageUrl,
        baseUrl: pageUrl,
        nodeIndex: 0,
        alt: "Hero",
        field: "src",
      },
    ]).registry;
    const document = emitSemanticIr({ snapshot: snapshot(), page: page(), mediaRegistry: registry });
    const imageNode = document.root.children.find((node) => node.kind === "image");
    if (!imageNode) throw new Error("image node missing");

    expect(imageNode.assetRefs).toEqual([
      expect.objectContaining({
        assetId: registry.records[0].recordId,
        ordinal: 0,
      }),
    ]);
    expect(JSON.stringify(imageNode.assetRefs)).not.toContain(imageUrl);
    expect(imageNode.auditEvents[0].code).toBe("asset-token-resolved");
  });

  it("preserves unsupported content losslessly as an unknown node", () => {
    const document = emitSemanticIr({ snapshot: snapshot(), page: page() });
    const unknown = document.root.children.at(-1);
    if (!unknown || unknown.kind !== "unknown") throw new Error("unknown node missing");

    expect(unknown.unknown).toEqual({
      originalKind: "custom-widget",
      rawHtml: '<custom-widget data-id="7">Keep me</custom-widget>',
      reason: "No semantic IR v1 mapping exists for this source element.",
      rawAttributes: { "data-id": "7" },
    });
    expect(unknown.auditEvents[0].code).toBe("unknown-content-preserved");
  });

  it("is deterministic for the same archived page and pipeline result", () => {
    const first = emitSemanticIr({ snapshot: snapshot(), page: page() });
    const second = emitSemanticIr({ snapshot: snapshot(), page: page() });
    expect(serializeSemanticDocument(first)).toBe(serializeSemanticDocument(second));
  });

  it("fails closed on token drift and un-tokenized media", () => {
    expect(() =>
      emitSemanticIr({
        snapshot: snapshot(),
        page: page("<p>No issued token</p>"),
      }),
    ).toThrowError(SemanticIrEmissionError);
    try {
      emitSemanticIr({ snapshot: snapshot(), page: page("<p>No issued token</p>") });
    } catch (error) {
      expect(error).toMatchObject({ code: "asset-token-drift" });
    }

    expect(() =>
      emitSemanticIr({
        snapshot: snapshot(),
        page: page('<p><img src="https://example.test/un-tokenized.jpg"></p>', []),
      }),
    ).toThrowError(/was not represented by an asset token/);
  });

  it("preserves ordered gallery/slideshow collections as first-class IR", () => {
    const second = { ...image(), index: 1, src: "https://cdn.example.test/images/card.jpg" };
    const document = emitSemanticIr({
      snapshot: snapshot(),
      page: page('<div class="gallery"><span>⟦ASSET_0⟧</span><span>⟦ASSET_1⟧</span></div>', [image(), second]),
    });
    expect(document.root.children).toHaveLength(1);
    expect(document.root.children[0].kind).toBe("gallery");
    expect(document.root.children[0].children.map((child) => child.kind)).toEqual(["image", "image"]);
    expect(document.root.children[0].children.map((child) => child.assetRefs[0]?.ordinal)).toEqual([0, 1]);
  });
});
