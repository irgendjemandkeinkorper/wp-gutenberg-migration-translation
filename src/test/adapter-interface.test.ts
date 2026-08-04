import { describe, expect, it } from "vitest";
import {
  genericFallback,
  selectSourceAdapter,
  validateAdapterExtraction,
  type AdapterInput,
  type SourceAdapter,
} from "../lib/adapters/interface";

const input: AdapterInput = { url: "https://example.test/page", html: "<html><body>fixture</body></html>" };

function adapter(id: string, confidence: number, cms = id): SourceAdapter {
  return {
    id,
    version: "1.0.0",
    detect: () => ({ adapterId: id, cms, confidence, evidence: [`signal:${id}`], diagnostics: [] }),
    extract: () => genericFallback(input),
  };
}

describe("bounded source-adapter interface", () => {
  it("uses generic fallback when no adapter detects the CMS", () => {
    const selected = selectSourceAdapter(input, [adapter("wordpress", 0)]);
    expect(selected.adapter).toBeNull();
    expect(selected.detection.adapterId).toBe("generic");
    expect(genericFallback(input).diagnostics[0]).toContain("generic extraction");
  });

  it("resolves equal-confidence detections deterministically and visibly", () => {
    const selected = selectSourceAdapter(input, [adapter("joomla", 0.8), adapter("drupal", 0.8)]);
    expect(selected.adapter?.id).toBe("drupal");
    expect(selected.diagnostics).toEqual(["adapter-conflict:drupal,joomla"]);
  });

  it("rejects adapter output that bypasses the IR boundary", () => {
    expect(() =>
      validateAdapterExtraction({
        ...genericFallback(input),
        blocks: "<!-- wp:paragraph -->bad<!-- /wp:paragraph -->",
      } as never),
    ).toThrow(/Gutenberg output field blocks/);
  });
});
