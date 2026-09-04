import { describe, expect, it } from "vitest";
import type { NodeKind, SemanticNode } from "../lib/ir/types";
import { compileSafeContentNode } from "../lib/compiler/safe-content";

function makeNode(kind: NodeKind, excerpt: string): SemanticNode {
  return {
    id: `safe-${kind}`,
    kind,
    source: {
      snapshotId: "snapshot-safe",
      locator: { kind: "structural-path", value: "/body[1]/div[1]" },
      htmlExcerpt: {
        contentKind: "decoded-html",
        contentSha256: "sha-safe",
        storageKey: "html/safe",
        startOffset: 0,
        endOffset: excerpt.length,
        excerpt,
      },
    },
    children: [],
    text: null,
    attributes: {},
    assetRefs: [],
    classification: { confidence: 0.2, method: "adapter" },
    auditEvents: [],
    extensions: {},
    ...(kind === "unknown"
      ? {
          unknown: {
            originalKind: "custom-widget",
            rawHtml: excerpt,
            reason: "unsupported fixture",
            rawAttributes: {},
          },
        }
      : {}),
  } as SemanticNode;
}

describe("safe embed and unknown-content compiler", () => {
  it("allows a safe Google Maps iframe while stripping unapproved attributes", () => {
    const node = makeNode(
      "embed",
      '<iframe src="https://www.google.com/maps/embed?x=1" width="600" onload="evil()"></iframe>',
    );
    const result = compileSafeContentNode(node);
    expect(result.findings).toEqual([]);
    expect(result.markup).toContain("wp:html");
    expect(result.markup).toContain("https://www.google.com/maps/embed?x=1");
    expect(result.markup).not.toContain("onload");
  });

  it("turns unsafe iframe, scripts, and event handlers into a safe placeholder", () => {
    const node = makeNode(
      "unknown",
      '<div onclick="evil()"><script>alert(1)</script><iframe src="javascript:alert(1)"></iframe></div>',
    );
    const result = compileSafeContentNode(node);
    expect(result.findings).toEqual([expect.objectContaining({ code: "unsafe-content", severity: "blocking" })]);
    expect(result.markup).toContain("blockifyExceptionId");
    expect(result.markup).toContain('data-remediation="review-source-evidence"');
    expect(result.markup).not.toContain("alert(1)");
  });

  it("rejects URLs with obfuscated dangerous protocols (e.g., using control characters or whitespace)", () => {
    // Attackers might use java\nscript:, java\x00script:, etc., to bypass naive URL parsing.
    const node = makeNode(
      "unknown",
      '<div><a href="java\nscript:alert(1)">link1</a><a href="java\x00script:alert(1)">link2</a><a href=" java script:alert(1)">link3</a></div>',
    );
    const result = compileSafeContentNode(node);
    expect(result.findings).toEqual([expect.objectContaining({ code: "unsafe-content", severity: "blocking" })]);
    expect(result.markup).toContain("blockifyExceptionId");
    expect(result.markup).not.toContain("alert(1)");
  });

  it("preserves a stable exception ID without embedding original HTML", () => {
    const node = makeNode("widget", '<custom-widget data-secret="value">private</custom-widget>');
    const result = compileSafeContentNode(node);
    expect(result.exceptionId).toBe(`blockify-${node.id}`);
    expect(result.markup).toContain(`data-exception-id="blockify-${node.id}"`);
    expect(result.markup).not.toContain("data-secret");
    expect(result.markup).not.toContain("private");
  });
});
