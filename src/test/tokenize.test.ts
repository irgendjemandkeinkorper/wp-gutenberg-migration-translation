import { describe, expect, it } from "vitest";
import { tokenizeImages } from "../lib/tokenize";

describe("tokenizeImages", () => {
  it("replaces an img with a lone-token paragraph and records metadata", () => {
    const { html, images } = tokenizeImages(
      '<p>before</p><img src="/a.jpg" alt="A photo"><p>after</p>',
      "https://example.com/page",
    );
    expect(images).toEqual([
      { index: 0, src: "https://example.com/a.jpg", alt: "A photo", caption: "" },
    ]);
    expect(html).toContain("<p>⟦IMG_0⟧</p>");
  });

  it("uses data-src and srcset fallbacks", () => {
    const { images } = tokenizeImages(
      '<img data-src="/lazy.png"><img srcset="/w400.png 400w, /w800.png 800w">',
      "https://example.com/",
    );
    expect(images.map((i) => i.src)).toEqual([
      "https://example.com/lazy.png",
      "https://example.com/w400.png",
    ]);
  });

  it("removes srcless and data-URI images without issuing a token (gapless indices)", () => {
    const { html, images } = tokenizeImages(
      '<img><img src="data:image/gif;base64,AAAA"><img src="/real.jpg">',
      "https://example.com/",
    );
    expect(images).toHaveLength(1);
    expect(images[0].index).toBe(0);
    expect(images[0].src).toBe("https://example.com/real.jpg");
    expect(html).not.toContain("data:");
  });

  it("captures figcaption and replaces the whole figure", () => {
    const { html, images } = tokenizeImages(
      '<figure><img src="/x.jpg" alt="x"><figcaption>The caption</figcaption></figure>',
      "https://example.com/",
    );
    expect(images[0].caption).toBe("The caption");
    expect(html).not.toContain("figcaption");
    expect(html).toContain("<p>⟦IMG_0⟧</p>");
  });

  it("keeps raw src when no base URL is given", () => {
    const { images } = tokenizeImages('<img src="/rel.jpg">');
    expect(images[0].src).toBe("/rel.jpg");
  });
});
