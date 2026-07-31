import { describe, expect, it } from "vitest";
import { preserveUnsupported } from "../lib/placeholders";

describe("preserveUnsupported", () => {
  it("turns meaningful unsupported features into visible QA markers", () => {
    const result = preserveUnsupported(
      '<p>Intro</p><iframe src="https://tee.example/widget"></iframe><form action="/join"><button>Join</button></form>',
    );
    expect(result.placeholders).toEqual([
      { index: 0, kind: "iframe", source: "https://tee.example/widget", label: "MIGRATION PLACEHOLDER 1: iframe — https://tee.example/widget" },
      { index: 1, kind: "form", source: "/join", label: "MIGRATION PLACEHOLDER 2: form — /join" },
    ]);
    expect(result.html).toContain("[MIGRATION PLACEHOLDER 1: iframe");
    expect(result.html).not.toContain("<iframe");
    expect(result.html).not.toContain("<form");
  });
});
