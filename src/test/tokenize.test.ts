import { describe, expect, it } from "vitest";
import { tokenizeImages } from "../lib/tokenize";

describe("tokenizeImages", () => {
  it("replaces an img with a lone-token paragraph and records metadata", () => {
    const { html, images } = tokenizeImages(
      '<p>before</p><img src="/a.jpg" alt="A photo"><p>after</p>',
      "https://example.com/page",
    );
    expect(images[0]).toMatchObject({
      index: 0,
      type: "image",
      src: "https://example.com/a.jpg",
      alt: "A photo",
      caption: "",
    });
    expect(html).toContain("<p>⟦ASSET_0⟧</p>");
  });

  it("uses data-src and srcset fallbacks", () => {
    const { images } = tokenizeImages(
      '<img data-src="/lazy.png"><img srcset="/w400.png 400w, /w800.png 800w">',
      "https://example.com/",
    );
    expect(images.map((i) => i.src)).toEqual(["https://example.com/lazy.png", "https://example.com/w400.png"]);
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
    expect(html).toContain("<p>⟦ASSET_0⟧</p>");
  });

  it("keeps raw src when no base URL is given", () => {
    const { images } = tokenizeImages('<img src="/rel.jpg">');
    expect(images[0].src).toBe("/rel.jpg");
  });

  it("tokenizes iframe, object, embed, video, audio, and form content", () => {
    const { images } = tokenizeImages(
      '<iframe src="/v" width="100"></iframe><object data="/o"></object>' +
        '<embed src="/e"></embed><video src="/vid"></video><audio src="/aud"></audio>' +
        '<form action="/sub" method="post"><input name="x"></form>',
      "https://example.com/",
    );
    expect(images).toHaveLength(6);
    expect(images.map((i) => i.type)).toEqual(["iframe", "object", "embed", "video", "audio", "form"]);
    expect(images.map((i) => i.src)).toEqual([
      "https://example.com/v",
      "https://example.com/o",
      "https://example.com/e",
      "https://example.com/vid",
      "https://example.com/aud",
      "https://example.com/sub",
    ]);
    expect(images[0].attributes).toEqual({
      src: "/v",
      width: "100",
    });
  });

  it("excludes tracking/analytics and script, style tags", () => {
    const { html, images } = tokenizeImages(
      "<script>console.log()</script><style>body{}</style>" +
        '<img src="pixel.jpg" width="1" height="1" alt="tracking">' +
        '<iframe src="https://tracker.com"></iframe>',
    );
    // scripts and styles removed, 1x1 pixel tracking image removed
    expect(images).toHaveLength(1);
    expect(images[0].type).toBe("iframe");
    expect(html).not.toContain("script");
    expect(html).not.toContain("style");
  });

  it("ignores nested elements under an already tokenized parent", () => {
    const { images } = tokenizeImages(
      '<form action="/sub"><img src="/nested.jpg"><iframe src="/nest-v"></iframe></form>',
    );
    // Since form is tokenized/replaced, its children are not tokenized again
    expect(images).toHaveLength(1);
    expect(images[0].type).toBe("form");
  });
});
