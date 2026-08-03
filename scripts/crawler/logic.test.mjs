import { describe, expect, it } from "vitest";
import {
  extractLinks,
  isRobotsDisallowed,
  normalizeUrl,
  parseRobotsDisallows,
  sameSite,
  shouldSkip,
} from "./logic.mjs";

const BASE_URL = "https://example.test/source/";

describe("crawler URL logic", () => {
  it("resolves relative URLs, removes fragments, and canonicalizes page paths", () => {
    expect(normalizeUrl("../about#team", BASE_URL)).toBe("https://example.test/about/");
    expect(normalizeUrl("/downloads/file.pdf#page=2", BASE_URL)).toBe("https://example.test/downloads/file.pdf");
    expect(normalizeUrl("https://www.example.test/", BASE_URL)).toBe("https://www.example.test/");
  });

  it("rejects query-string, unsupported-protocol, and malformed links", () => {
    expect(normalizeUrl("/archive?page=2", BASE_URL)).toBeNull();
    expect(normalizeUrl("mailto:editor@example.test", BASE_URL)).toBeNull();
    expect(normalizeUrl("http://[", BASE_URL)).toBeNull();
  });

  it("extracts normalized links without fetching anything", () => {
    const html = [
      '<a href="/first">first</a>',
      "<a href='../second#section'>second</a>",
      '<a href="/archive?page=2">query</a>',
      "<a href='mailto:editor@example.test'>mail</a>",
    ].join(" ");
    expect(extractLinks(html, BASE_URL)).toEqual([
      "https://example.test/first/",
      "https://example.test/second/",
    ]);
  });

  it("matches www and non-www hosts as the same site", () => {
    expect(sameSite("https://www.example.test/page/", BASE_URL)).toBe(true);
    expect(sameSite("https://other.example.test/page/", BASE_URL)).toBe(false);
  });
});

describe("crawler skip rules", () => {
  it.each([
    "/assets/site.css",
    "/assets/app.JS",
    "/images/photo.jpeg",
    "/documents/manual.PDF",
    "/media/font.woff2",
  ])("skips asset extension %s", (path) => {
    expect(shouldSkip(`https://example.test${path}`)).toBe(true);
  });

  it.each([
    "/wp-admin/",
    "/wp-json/wp/v2/pages",
    "/wp-login.php",
    "/wp-content/uploads/image.jpg",
    "/wp-includes/js/wp-embed.js",
    "/news/feed/",
    "/post/trackback/",
    "/comment-page-2/",
    "/xmlrpc.php",
  ])("skips WordPress path %s", (path) => {
    expect(shouldSkip(`https://example.test${path}`)).toBe(true);
  });

  it("keeps ordinary page URLs", () => {
    expect(shouldSkip("https://example.test/about/")).toBe(false);
    expect(shouldSkip("https://example.test/contact.html")).toBe(false);
  });
});

describe("robots.txt logic", () => {
  it("parses wildcard-agent disallows, comments, CRLF, and ignores empty rules", () => {
    const robots = [
      "User-agent: Googlebot",
      "Disallow: /google-only",
      "",
      "User-agent: *",
      "Disallow: /private",
      "Disallow:",
      "Disallow: /with:colon # inline comment",
      "Allow: /private/public",
      "User-agent: OtherBot",
      "Disallow: /other-only",
    ].join("\r\n");

    expect(parseRobotsDisallows(robots)).toEqual(["/private", "/with:colon"]);
  });

  it("checks disallowed paths by prefix without network access", () => {
    const disallows = parseRobotsDisallows("User-agent: *\nDisallow: /private");
    expect(isRobotsDisallowed("https://example.test/private/page/", disallows)).toBe(true);
    expect(isRobotsDisallowed("https://example.test/public/", disallows)).toBe(false);
  });
});
