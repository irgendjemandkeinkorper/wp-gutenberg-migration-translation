import { describe, expect, it } from "vitest";
import { extractContent } from "../lib/extract";

const para = (i: number) =>
  `<div class="row"><div class="cell">Practice area ${i}: we advise families across the region on custody, support, and property division matters with care and experience.</div></div>`;

// The flaor.com failure shape: builder markup (text in divs, not <p>), a big
// nav menu, a slider, and a juicy footer blurb that Readability latches onto.
const builderPage = `<html><head><title>FLAOR — Family Law</title></head><body>
  <div class="wrap">
    <div id="header"><div class="widget">Call us: (804) 555-0100</div></div>
    <ul id="menu-main-menu">
      <li><a href="/divorce/">Divorce</a></li><li><a href="/adoption/">Adoption</a></li>
      <li><a href="/custody/">Custody</a></li><li><a href="/support/">Support</a></li>
    </ul>
    <div class="columns-2"><div class="c1">
      <div id="post-7" class="post_box top">
        <div class="slider"><img src="/a.jpg"><img src="/b.jpg"></div>
        ${Array.from({ length: 8 }, (_, i) => para(i)).join("\n")}
      </div>
    </div></div>
    <div id="footer"><div class="text_box">
      <h3>The firm handles Family Law cases throughout the Richmond area including several cities and counties nearby, serving families in the courtroom and through mediation.</h3>
    </div></div>
  </div>
</body></html>`;

describe("extractContent", () => {
  it("uses the selector override when given", () => {
    const { html, note } = extractContent(builderPage, {
      selector: ".post_box",
    });
    expect(note).toBe("via CSS selector");
    expect(html).toContain("Practice area 0");
  });

  it("falls back to a known content container when Readability under-captures", () => {
    const { html, note } = extractContent(builderPage);
    // The outcome that matters: the main content is captured, not just the
    // footer blurb Readability tends to pick on builder pages.
    expect(html).toContain("Practice area 0");
    expect(html).toContain("Practice area 7");
    expect(note).not.toBe("");
  });

  it("still uses Readability on a normal article", () => {
    const article = `<html><head><title>Post — Site</title></head><body>
      <nav><a href="/">Home</a></nav>
      <article>
        ${Array.from(
          { length: 6 },
          (_, i) =>
            `<p>Paragraph ${i} of a perfectly ordinary article body with enough prose for Readability to score it as the main content of this page.</p>`,
        ).join("\n")}
      </article>
      <footer>© Site</footer>
    </body></html>`;
    const { html, title } = extractContent(article);
    expect(html).toContain("Paragraph 0");
    expect(html).toContain("Paragraph 5");
    expect(title).toContain("Post");
  });
});
