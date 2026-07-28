import { describe, expect, it } from "vitest";
import { serializeBlocks } from "../lib/blocks";
import type { ImageRef } from "../lib/types";

const noImages = new Map<number, ImageRef>();

describe("serializeBlocks", () => {
  it("maps paragraphs and headings (clamped 2-4, wp-block-heading class)", () => {
    const out = serializeBlocks(
      "<h1>One</h1><p>Body</p><h6>Deep</h6>",
      noImages,
    );
    expect(out).toBe(
      '<!-- wp:heading {"level":2} -->\n<h2 class="wp-block-heading">One</h2>\n<!-- /wp:heading -->\n\n' +
        "<!-- wp:paragraph -->\n<p>Body</p>\n<!-- /wp:paragraph -->\n\n" +
        '<!-- wp:heading {"level":4} -->\n<h4 class="wp-block-heading">Deep</h4>\n<!-- /wp:heading -->',
    );
  });

  it("maps lists with wp:list-item children and ordered attr", () => {
    const out = serializeBlocks("<ol><li>a</li><li>b</li></ol>", noImages);
    expect(out).toContain('<!-- wp:list {"ordered":true} -->');
    expect(out).toContain('<ol class="wp-block-list">');
    expect(out).toContain("<!-- wp:list-item -->\n<li>a</li>\n<!-- /wp:list-item -->");
  });

  it("nests a wp:list block inside the parent wp:list-item (no flattening)", () => {
    const out = serializeBlocks(
      "<ul><li>parent<ul><li>child</li></ul></li></ul>",
      noImages,
    );
    const li = out.slice(out.indexOf("<li>parent"));
    expect(li).toContain("<!-- wp:list -->");
    expect(li).toContain("<li>child</li>");
    expect(out.match(/<!-- wp:list -->/g)?.length).toBe(2);
  });

  it("maps blockquote with nested paragraph blocks", () => {
    const out = serializeBlocks(
      "<blockquote><p>quoted</p></blockquote>",
      noImages,
    );
    expect(out).toBe(
      "<!-- wp:quote -->\n" +
        '<blockquote class="wp-block-quote"><!-- wp:paragraph -->\n<p>quoted</p>\n<!-- /wp:paragraph --></blockquote>\n' +
        "<!-- /wp:quote -->",
    );
  });

  it("maps pre to wp:code with escaped text", () => {
    const out = serializeBlocks("<pre>if (a < b) &amp; c</pre>", noImages);
    expect(out).toBe(
      "<!-- wp:code -->\n" +
        '<pre class="wp-block-code"><code>if (a &lt; b) &amp; c</code></pre>\n' +
        "<!-- /wp:code -->",
    );
  });

  it("maps table to a figure with a bare <table> (no nonstandard class)", () => {
    const out = serializeBlocks(
      "<table><tbody><tr><td>x</td></tr></tbody></table>",
      noImages,
    );
    expect(out).toContain('<figure class="wp-block-table"><table>');
    expect(out).not.toContain("wp-block-table__table");
  });

  it("maps hr to wp:separator", () => {
    const out = serializeBlocks("<hr>", noImages);
    expect(out).toContain("<!-- wp:separator -->");
    expect(out).toContain("has-alpha-channel-opacity");
  });

  it("expands a lone token into a wp:image with alt and caption", () => {
    const images = new Map<number, ImageRef>([
      [
        0,
        {
          index: 0,
          src: "https://example.com/a.jpg",
          alt: 'He said "hi"',
          caption: "A <caption>",
        },
      ],
    ]);
    const out = serializeBlocks("<p>⟦IMG_0⟧</p>", images);
    expect(out).toBe(
      '<!-- wp:image {"sizeSlug":"large"} -->\n' +
        '<figure class="wp-block-image size-large">' +
        '<img src="https://example.com/a.jpg" alt="He said &quot;hi&quot;"/>' +
        '<figcaption class="wp-element-caption">A &lt;caption&gt;</figcaption>' +
        "</figure>\n" +
        "<!-- /wp:image -->",
    );
  });

  it("emits nothing for a token with no image-map entry", () => {
    const out = serializeBlocks("<p>before</p><p>⟦IMG_5⟧</p>", noImages);
    expect(out).toBe("<!-- wp:paragraph -->\n<p>before</p>\n<!-- /wp:paragraph -->");
  });
});
