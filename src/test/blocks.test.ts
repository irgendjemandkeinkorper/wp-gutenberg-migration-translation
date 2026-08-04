import { describe, expect, it } from "vitest";
import { serializeBlocks } from "../lib/blocks";
import type { AssetRef } from "../lib/types";

describe("serializeBlocks", () => {
  it("converts headings, clamping levels to h2-h4", () => {
    expect(serializeBlocks("<h1>Title</h1>", new Map())).toBe(
      `<!-- wp:heading {"level":2} -->\n<h2 class="wp-block-heading">Title</h2>\n<!-- /wp:heading -->`,
    );
    expect(serializeBlocks("<h6>Title</h6>", new Map())).toBe(
      `<!-- wp:heading {"level":4} -->\n<h4 class="wp-block-heading">Title</h4>\n<!-- /wp:heading -->`,
    );
  });

  it("converts simple paragraph blocks, escaping text", () => {
    expect(serializeBlocks("<p>Hello & World</p>", new Map())).toBe(
      "<!-- wp:paragraph -->\n<p>Hello &amp; World</p>\n<!-- /wp:paragraph -->",
    );
  });

  it("converts lists with nesting correctly", () => {
    const input = "<ol><li>A</li><li>B<ul><li>B1</li></ul></li></ol>";
    const out = serializeBlocks(input, new Map());
    expect(out).toContain('<!-- wp:list {"ordered":true} -->');
    expect(out).toContain("<!-- wp:list-item -->");
    expect(out).toContain("<!-- wp:list -->"); // nested ul has no ordered:true
  });

  it("converts blockquotes into core quotes containing wrapped paragraphs", () => {
    const input = "<blockquote><p>A quote</p></blockquote>";
    expect(serializeBlocks(input, new Map())).toBe(
      `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><!-- wp:paragraph -->\n<p>A quote</p>\n<!-- /wp:paragraph --></blockquote>\n<!-- /wp:quote -->`,
    );
  });

  it("converts pre to code blocks", () => {
    const input = "<pre>const x = 1 &lt; 2;</pre>";
    expect(serializeBlocks(input, new Map())).toBe(
      `<!-- wp:code -->\n<pre class="wp-block-code"><code>const x = 1 &lt; 2;</code></pre>\n<!-- /wp:code -->`,
    );
  });

  it("converts tables to figure-wrapped tables", () => {
    const input = "<table><tbody><tr><td>cell</td></tr></tbody></table>";
    expect(serializeBlocks(input, new Map())).toBe(
      `<!-- wp:table -->\n<figure class="wp-block-table"><table><tbody><tr><td>cell</td></tr></tbody></table></figure>\n<!-- /wp:table -->`,
    );
  });

  it("converts hr elements into wp:separator", () => {
    expect(serializeBlocks("<hr>", new Map())).toBe(
      `<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->`,
    );
  });

  it("substitutes asset tokens using the provided asset map", () => {
    const images = new Map<number, AssetRef>([
      [
        0,
        {
          index: 0,
          type: "image",
          src: "https://example.com/img.jpg",
          alt: "My Image",
          caption: "A photo",
          tagName: "img",
          attributes: { src: "https://example.com/img.jpg" },
          excerpt: "",
        },
      ],
    ]);
    const out = serializeBlocks("<p>⟦ASSET_0⟧</p>", images);
    expect(out).toBe(
      `<!-- wp:image {"sizeSlug":"large"} -->\n` +
        `<figure class="wp-block-image size-large"><img src="https://example.com/img.jpg" alt="My Image"/><figcaption class="wp-element-caption">A photo</figcaption></figure>\n` +
        `<!-- /wp:image -->`,
    );
  });

  it("handles unmatched tokens gracefully by ignoring them", () => {
    const noImages = new Map<number, AssetRef>();
    const out = serializeBlocks("<p>before</p><p>⟦ASSET_5⟧</p>", noImages);
    expect(out).toBe("<!-- wp:paragraph -->\n<p>before</p>\n<!-- /wp:paragraph -->");
  });

  it("serializes unsupported assets into stable placeholder html blocks", () => {
    const assets = new Map<number, AssetRef>([
      [
        0,
        {
          index: 0,
          type: "iframe",
          src: "https://example.com/embed",
          alt: "",
          caption: "",
          tagName: "iframe",
          attributes: { src: "https://example.com/embed", width: "500" },
          excerpt: '<iframe src="https://example.com/embed" width="500"></iframe>',
        },
      ],
    ]);
    const out = serializeBlocks("<p>⟦ASSET_0⟧</p>", assets);
    expect(out).toContain('<!-- wp:html {"blockifyAsset":true,"assetIndex":0,"assetType":"iframe"} -->');
    expect(out).toContain('class="blockify-unsupported-placeholder"');
    expect(out).toContain('data-asset-index="0"');
    expect(out).toContain('data-asset-type="iframe"');
    expect(out).toContain("iframe");
  });
});
