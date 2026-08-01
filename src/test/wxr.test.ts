import { describe, expect, it } from "vitest";
import { buildWxr, cdata, slugify } from "../lib/wxr";
import type { BundlePage } from "../lib/types";

const page: BundlePage = {
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
    expect(xml).toContain(
      "<wp:attachment_url>https://old-site.com/img/team photo.jpg</wp:attachment_url>",
    );
    expect(xml).toContain("<wp:meta_key>_wp_attachment_image_alt</wp:meta_key>");
    expect(xml).toContain("<wp:meta_value><![CDATA[The team]]></wp:meta_value>");
    expect(xml).toContain("<wp:status>inherit</wp:status>");
    expect(xml).toContain("<wp:post_mime_type>image/jpeg</wp:post_mime_type>");
    expect(xml).toContain("<wp:meta_key><![CDATA[_wp_attached_file]]></wp:meta_key>");
  });

  it("stores source HTML, source URL, and target template as importable post metadata", () => {
    const xml = buildWxr([page], { author: "admin", postType: "page", status: "draft" });
    expect(xml).toContain("<![CDATA[_blockify_source_html]]>");
    expect(xml).toContain("<![CDATA[<main><p>Hello</p></main>]]>");
    expect(xml).toContain("<![CDATA[_blockify_source_url]]>");
    expect(xml).toContain("<![CDATA[_blockify_target_template]]>");
    expect(xml).toContain("<![CDATA[Albatross]]>");
  });

  it("deduplicates fetchable attachments and skips relative image URLs", () => {
    const xml = buildWxr([{ ...page, images: [page.images[0], page.images[0], { src: "/relative.jpg", alt: "relative" }] }], {
      author: "admin", postType: "page", status: "draft", emitAttachments: true,
    });
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
    const ids = [...xml.matchAll(/<wp:post_id>(\d+)<\/wp:post_id>/g)].map((m) =>
      parseInt(m[1], 10),
    );
    expect(ids).toEqual([1, 2, 3, 4]);
  });

  it("resolves correct post_parent values for a parent and two children", () => {
    const parentPage: BundlePage = {
      id: "parent-1",
      title: "Parent Page",
      link: "https://old-site.com/parent",
      contentBlocks: "",
      images: [],
    };
    const child1: BundlePage = {
      parentId: "parent-1",
      title: "Child Page 1",
      link: "https://old-site.com/parent/child-1",
      contentBlocks: "",
      images: [],
    };
    const child2: BundlePage = {
      parentUrl: "https://old-site.com/parent",
      title: "Child Page 2",
      link: "https://old-site.com/parent/child-2",
      contentBlocks: "",
      images: [],
    };

    const xml = buildWxr([parentPage, child1, child2], {
      author: "admin",
      postType: "page",
      status: "draft",
    });

    const items = [...xml.matchAll(/<item>\s*<title>(.*?)<\/title>.*?<wp:post_id>(\d+)<\/wp:post_id>.*?<wp:post_parent>(\d+)<\/wp:post_parent>/gs)];
    expect(items).toHaveLength(3);

    expect(items[0][1]).toBe("Parent Page");
    expect(items[0][2]).toBe("1");
    expect(items[0][3]).toBe("0");

    expect(items[1][1]).toBe("Child Page 1");
    expect(items[1][2]).toBe("2");
    expect(items[1][3]).toBe("1");

    expect(items[2][1]).toBe("Child Page 2");
    expect(items[2][2]).toBe("3");
    expect(items[2][3]).toBe("1");
  });

  it("preserves declared menu order", () => {
    const pageWithOrder: BundlePage = {
      title: "Ordered Page",
      link: "https://old-site.com/ordered",
      contentBlocks: "",
      images: [],
      menuOrder: 42,
    };
    const xml = buildWxr([pageWithOrder], {
      author: "admin",
      postType: "page",
      status: "draft",
    });
    expect(xml).toContain("<wp:menu_order>42</wp:menu_order>");
  });

  it("throws a preflight error when a declared parent is missing", () => {
    const orphan: BundlePage = {
      parentId: "non-existent-parent",
      title: "Orphan Page",
      link: "https://old-site.com/orphan",
      contentBlocks: "",
      images: [],
    };
    expect(() => buildWxr([orphan], {
      author: "admin",
      postType: "page",
      status: "draft",
    })).toThrowError(/Parent page not found in bundle for page "Orphan Page"/);
  });

  it("leaves existing flat bundles unchanged with parent 0 and order 0", () => {
    const flatPage: BundlePage = {
      title: "Flat Page",
      link: "https://old-site.com/flat",
      contentBlocks: "",
      images: [],
    };
    const xml = buildWxr([flatPage], {
      author: "admin",
      postType: "page",
      status: "draft",
    });
    expect(xml).toContain("<wp:post_parent>0</wp:post_parent>");
    expect(xml).toContain("<wp:menu_order>0</wp:menu_order>");
  });

  it("resolves multi-level hierarchy (parent -> child -> grandchild)", () => {
    const gparent: BundlePage = {
      id: "gp",
      title: "Grandparent",
      link: "https://old-site.com/gp",
      contentBlocks: "",
      images: [],
    };
    const parent: BundlePage = {
      id: "p",
      parentId: "gp",
      title: "Parent",
      link: "https://old-site.com/gp/p",
      contentBlocks: "",
      images: [],
    };
    const child: BundlePage = {
      parentId: "p",
      title: "Child",
      link: "https://old-site.com/gp/p/c",
      contentBlocks: "",
      images: [],
    };

    const xml = buildWxr([gparent, parent, child], {
      author: "admin",
      postType: "page",
      status: "draft",
    });

    const items = [...xml.matchAll(/<item>\s*<title>(.*?)<\/title>.*?<wp:post_id>(\d+)<\/wp:post_id>.*?<wp:post_parent>(\d+)<\/wp:post_parent>/gs)];
    expect(items).toHaveLength(3);

    expect(items[0][1]).toBe("Grandparent");
    expect(items[0][2]).toBe("1");
    expect(items[0][3]).toBe("0");

    expect(items[1][1]).toBe("Parent");
    expect(items[1][2]).toBe("2");
    expect(items[1][3]).toBe("1");

    expect(items[2][1]).toBe("Child");
    expect(items[2][2]).toBe("3");
    expect(items[2][3]).toBe("2");
  });

  it("infers parent-child hierarchy from URL paths when explicitly configured", () => {
    const parent: BundlePage = {
      title: "Parent Path Page",
      link: "https://old-site.com/about",
      contentBlocks: "",
      images: [],
    };
    const child: BundlePage = {
      title: "Child Path Page",
      link: "https://old-site.com/about/team/",
      contentBlocks: "",
      images: [],
    };

    const defaultXml = buildWxr([parent, child], {
      author: "admin",
      postType: "page",
      status: "draft",
    });
    const defaultItems = [...defaultXml.matchAll(/<item>\s*<title>(.*?)<\/title>.*?<wp:post_id>(\d+)<\/wp:post_id>.*?<wp:post_parent>(\d+)<\/wp:post_parent>/gs)];
    expect(defaultItems[1][3]).toBe("0");

    const inferredXml = buildWxr([parent, child], {
      author: "admin",
      postType: "page",
      status: "draft",
      inferHierarchyFromPaths: true,
    });
    const inferredItems = [...inferredXml.matchAll(/<item>\s*<title>(.*?)<\/title>.*?<wp:post_id>(\d+)<\/wp:post_id>.*?<wp:post_parent>(\d+)<\/wp:post_parent>/gs)];
    expect(inferredItems[1][3]).toBe("1");
  });

  it("handles duplicate URLs deterministically by referencing the first matching parent", () => {
    const parent1: BundlePage = {
      id: "parent-first",
      title: "First Parent",
      link: "https://old-site.com/dup",
      contentBlocks: "",
      images: [],
    };
    const parent2: BundlePage = {
      id: "parent-second",
      title: "Second Parent",
      link: "https://old-site.com/dup",
      contentBlocks: "",
      images: [],
    };
    const child: BundlePage = {
      parentUrl: "https://old-site.com/dup",
      title: "Child Page",
      link: "https://old-site.com/dup/child",
      contentBlocks: "",
      images: [],
    };

    const xml = buildWxr([parent1, parent2, child], {
      author: "admin",
      postType: "page",
      status: "draft",
    });

    const items = [...xml.matchAll(/<item>\s*<title>(.*?)<\/title>.*?<wp:post_id>(\d+)<\/wp:post_id>.*?<wp:post_parent>(\d+)<\/wp:post_parent>/gs)];
    expect(items[2][1]).toBe("Child Page");
    expect(items[2][3]).toBe("1");
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
