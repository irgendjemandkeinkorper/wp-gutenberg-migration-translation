import { describe, expect, it } from "vitest";
import type { NodeKind, SemanticNode } from "../lib/ir/types";
import { compileMediaNode, type MediaIdentity } from "../lib/compiler/media";

function makeNode(kind: NodeKind, overrides: Partial<SemanticNode> = {}): SemanticNode {
  return {
    id: `media-${kind}`,
    kind,
    source: {
      snapshotId: "snapshot-media",
      locator: { kind: "structural-path", value: "/body[1]/img[1]" },
      htmlExcerpt: {
        contentKind: "decoded-html",
        contentSha256: "sha-media",
        storageKey: "html/media",
        startOffset: 0,
        endOffset: 10,
        excerpt: "fixture",
      },
    },
    children: [],
    text: null,
    attributes: {},
    assetRefs: [],
    classification: { confidence: 1, method: "rule" },
    auditEvents: [],
    extensions: {},
    ...overrides,
  } as SemanticNode;
}

const identities = new Map<string, MediaIdentity>([
  ["asset-hero", { assetId: "asset-hero", url: "https://cdn.example.test/hero.jpg", attachmentId: 42, alt: "Hero", caption: "A hero" }],
  ["asset-card", { assetId: "asset-card", url: "https://cdn.example.test/card.jpg", attachmentId: 43, alt: "Card" }],
]);

describe("media Gutenberg compiler", () => {
  it("serializes an image with reconciled attachment identity and metadata", () => {
    const node = makeNode("image", {
      assetRefs: [{ assetId: "asset-hero", role: "content-image", ordinal: 0, extensions: {} }],
      attributes: { alt: "Fallback alt", credit: "Photographer", creditUrl: "https://example.test/credit" },
    });
    const result = compileMediaNode(node, { identities });
    expect(result.markup).toContain('"id":42');
    expect(result.markup).toContain('src="https://cdn.example.test/hero.jpg"');
    expect(result.markup).toContain("<figcaption class=\"wp-element-caption\">A hero");
    expect(result.markup).toContain('href="https://example.test/credit"');
    expect(result.findings).toEqual([]);
  });

  it("preserves gallery order and rewrites provisional identity", () => {
    const gallery = makeNode("gallery", {
      children: [
        makeNode("image", { id: "item-1", assetRefs: [{ assetId: "provisional-1", role: "content-image", ordinal: 0, extensions: {} }] }),
        makeNode("image", { id: "item-2", assetRefs: [{ assetId: "asset-card", role: "content-image", ordinal: 1, extensions: {} }] }),
      ],
    });
    const result = compileMediaNode(gallery, {
      identities: new Map([...identities, ["imported-1", { assetId: "imported-1", url: "https://cdn.example.test/first.jpg", attachmentId: 41 }]]),
      rewriteAssetId: (assetId) => assetId === "provisional-1" ? "imported-1" : assetId,
    });
    expect(result.markup.indexOf("first.jpg")).toBeLessThan(result.markup.indexOf("card.jpg"));
    expect(result.markup).toContain('"id":41');
    expect(result.markup).toContain('"id":43');
    expect(result.findings).toEqual([]);
  });

  it("emits a one-to-one blocking placeholder for unresolved media", () => {
    const node = makeNode("image", {
      assetRefs: [{ assetId: "missing", role: "content-image", ordinal: 0, extensions: {} }],
    });
    const result = compileMediaNode(node, { identities });
    expect(result.findings).toEqual([expect.objectContaining({ code: "image-asset-unresolved", severity: "blocking" })]);
    expect(result.markup).toContain(`data-exception-id="blockify-${node.id}"`);
    expect(result.markup).toContain("Media identity missing has no delivery URL.");
  });
});
