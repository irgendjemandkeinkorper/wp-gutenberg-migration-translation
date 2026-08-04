import { describe, expect, it } from "vitest";
import { repairTokens, validateFragment } from "../lib/validate";

describe("validateFragment", () => {
  it("unwraps a wrapping div (the classic page-collapse failure)", () => {
    const { html } = validateFragment("<div><h2>Title</h2><p>Text</p></div>", []);
    expect(html).toBe("<h2>Title</h2><p>Text</p>");
  });

  it("unwraps nested wrappers repeatedly", () => {
    const { html } = validateFragment("<article><div><p>Hi</p></div></article>", []);
    expect(html).toBe("<p>Hi</p>");
  });

  it("normalizes b/i and unwraps off-whitelist tags keeping text", () => {
    const { html } = validateFragment("<p><b>bold</b> <i>ital</i> <span>span</span> <u>under</u></p>", []);
    expect(html).toBe("<p><strong>bold</strong> <em>ital</em> span under</p>");
  });

  it("strips all attributes except href on <a>, and unwraps hrefless <a>", () => {
    const { html } = validateFragment(
      '<p class="x" style="color:red"><a href="/y" target="_blank" onclick="x()">link</a> <a>plain</a></p>',
      [],
    );
    expect(html).toBe('<p><a href="/y">link</a> plain</p>');
  });

  it("unwraps <a> tags with dangerous href values to prevent XSS", () => {
    const { html } = validateFragment(
      '<p><a href="javascript:alert(1)">js</a> <a href=" vbscript:msgbox ">vbs</a> <a href="data:text/html,<html>">data</a> <a href="java\nscript:x">hack</a> <a href="java script:x">hack2</a> <a href="http://safe.com">safe</a></p>',
      [],
    );
    expect(html).toBe('<p>js vbs data hack hack2 <a href="http://safe.com">safe</a></p>');
  });

  it("reports missing and duplicated tokens", () => {
    const { report } = validateFragment("<p>⟦ASSET_0⟧</p><p>⟦ASSET_0⟧</p>", [0, 1]);
    expect(report.missing).toEqual([1]);
    expect(report.extra).toEqual([0]);
  });

  it("splits a token merged into prose out into its own paragraph", () => {
    const { html, report } = validateFragment("<p>Some text ⟦ASSET_0⟧ more text</p>", [0]);
    expect(html).toBe("<p>Some text </p><p>⟦ASSET_0⟧</p><p> more text</p>");
    expect(report.missing).toEqual([]);
    expect(report.extra).toEqual([]);
  });

  it("hoists a token buried inside formatting to a following paragraph", () => {
    const { html } = validateFragment("<p><strong>bold ⟦ASSET_2⟧</strong> tail</p>", [2]);
    expect(html).toContain("<p>⟦ASSET_2⟧</p>");
    expect(html).toContain("<strong>bold </strong>");
  });

  it("drops noise elements entirely instead of unwrapping their text", () => {
    const { html } = validateFragment(
      "<p>Keep</p><script>var leak = 1;</script><style>.x{}</style>" +
        '<nav><ul><li><a href="/">Home</a></li></ul></nav>' +
        '<form><input value="q"><button>Go</button></form>',
      [],
    );
    expect(html).toBe("<p>Keep</p>");
  });

  it("keeps h1/h5/h6 as headings instead of unwrapping to bare text", () => {
    const { html } = validateFragment("<h1>Title</h1><h5>Minor</h5><h6>Micro</h6>", []);
    expect(html).toBe("<h2>Title</h2><h4>Minor</h4><h4>Micro</h4>");
  });

  it("preserves whitelist structure untouched", () => {
    const input = "<h2>H</h2><ul><li>a</li><li>b</li></ul><blockquote><p>q</p></blockquote>";
    const { html } = validateFragment(input, []);
    expect(html).toBe(input);
  });

  it("processes a large fragment with thousands of siblings and mixed content without crashing", () => {
    // Generate thousands of siblings within a single <p> element to stress the splitting logic
    const count = 1500;
    const pieces: string[] = [];
    const expectedIndices: number[] = [];
    for (let i = 0; i < count; i++) {
      pieces.push(`Text ${i} ⟦ASSET_${i}⟧`);
      expectedIndices.push(i);
    }
    const input = `<p>${pieces.join(" ")}</p>`;

    // This should complete successfully and without any RangeError / Maximum call stack size exceeded
    const { html, report } = validateFragment(input, expectedIndices);

    expect(report.missing).toEqual([]);
    expect(report.extra).toEqual([]);

    // Check that all expected tokens are present in correct order and exactly once
    const foundIndices: number[] = [];
    const doc = new DOMParser().parseFromString(html, "text/html");
    for (const child of Array.from(doc.body.children)) {
      if (child.tagName.toLowerCase() === "p") {
        const text = child.textContent ?? "";
        if (text.startsWith("⟦ASSET_") && text.endsWith("⟧")) {
          const idx = parseInt(text.replace("⟦ASSET_", "").replace("⟧", ""), 10);
          foundIndices.push(idx);
        }
      }
    }

    expect(foundIndices).toHaveLength(count);
    for (let i = 0; i < count; i++) {
      expect(foundIndices[i]).toBe(i);
    }
  });
});

describe("repairTokens", () => {
  it("drops duplicates/hallucinated tokens and appends missing ones", () => {
    const { html, lostPositions } = repairTokens("<p>text</p><p>⟦ASSET_0⟧</p><p>⟦ASSET_0⟧</p><p>⟦ASSET_9⟧</p>", [0, 1]);
    expect(html).toBe("<p>text</p><p>⟦ASSET_0⟧</p><p>⟦ASSET_1⟧</p>");
    expect(lostPositions).toEqual([1]);
  });
});
