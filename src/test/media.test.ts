import { describe, expect, it } from "vitest";
import {
  createMediaRegistry,
  normalizeMediaUrl,
  reconcileMediaRegistry,
  rewriteMediaReferences,
} from "../lib/media/registry";
import { buildWxrPackage, reconcileWxrContent } from "../lib/wxr";
import type { BundlePage } from "../lib/types";
import {
  CHANGED_BYTES_HASH,
  MEDIA_FIXTURE_PAGE_A,
  MEDIA_FIXTURE_PAGE_B,
  SAME_BYTES_HASH,
  duplicateUrlFixture,
  sameBytesDifferentUrlFixture,
  sameUrlChangedBytesFixture,
} from "./fixtures/media-registry-fixtures";

function page(url: string, sourceUrl: string): BundlePage {
  return {
    title: "Clubhouse",
    link: url,
    contentBlocks: `<!-- wp:image -->\n<figure><img src="${sourceUrl}" alt="Clubhouse hero" /></figure>\n<!-- /wp:image -->`,
    images: [{ src: sourceUrl, alt: "Clubhouse hero" }],
  };
}

describe("bundle-wide media registry", () => {
  it("records acquisition identity, dimensions, provenance, and every page use", () => {
    const { registry } = createMediaRegistry(duplicateUrlFixture());
    expect(registry.records).toHaveLength(1);
    const record = registry.records[0];
    expect(record.contentHash).toBe(SAME_BYTES_HASH);
    expect(record.mime).toBe("image/jpeg");
    expect(record.byteLength).toBe(128);
    expect(record.dimensions).toEqual({ width: 1600, height: 900 });
    expect(record.provenance.alt[0]).toMatchObject({ value: "Clubhouse hero", source: "page" });
    expect(record.provenance.caption[0].value).toBe("A preserved caption");
    expect(record.uses.map((use) => use.pageUrl)).toEqual([MEDIA_FIXTURE_PAGE_A, MEDIA_FIXTURE_PAGE_B]);
    expect(record.import.state).toBe("ready");
  });

  it("deduplicates one URL across pages into one WXR attachment item", () => {
    const records = createMediaRegistry(duplicateUrlFixture()).registry;
    const packageResult = buildWxrPackage(
      [
        page(MEDIA_FIXTURE_PAGE_A, "https://cdn.example.test/photos/logo.jpg"),
        page(MEDIA_FIXTURE_PAGE_B, "https://cdn.example.test/photos/logo.jpg"),
      ],
      { author: "admin", postType: "page", status: "draft", emitAttachments: true, mediaRegistry: records },
    );
    expect(packageResult.xml.match(/<wp:post_type>attachment<\/wp:post_type>/g)).toHaveLength(1);
    expect(packageResult.xml.match(/<wp:attachment_url>/g)).toHaveLength(1);
  });

  it("deduplicates same bytes from different URLs while retaining both aliases", () => {
    const { registry } = createMediaRegistry(sameBytesDifferentUrlFixture());
    expect(registry.records).toHaveLength(1);
    expect(registry.records[0].sourceUrls).toEqual([
      "https://cdn.example.test/photos/hero.jpg?fit=crop&w=1600",
      "https://images.example.test/hero-original.jpg",
      "https://images.example.test/hero-original.jpg?w=2",
    ]);
    expect(registry.records[0].aliases.some((alias) => alias.kind === "content-hash")).toBe(true);
    const packageResult = buildWxrPackage(
      [
        page(MEDIA_FIXTURE_PAGE_A, "https://cdn.example.test/photos/hero.jpg?w=1600&fit=crop"),
        page(MEDIA_FIXTURE_PAGE_B, "https://images.example.test/hero-original.jpg"),
      ],
      { author: "admin", postType: "page", status: "draft", emitAttachments: true, mediaRegistry: registry },
    );
    expect(packageResult.xml.match(/<wp:post_type>attachment<\/wp:post_type>/g)).toHaveLength(1);
    expect(packageResult.xml).toContain(
      "<wp:attachment_url>https://cdn.example.test/photos/hero.jpg?w=1600&amp;fit=crop</wp:attachment_url>",
    );
    const pageContents = [
      ...packageResult.xml.matchAll(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/g),
    ]
      .map((match) => match[1])
      .filter((content) => content.includes("<!-- wp:image -->"));
    expect(pageContents).toHaveLength(2);
    expect(pageContents.every((content) => content.includes("hero.jpg?w=1600&amp;fit=crop"))).toBe(true);
    expect(pageContents.every((content) => !content.includes("images.example.test"))).toBe(true);
  });

  it("keeps changed bytes at one URL separate and raises a blocking conflict", () => {
    const { registry, findings } = createMediaRegistry(sameUrlChangedBytesFixture());
    expect(registry.records).toHaveLength(2);
    expect(registry.records.map((record) => record.contentHash)).toEqual([SAME_BYTES_HASH, CHANGED_BYTES_HASH]);
    expect(
      findings.some((finding) => finding.code === "source-url-content-conflict" && finding.severity === "blocking"),
    ).toBe(true);
    expect(() =>
      buildWxrPackage([page(MEDIA_FIXTURE_PAGE_A, "https://cdn.example.test/photos/hero.jpg")], {
        author: "admin",
        postType: "page",
        status: "draft",
        emitAttachments: true,
        mediaRegistry: registry,
        strictMedia: true,
      }),
    ).toThrow("Media preflight failed");
  });

  it("reconciles actual WordPress attachment identity and rewrites src, srcset, and escaped URLs", () => {
    const { registry } = createMediaRegistry(sameBytesDifferentUrlFixture());
    const reconciled = reconcileMediaRegistry(registry, [
      {
        attachmentId: 73,
        contentHash: SAME_BYTES_HASH,
        destinationUrl: "https://target.example.test/wp-content/uploads/hero.jpg?size=large",
        sourceUrls: registry.records[0].sourceUrls,
      },
    ]);
    const content = `<figure><img src="https://cdn.example.test/photos/hero.jpg?w=1600&amp;fit=crop" srcset="https://images.example.test/hero-original.jpg 1x, https://images.example.test/hero-original.jpg?w=2 2x"></figure>`;
    const rewritten = rewriteMediaReferences(content, reconciled.registry, {
      baseUrl: MEDIA_FIXTURE_PAGE_A,
      requireDestination: true,
    });
    expect(rewritten.findings).toEqual([]);
    expect(rewritten.content.match(/target\.example\.test/g)).toHaveLength(3);
    expect(rewritten.content).not.toContain("cdn.example.test");
    expect(rewritten.content).not.toContain("images.example.test");
    expect(reconciled.registry.records[0].import).toMatchObject({
      state: "reconciled",
      attachmentId: 73,
      destinationUrl: "https://target.example.test/wp-content/uploads/hero.jpg?size=large",
    });
  });

  it("does not guess when a relative URL has no source context", () => {
    const { registry, findings } = createMediaRegistry([{ pageUrl: "", sourceUrl: "/uploads/hero.jpg" }]);
    expect(registry.records[0].sourceUrls).toEqual([]);
    expect(findings[0]).toMatchObject({ code: "relative-url-without-context", severity: "blocking" });
    expect(normalizeMediaUrl("//cdn.example.test/hero.jpg", "https://legacy.example.test/page")).toBe(
      "https://cdn.example.test/hero.jpg",
    );
  });

  it("rewrites a WXR page only from reconciled destination evidence", () => {
    const { registry } = createMediaRegistry(duplicateUrlFixture());
    const reconciled = reconcileMediaRegistry(registry, [
      {
        attachmentId: 91,
        contentHash: SAME_BYTES_HASH,
        destinationUrl: "https://target.example.test/wp-content/uploads/logo.jpg",
        sourceUrls: registry.records[0].sourceUrls,
      },
    ]);
    const built = buildWxrPackage([page(MEDIA_FIXTURE_PAGE_A, "https://cdn.example.test/photos/logo.jpg")], {
      author: "admin",
      postType: "page",
      status: "draft",
      mediaRegistry: registry,
    });
    const result = reconcileWxrContent(built.xml, reconciled.registry);
    expect(result.findings).toEqual([]);
    expect(result.xml).toContain("https://target.example.test/wp-content/uploads/logo.jpg");
    expect(result.xml).not.toContain('https://cdn.example.test/photos/logo.jpg" alt');
  });
});
