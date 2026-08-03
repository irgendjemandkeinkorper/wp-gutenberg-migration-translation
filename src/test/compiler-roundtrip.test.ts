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
      htmlExcerpt: { contentKind: "decoded-html", contentSha256: "sha", storageKey: "html/roundtrip", startOffset: 0, endOffset: 1, excerpt: "fixture" },
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
    const image = compileMediaNode(node("image", {
      assetRefs: [{ assetId: "asset-1", role: "content-image", ordinal: 0, extensions: {} }],
    }), { identities: { "asset-1": { assetId: "asset-1", url: "https://cdn.example.test/a.jpg", attachmentId: 7 } } });
    const first = verifyCompiledMarkup(`${paragraph.markup}\n${image.markup}`);
    const second = verifyCompiledMarkup(`${paragraph.markup}\n${image.markup}`);
    expect(first.valid).toBe(true);
    expect(first.errors).toEqual([]);
    expect(first.blocks.map((block) => block.name)).toEqual(["paragraph", "image"]);
    expect(stableBlockTree(first)).toBe(stableBlockTree(second));
  });

  it("detects malformed delimiters and unsafe HTML clearly", () => {
    expect(parseGutenbergBlocks("<!-- wp:paragraph -->bad").valid).toBe(false);
    const unsafe = verifyCompiledMarkup('<!-- wp:html -->\n<div onclick="evil()"><script>x</script></div>\n<!-- /wp:html -->');
    expect(unsafe.valid).toBe(false);
    expect(unsafe.errors).toContain("Unsafe HTML in block /block[1].");
  });
});
