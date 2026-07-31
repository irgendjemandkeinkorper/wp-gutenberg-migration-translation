import { describe, expect, it } from "vitest";
import { repairTokens, validateFragment } from "../lib/validate";

describe("validateFragment", () => {
  it("unwraps a wrapping div (the classic page-collapse failure)", () => {
    const { html } = validateFragment(
      "<div><h2>Title</h2><p>Text</p></div>",
      [],
    );
    expect(html).toBe("<h2>Title</h2><p>Text</p>");
  });

  it("unwraps nested wrappers repeatedly", () => {
    const { html } = validateFragment(
      "<article><div><p>Hi</p></div></article>",
      [],
    );
    expect(html).toBe("<p>Hi</p>");
  });

  it("normalizes b/i and unwraps off-whitelist tags keeping text", () => {
    const { html } = validateFragment(
      "<p><b>bold</b> <i>ital</i> <span>span</span> <u>under</u></p>",
      [],
    );
    expect(html).toBe("<p><strong>bold</strong> <em>ital</em> span under</p>");
  });

  it("strips all attributes except href on <a>, and unwraps hrefless <a>", () => {
    const { html } = validateFragment(
      '<p class="x" style="color:red"><a href="/y" target="_blank" onclick="x()">link</a> <a>plain</a></p>',
      [],
    );
    expect(html).toBe('<p><a href="/y">link</a> plain</p>');
  });

  it("reports missing and duplicated tokens", () => {
    const { report } = validateFragment(
      "<p>⟦ASSET_0⟧</p><p>⟦ASSET_0⟧</p>",
      [0, 1],
    );
    expect(report.missing).toEqual([1]);
    expect(report.extra).toEqual([0]);
  });

  it("splits a token merged into prose out into its own paragraph", () => {
    const { html, report } = validateFragment(
      "<p>Some text ⟦ASSET_0⟧ more text</p>",
      [0],
    );
    expect(html).toBe("<p>Some text </p><p>⟦ASSET_0⟧</p><p> more text</p>");
    expect(report.missing).toEqual([]);
    expect(report.extra).toEqual([]);
  });

  it("hoists a token buried inside formatting to a following paragraph", () => {
    const { html } = validateFragment(
      "<p><strong>bold ⟦ASSET_2⟧</strong> tail</p>",
      [2],
    );
    expect(html).toContain("<p>⟦ASSET_2⟧</p>");
    expect(html).toContain("<strong>bold </strong>");
  });

  it("preserves whitelist structure untouched", () => {
    const input =
      "<h2>H</h2><ul><li>a</li><li>b</li></ul><blockquote><p>q</p></blockquote>";
    const { html } = validateFragment(input, []);
    expect(html).toBe(input);
  });
});

describe("repairTokens", () => {
  it("drops duplicates/hallucinated tokens and appends missing ones", () => {
    const { html, lostPositions } = repairTokens(
      "<p>text</p><p>⟦ASSET_0⟧</p><p>⟦ASSET_0⟧</p><p>⟦ASSET_9⟧</p>",
      [0, 1],
    );
    expect(html).toBe("<p>text</p><p>⟦ASSET_0⟧</p><p>⟦ASSET_1⟧</p>");
    expect(lostPositions).toEqual([1]);
  });
});
