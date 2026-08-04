import { describe, expect, it } from "vitest";
import { buildWxr, cdata, migrationIdForPage, slugify } from "../lib/wxr";
import type { BundlePage } from "../lib/types";

const page: BundlePage = {
  migrationId: "page-about-us",
  title: "About Us & More",
  link: "https://old-site.com/about",
  contentBlocks: "<!-- wp:paragraph -->\n<p>Hello</p>\n<!-- /wp:paragraph -->",
  images: [{ src: "https://old-site.com/img/team photo.jpg", alt: "The team" }],
  sourceHtml: "<main><p>Hello</p></main>",
  targetTemplate: "Albatross",
};

describe("buildWxr", () => {
  it("emits a valid WXR 1.2 envelope with the page item", () => {
    const xml = buildWxr([page], {
      author: "admin",
      postType: "page",
      status: "draft",
    });
    expect(xml).toContain("<wp:wxr_version>1.2</wp:wxr_version>");
    expect(xml).toContain("<title>About Us &amp; More</title>");
    expect(xml).toContain("<wp:post_type>page</wp:post_type>");
    expect(xml).toContain("<wp:status>draft</wp:status>");
    expect(xml).toContain("<wp:post_name><![CDATA[about-us-more]]></wp:post_name>");
    expect(xml).toContain("<content:encoded><![CDATA[<!-- wp:paragraph -->");
    // no attachments unless asked
    expect(xml).not.toContain("attachment");
  });

  it("emits attachment items parented to the page when sideloading", () => {
    const xml = buildWxr([page], {
      author: "admin",
      postType: "page",
      status: "draft",
      emitAttachments: true,
    });
    expect(xml).toContain("<wp:post_type>attachment</wp:post_type>");
    expect(xml).toContain("<wp:post_parent>1</wp:post_parent>");
    expect(xml).toContain("<wp:post_id>2</wp:post_id>");
    expect(xml).toContain("<wp:attachment_url>https://old-site.com/img/team photo.jpg</wp:attachment_url>");
    expect(xml).toContain("<wp:meta_key>_wp_attachment_image_alt</wp:meta_key>");
    expect(xml).toContain("<wp:meta_value><![CDATA[The team]]></wp:meta_value>");
    expect(xml).toContain("<wp:status>inherit</wp:status>");
    expect(xml).toContain("<wp:post_mime_type>image/jpeg</wp:post_mime_type>");
    expect(xml).toContain("<wp:meta_key><![CDATA[_wp_attached_file]]></wp:meta_key>");
  });

  it("stores stable migration identity and source evidence as importable post metadata", () => {
    const xml = buildWxr([page], { author: "admin", postType: "page", status: "draft" });
    expect(xml).toContain("<![CDATA[_blockify_source_html]]>");
    expect(xml).toContain("<![CDATA[<main><p>Hello</p></main>]]>");
    expect(xml).toContain("<![CDATA[_blockify_source_url]]>");
    expect(xml).toContain("<![CDATA[_blockify_migration_id]]>");
    expect(xml).toContain("<![CDATA[page-about-us]]>");
    expect(xml).toContain("<![CDATA[_blockify_target_template]]>");
    expect(xml).toContain("<![CDATA[Albatross]]>");
  });

  it("emits byte-stable dates when generatedAt is fixed", () => {
    const options = {
      author: "admin",
      postType: "page" as const,
      status: "draft" as const,
      generatedAt: "2025-01-15T12:34:56.000Z",
    };
    const first = buildWxr([page], options);
    const second = buildWxr([page], options);

    expect(first).toBe(second);
    expect(first).toContain("<pubDate>Wed, 15 Jan 2025 12:34:56 +0000</pubDate>");
    expect(first).toContain("<wp:post_date_gmt>2025-01-15 12:34:56</wp:post_date_gmt>");
    expect(() => buildWxr([page], { ...options, generatedAt: "not-a-date" })).toThrow(
      "WxrOptions.generatedAt must be a valid ISO date-time string",
    );
  });

  it("stores the documented placeholder manifest as JSON post metadata", () => {
    const xml = buildWxr(
      [
        {
          ...page,
          placeholders: [
            {
              index: 0,
              kind: "iframe",
              source: "https://booking.example.test/tee-times",
              label: "MIGRATION PLACEHOLDER 1: iframe — https://booking.example.test/tee-times",
            },
          ],
        },
      ],
      { author: "admin", postType: "page", status: "draft" },
    );
    expect(xml).toContain("<![CDATA[_blockify_migration_placeholders]]>");
    expect(xml).toContain(
      '<![CDATA[[{"index":0,"kind":"iframe","source":"https://booking.example.test/tee-times","label":"MIGRATION PLACEHOLDER 1: iframe — https://booking.example.test/tee-times"}]]]>',
    );
  });

  it("deduplicates fetchable attachments and skips relative image URLs", () => {
    const xml = buildWxr(
      [{ ...page, images: [page.images[0], page.images[0], { src: "/relative.jpg", alt: "relative" }] }],
      {
        author: "admin",
        postType: "page",
        status: "draft",
        emitAttachments: true,
      },
    );
    expect(xml.match(/<wp:post_type>attachment<\/wp:post_type>/g)).toHaveLength(1);
    expect(xml).not.toContain("<wp:attachment_url>/relative.jpg");
  });

  it("keeps post ids sequential across pages and attachments", () => {
    const xml = buildWxr([page, { ...page, title: "Second" }], {
      author: "admin",
      postType: "page",
      status: "draft",
      emitAttachments: true,
    });
    const ids = [...xml.matchAll(/<wp:post_id>(\d+)<\/wp:post_id>/g)].map((m) => parseInt(m[1], 10));
    // One shared media record produces one attachment across both pages.
    expect(ids).toEqual([1, 2, 3]);
  });
});

describe("cdata", () => {
  it("splits literal ]]> sequences", () => {
    expect(cdata("a]]>b")).toBe("<![CDATA[a]]]]><![CDATA[>b]]>");
  });
});

describe("slugify", () => {
  it("lowercases, hyphenates, trims, and falls back to 'page'", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("---")).toBe("page");
    expect(slugify("")).toBe("page");
  });
});

describe("migrationIdForPage", () => {
  it("prefers explicit identity and otherwise derives a stable fragment-free source identity", () => {
    expect(migrationIdForPage(page)).toBe("page-about-us");
    const derived = migrationIdForPage({ ...page, migrationId: undefined, title: "First title" });
    expect(derived).toMatch(/^blockify-page-v1-[a-f0-9]{16}$/);
    expect(
      migrationIdForPage({
        ...page,
        migrationId: undefined,
        title: "Changed title",
        link: `${page.link}#team`,
      }),
    ).toBe(derived);
  });
});
