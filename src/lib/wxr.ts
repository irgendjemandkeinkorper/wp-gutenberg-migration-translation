import type { BundlePage } from "./types";

/**
 * Build a WordPress eXtended RSS (WXR 1.2) document from converted pages.
 * Direct port of wp-migrator's wxr.py.
 *
 * Import via WP admin: Tools -> Import -> WordPress. Each page becomes one
 * <item> with the Gutenberg block markup in <content:encoded> (CDATA).
 * With emitAttachments, one attachment <item> per image carries
 * <wp:attachment_url> = the source URL, parented to its page; the importer
 * ("Download and import file attachments") fetches each server-side into the
 * media library and remaps the inline <img> URLs to the local copies.
 */
export interface WxrOptions {
  author: string;
  postType: "page" | "post";
  status: "draft" | "publish";
  siteTitle?: string;
  emitAttachments?: boolean;
}

export function buildWxr(pages: BundlePage[], opts: WxrOptions): string {
  const siteTitle = opts.siteTitle ?? "Imported Content";
  const now = new Date();
  const pub = now.toUTCString().replace("GMT", "+0000");
  const dateGmt = now.toISOString().slice(0, 19).replace("T", " ");

  const items: string[] = [];
  let nextId = 1;
  for (const page of pages) {
    const pageId = nextId++;
    items.push(contentItem(page, pageId, opts, pub, dateGmt));
    if (opts.emitAttachments) {
      const seen = new Set<string>();
      for (const img of page.images) {
        if (!isRemoteUrl(img.src) || seen.has(img.src)) continue;
        seen.add(img.src);
        items.push(
          attachmentItem(img.src, img.alt, nextId++, pageId, opts.author, pub, dateGmt),
        );
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
    xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    xmlns:wfw="http://wellformedweb.org/CommentAPI/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>https://example.com</link>
    <description>Migrated content</description>
    <pubDate>${pub}</pubDate>
    <language>en-US</language>
    <wp:wxr_version>1.2</wp:wxr_version>
    <wp:author>
        <wp:author_login>${cdata(opts.author)}</wp:author_login>
        <wp:author_display_name>${cdata(opts.author)}</wp:author_display_name>
    </wp:author>
${items.join("\n")}
</channel>
</rss>
`;
}

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "page";
}

/** CDATA cannot contain the literal "]]>"; split it if present. */
export function cdata(text: string): string {
  return "<![CDATA[" + text.replaceAll("]]>", "]]]]><![CDATA[>") + "]]>";
}

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function imgTitle(src: string): string {
  let path = src;
  try {
    path = new URL(src).pathname;
  } catch {
    // keep raw value
  }
  const base = path.split("/").pop() ?? "";
  const noExt = base.replace(/\.[^.]*$/, "");
  let name = noExt;
  try {
    name = decodeURIComponent(noExt);
  } catch {
    // keep undecoded
  }
  name = name.replaceAll("_", " ").replaceAll("-", " ").trim();
  return name || "image";
}

function contentItem(
  page: BundlePage,
  postId: number,
  opts: WxrOptions,
  pub: string,
  dateGmt: string,
): string {
  const slug = slugify(page.title);
  return `    <item>
        <title>${escapeXml(page.title)}</title>
        <link>${escapeXml(page.link)}</link>
        <pubDate>${pub}</pubDate>
        <dc:creator>${cdata(opts.author)}</dc:creator>
        <guid isPermaLink="false">${escapeXml(page.link)}</guid>
        <description></description>
        <content:encoded>${cdata(page.contentBlocks)}</content:encoded>
        <excerpt:encoded>${cdata("")}</excerpt:encoded>
        <wp:post_id>${postId}</wp:post_id>
        <wp:post_date>${dateGmt}</wp:post_date>
        <wp:post_date_gmt>${dateGmt}</wp:post_date_gmt>
        <wp:comment_status>closed</wp:comment_status>
        <wp:ping_status>closed</wp:ping_status>
        <wp:post_name>${cdata(slug)}</wp:post_name>
        <wp:status>${opts.status}</wp:status>
        <wp:post_parent>0</wp:post_parent>
        <wp:menu_order>0</wp:menu_order>
        <wp:post_type>${opts.postType}</wp:post_type>
        <wp:post_password></wp:post_password>
        <wp:is_sticky>0</wp:is_sticky>
${postMeta("_blockify_source_url", page.link)}
${postMeta("_blockify_source_html", page.sourceHtml ?? "")}
${postMeta("_blockify_target_template", page.targetTemplate ?? "")}
${postMeta("_blockify_migration_placeholders", JSON.stringify(page.placeholders ?? []))}
    </item>`;
}

function postMeta(key: string, value: string): string {
  return `        <wp:postmeta>
            <wp:meta_key>${cdata(key)}</wp:meta_key>
            <wp:meta_value>${cdata(value)}</wp:meta_value>
        </wp:postmeta>`;
}

function attachmentItem(
  src: string,
  alt: string,
  postId: number,
  parentId: number,
  author: string,
  pub: string,
  dateGmt: string,
): string {
  const title = alt.trim() || imgTitle(src);
  const filename = attachmentFilename(src);
  const mime = imageMime(filename);
  return `    <item>
        <title>${escapeXml(title)}</title>
        <link>${escapeXml(src)}</link>
        <pubDate>${pub}</pubDate>
        <dc:creator>${cdata(author)}</dc:creator>
        <guid isPermaLink="false">${escapeXml(src)}</guid>
        <description></description>
        <content:encoded>${cdata("")}</content:encoded>
        <excerpt:encoded>${cdata("")}</excerpt:encoded>
        <wp:post_id>${postId}</wp:post_id>
        <wp:post_date>${dateGmt}</wp:post_date>
        <wp:post_date_gmt>${dateGmt}</wp:post_date_gmt>
        <wp:comment_status>closed</wp:comment_status>
        <wp:ping_status>closed</wp:ping_status>
        <wp:post_name>${cdata(slugify(title))}</wp:post_name>
        <wp:status>inherit</wp:status>
        <wp:post_parent>${parentId}</wp:post_parent>
        <wp:menu_order>0</wp:menu_order>
        <wp:post_type>attachment</wp:post_type>
        <wp:post_password></wp:post_password>
        <wp:is_sticky>0</wp:is_sticky>
        <wp:post_mime_type>${mime}</wp:post_mime_type>
        <wp:attachment_url>${escapeXml(src)}</wp:attachment_url>
${postMeta("_wp_attached_file", filename)}
        <wp:postmeta>
            <wp:meta_key>_wp_attachment_image_alt</wp:meta_key>
            <wp:meta_value>${cdata(alt)}</wp:meta_value>
        </wp:postmeta>
    </item>`;
}

function isRemoteUrl(src: string): boolean {
  try {
    const protocol = new URL(src).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function attachmentFilename(src: string): string {
  try {
    return decodeURIComponent(new URL(src).pathname.split("/").pop() || "image");
  } catch {
    return src.split("/").pop() || "image";
  }
}

function imageMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
    webp: "image/webp", avif: "image/avif", svg: "image/svg+xml",
  };
  return types[ext ?? ""] ?? "image/jpeg";
}
