import { describe, expect, it } from "vitest";
import type { JsonObject, NodeKind, SemanticNode } from "../lib/ir/types";
import { compileCoreNode } from "../lib/compiler/core";

function makeNode(kind: NodeKind, overrides: Partial<SemanticNode> = {}): SemanticNode {
  return {
    id: `node-${kind}`,
    kind,
    source: {
      snapshotId: "snapshot-core",
      locator: { kind: "structural-path", value: "/body[1]/p[1]" },
      htmlExcerpt: {
        contentKind: "decoded-html",
        contentSha256: "sha-core",
        storageKey: "html/core",
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

describe("core Gutenberg compiler", () => {
  it("preserves inline marks, links, heading levels, and escaping", () => {
    const bold = makeNode("rich-text-span", {
      id: "bold",
      text: "<bold>",
      attributes: {},
      extensions: { sourceTag: "strong" },
    });
    const link = makeNode("rich-text-span", {
      id: "link",
      text: "read",
      attributes: { href: "https://example.test/?a=1&b=2", onclick: "alert(1)" },
      extensions: { sourceTag: "a" },
    });
    const paragraph = makeNode("paragraph", { text: "Intro ", children: [bold, link] });
    const result = compileCoreNode(paragraph);

    expect(result.markup).toContain("Intro ");
    expect(result.markup).toContain("<strong>&lt;bold&gt;</strong>");
    expect(result.markup).toContain('href="https://example.test/?a=1&amp;b=2"');
    expect(result.markup).not.toContain("onclick");
    expect(result.findings).toEqual([
      expect.objectContaining({ code: "unsupported-inline-attribute", severity: "warning" }),
    ]);

    const heading = makeNode("heading", {
      id: "heading",
      source: { ...paragraph.source, locator: { kind: "structural-path", value: "/body[1]/h3[1]" } },
      text: "Heading",
    });
    expect(compileCoreNode(heading).markup).toContain('<h3 class="wp-block-heading">Heading</h3>');
  });

  it("serializes nested ordered and unordered lists deterministically", () => {
    const nested = makeNode("list", {
      id: "nested-list",
      attributes: { ordered: "true" },
      children: [makeNode("list-item", { id: "nested-item", text: "Nested" })],
    });
    const list = makeNode("list", {
      id: "list",
      attributes: { ordered: "false" },
      children: [makeNode("list-item", { id: "item", text: "One", children: [nested] })],
    });
    const first = compileCoreNode(list);
    const second = compileCoreNode(list);
    expect(first.markup).toBe(second.markup);
    expect(first.markup).toContain("<!-- wp:list -->");
    expect(first.markup).toContain('<!-- wp:list {"ordered":true} -->');
    expect(first.markup).toContain("<li>One");
    expect(first.findings).toEqual([]);
  });

  it("preserves quote, code, and table semantics", () => {
    const quote = makeNode("quote", { children: [makeNode("paragraph", { text: "A quote" })] });
    expect(compileCoreNode(quote).markup).toContain('<blockquote class="wp-block-quote"><p>A quote</p></blockquote>');

    const code = makeNode("code", { text: "const x = 1 < 2;" });
    expect(compileCoreNode(code).markup).toContain("const x = 1 &lt; 2;");

    const rows: JsonObject[] = [
      {
        cells: [
          { text: "Name", header: true },
          { text: "Value", header: false },
        ],
      },
    ];
    const table = makeNode("table", { extensions: { rows } });
    const result = compileCoreNode(table);
    expect(result.markup).toContain("<th>Name</th><td>Value</td>");
    expect(result.findings).toEqual([]);
  });

  it("fails with a blocking finding for unsupported core nodes", () => {
    const result = compileCoreNode(makeNode("widget"));
    expect(result.findings).toEqual([expect.objectContaining({ code: "unsupported-core-node", severity: "blocking" })]);
    expect(result.markup).toContain("blockifyExceptionId");
  });

  it("validates href values and blocks malicious URLs while preserving safe ones", () => {
    const maliciousLink = makeNode("rich-text-span", {
      id: "malicious-link",
      text: "malicious link",
      attributes: { href: "javascript:alert(1)", title: "evil" },
      extensions: { sourceTag: "a" },
    });
    const safeLink = makeNode("rich-text-span", {
      id: "safe-link",
      text: " safe link",
      attributes: { href: "https://safe.test" },
      extensions: { sourceTag: "a" },
    });
    const paragraph = makeNode("paragraph", { children: [maliciousLink, safeLink] });
    const result = compileCoreNode(paragraph);

    // The malicious href should be stripped, but its safe 'title' attribute can remain.
    // The safe link should keep its href.
    expect(result.markup).toContain('<a title="evil">malicious link</a><a href="https://safe.test"> safe link</a>');

    // A blocking finding should have been generated for the unsafe href
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unsafe-link-href",
          severity: "blocking",
          sourceNodeId: "malicious-link",
        }),
      ])
    );
  });
});
