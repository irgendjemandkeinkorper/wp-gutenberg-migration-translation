import { describe, expect, it } from "vitest";
import { buildCanonicalUrlMap, classifyUrl } from "../lib/links/url-map";

describe("canonical URL and redirect map", () => {
  it("classifies relative, fragment, download, mailto, tel, and external URLs", () => {
    expect(classifyUrl("/about#team", "https://example.test/start")).toMatchObject({
      kind: "fragment",
      target: "https://example.test/about",
      fragment: "team",
    });
    expect(classifyUrl("/files/guide.pdf?download=1", "https://example.test/").kind).toBe("download");
    expect(classifyUrl("mailto:team@example.test", "https://example.test/").kind).toBe("mailto");
    expect(classifyUrl("tel:+12025550123", "https://example.test/").kind).toBe("tel");
    expect(classifyUrl("https://other.test/page", "https://example.test/").kind).toBe("external");
    expect(classifyUrl("%broken", "https://example.test/").kind).toBe("malformed");
  });

  it("builds deterministic redirects and reports conflicts/cycles", () => {
    const map = buildCanonicalUrlMap(
      [
        { requestedUrl: "/old", finalUrl: "https://example.test/new" },
        { requestedUrl: "/cycle-a", finalUrl: "https://example.test/cycle-b" },
        { requestedUrl: "/cycle-a", finalUrl: "https://example.test/cycle-a" },
        { requestedUrl: "/doc.pdf", contentType: "application/pdf" },
      ],
      "https://example.test/",
    );
    expect(map.records.map((record) => record.requested)).toEqual(["/cycle-a", "/doc.pdf", "/old"]);
    expect(map.records.find((record) => record.requested === "/old")?.kind).toBe("redirected");
    expect(map.records.find((record) => record.requested === "/doc.pdf")?.kind).toBe("download");
    expect(map.findings.some((finding) => finding.code === "redirect-conflict")).toBe(true);
  });
});
