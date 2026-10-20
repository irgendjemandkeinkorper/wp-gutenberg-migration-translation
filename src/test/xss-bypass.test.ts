import { describe, expect, it } from "vitest";
import { isSafeUrl, validateFragment } from "../lib/validate";

describe("XSS URL validation bypass", () => {
  it("blocks java\\x00script: payloads that convert to \\uFFFD", () => {
    // DOMParser converts \x00 to \uFFFD.
    // Let's simulate the output of DOMParser.
    const href = "java\uFFFDscript:alert(1)";
    expect(isSafeUrl(href)).toBe(false);
  });

  it("unwraps a tag with obfuscated javascript url", () => {
    const { html } = validateFragment('<a href="java\x00script:alert(1)">click</a>', []);
    expect(html).toBe("click");
  });
});
