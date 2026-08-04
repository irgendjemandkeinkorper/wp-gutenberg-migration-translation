import { describe, expect, it } from "vitest";
import { compileCoreNode } from "../lib/compiler/core";
import { compileMediaNode } from "../lib/compiler/media";
import { parseGutenbergBlocks, stableBlockTree, verifyCompiledMarkup } from "../lib/compiler/roundtrip";
import type { SemanticNode } from "../lib/ir/types";

function node(kind: SemanticNode["kind"], overrides: Partial<SemanticNode> = {}): SemanticNode {
  return {
    id: `roundtrip-${kind}`,
    kind,
    source: {
      snapshotId: "snapshot-roundtrip",
      locator: { kind: "structural-path", value: "/body[1]/p[1]" },
      htmlExcerpt: {
        contentKind: "decoded-html",
        contentSha256: "sha",
        storageKey: "html/roundtrip",
        startOffset: 0,
        endOffset: 1,
        excerpt: "fixture",
      },
    },
    children: [],
    text: "fixture",
    attributes: {},
    assetRefs: [],
    classification: { confidence: 1, method: "rule" },
    auditEvents: [],
    extensions: {},
    ...overrides,
  } as SemanticNode;
}

describe("compiler parser round trips", () => {
  it("parses generated core and media blocks with stable trees", () => {
    const paragraph = compileCoreNode(node("paragraph", { text: "Hello" }));
    const image = compileMediaNode(
      node("image", {
        assetRefs: [{ assetId: "asset-1", role: "content-image", ordinal: 0, extensions: {} }],
      }),
      { identities: { "asset-1": { assetId: "asset-1", url: "https://cdn.example.test/a.jpg", attachmentId: 7 } } },
    );
    const first = verifyCompiledMarkup(`${paragraph.markup}\n${image.markup}`);
    const second = verifyCompiledMarkup(`${paragraph.markup}\n${image.markup}`);
    expect(first.valid).toBe(true);
    expect(first.errors).toEqual([]);
    expect(first.blocks.map((block) => block.name)).toEqual(["paragraph", "image"]);
    expect(stableBlockTree(first)).toBe(stableBlockTree(second));
  });

  it("detects malformed delimiters and unsafe HTML clearly", () => {
    expect(parseGutenbergBlocks("<!-- wp:paragraph -->bad").valid).toBe(false);
    const unsafe = verifyCompiledMarkup(
      '<!-- wp:html -->\n<div onclick="evil()"><script>x</script></div>\n<!-- /wp:html -->',
    );
    expect(unsafe.valid).toBe(false);
    expect(unsafe.errors).toContain("Unsafe HTML in block /block[1].");
  });

  it("round-trips a deterministic generated matrix of nested lists and escaped text", () => {
    const textCases = [
      `<script>alert("x")</script> & text`,
      `quotes: "double" 'single' and \\ slash`,
      "emoji: 🧭 café — 東京",
      "marker-looking: <!-- wp:quote --> not a real block",
    ];
    const nestedList = (depth: number, text: string): SemanticNode => {
      const child = node("list-item", {
        id: `matrix-item-${depth}`,
        text,
        children: depth > 1 ? [nestedList(depth - 1, text)] : [],
      });
      return node("list", {
        id: `matrix-list-${depth}`,
        attributes: { ordered: depth % 2 === 0 ? "true" : "false" },
        children: [child],
      });
    };

    for (const text of textCases) {
      for (const depth of [1, 2, 3, 4]) {
        const firstMarkup = compileCoreNode(nestedList(depth, text)).markup;
        const secondMarkup = compileCoreNode(nestedList(depth, text)).markup;
        const first = verifyCompiledMarkup(firstMarkup);
        const second = verifyCompiledMarkup(secondMarkup);

        expect(firstMarkup).toBe(secondMarkup);
        expect(first.valid, `depth ${depth}: ${first.errors.join("; ")}`).toBe(true);
        expect(stableBlockTree(first)).toBe(stableBlockTree(second));
        expect(firstMarkup).not.toContain("<script>");
        expect(firstMarkup).not.toContain("<!-- wp:quote --> not a real block");
      }
    }
  });
});
