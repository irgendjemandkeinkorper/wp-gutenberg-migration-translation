import { describe, expect, it } from "vitest";
import { rewriteInternalLinks, type DestinationRecord } from "../lib/links/rewriter";

const destinations: DestinationRecord[] = [
  {
    sourceUrl: "https://example.test/target",
    destinationUrl: "https://wp.example.test/?p=42",
    stableId: "page:target",
    anchors: new Set(["team"]),
  },
];

describe("authoritative internal-link rewriting", () => {
  it("rewrites mapped pages and preserves valid fragments", () => {
    const result = rewriteInternalLinks(
      '<p><a href="/target#team">Team</a><a href="https://other.test">External</a></p>',
      { sourcePageUrl: "https://example.test/source", destinations },
    );
    expect(result.rewritten).toBe(1);
    expect(result.html).toContain('href="https://wp.example.test/?p=42#team"');
    expect(result.html).toContain('data-blockify-destination-id="page:target"');
    expect(result.findings).toEqual([]);
  });

  it("reports missing destinations and anchors without guessing slugs", () => {
    const result = rewriteInternalLinks('<a href="/target#missing">Missing anchor</a><a href="/unknown">Unknown</a>', {
      sourcePageUrl: "https://example.test/source",
      destinations,
    });
    expect(result.rewritten).toBe(1);
    expect(result.findings.map((finding) => finding.code)).toEqual(["missing-anchor", "unresolved-internal"]);
    expect(result.html).toContain('href="/unknown"');
  });
});
