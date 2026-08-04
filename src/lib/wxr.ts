import type { BundlePage } from "./types";
import {
  attachmentSourceUrl,
  buildMediaRegistry,
  MediaPreflightError,
  rewriteMediaReferences,
  validateMediaRegistry,
  type MediaFinding,
  type MediaRegistry,
  type MediaRegistryRecord,
} from "./media/registry";

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
  /** Fixed ISO timestamp for reproducible delivery artifacts and fixtures. */
  generatedAt?: string;
  emitAttachments?: boolean;
  /** Use a previously acquired bundle registry instead of rebuilding URL-only records. */
  mediaRegistry?: MediaRegistry;
  /** Fail before emitting XML when the selected media policy is not satisfied. */
  strictMedia?: boolean;
  requireAcquisition?: boolean;
  requireDestination?: boolean;
  inferHierarchyFromPaths?: boolean;
}

export interface WxrPackage {
  xml: string;
  mediaRegistry: MediaRegistry;
  findings: MediaFinding[];
}

/** Build WXR plus the registry/findings needed for post-import reconciliation. */
export function buildWxrPackage(pages: BundlePage[], opts: WxrOptions): WxrPackage {
  const siteTitle = opts.siteTitle ?? "Imported Content";
  const mediaRegistry = opts.mediaRegistry ?? buildMediaRegistry(pages).registry;
  const findings = validateMediaRegistry(mediaRegistry, {
    requireAcquisition: opts.requireAcquisition,
    requireDestination: opts.requireDestination,
  });
  if (opts.strictMedia && findings.some((finding) => finding.severity === "blocking")) {
    throw new MediaPreflightError(findings.filter((finding) => finding.severity === "blocking"));
  }

  const now = wxrTimestamp(opts.generatedAt);
  const pub = now.toUTCString().replace("GMT", "+0000");
  const dateGmt = now.toISOString().slice(0, 19).replace("T", " ");

  const pageMedia = new Map<BundlePage, MediaRegistryRecord[]>();
  const owners = new Map<string, BundlePage>();
  for (const page of pages) {
    const records = mediaRecordsForPage(page, mediaRegistry);
    pageMedia.set(page, records);
    for (const record of records) {
      if (!owners.has(record.recordId)) owners.set(record.recordId, page);
    }
  }

  // First pass: Allocate post IDs to pages deterministically.
  const pageIdMap = new Map<string, number>();
  const pageIdByCustomIdMap = new Map<string | number, number>();

  let tempId = 1;
  for (const page of pages) {
    const pageId = tempId++;
    if (page.link && !pageIdMap.has(page.link)) {
      pageIdMap.set(page.link, pageId);
    }
    if (page.id !== undefined && !pageIdByCustomIdMap.has(page.id)) {
      pageIdByCustomIdMap.set(page.id, pageId);
    }
    if (opts.emitAttachments) {
      tempId += (pageMedia.get(page) ?? []).filter((record) => owners.get(record.recordId) === page).length;
    }
  }

  // Helper to find parent page path-wise if inferHierarchyFromPaths is true
  function findPathParent(pageLink: string, allPages: BundlePage[]): BundlePage | null {
    try {
      const u = new URL(pageLink, "https://example.com");
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length <= 1) return null;
      parts.pop();
      const parentPath = "/" + parts.join("/");

      for (const p of allPages) {
        try {
          const pu = new URL(p.link, "https://example.com");
          if (pu.origin === u.origin) {
            const pParts = pu.pathname.split("/").filter(Boolean);
            if ("/" + pParts.join("/") === parentPath) {
              return p;
            }
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  const items: string[] = [];
  const pageIds = new Map<BundlePage, number>();

  let nextId = 1;
  for (const page of pages) {
    const pageId = nextId++;
    pageIds.set(page, pageId);

    let parentPostId = 0;
    const hasExplicitParent = page.parentId !== undefined || page.parentUrl !== undefined;

    if (hasExplicitParent) {
      let foundParentId: number | undefined;

      if (page.parentId !== undefined) {
        foundParentId = pageIdByCustomIdMap.get(page.parentId);
      }
      if (foundParentId === undefined && page.parentUrl !== undefined) {
        foundParentId = pageIdMap.get(page.parentUrl);
      }

      if (foundParentId === undefined) {
        throw new Error(
          `Parent page not found in bundle for page "${page.title}". ` +
            `Declared parentId: ${page.parentId !== undefined ? page.parentId : "none"}, ` +
            `parentUrl: ${page.parentUrl !== undefined ? page.parentUrl : "none"}`,
        );
      }
      parentPostId = foundParentId;
    } else if (opts.inferHierarchyFromPaths) {
      const pathParent = findPathParent(page.link, pages);
      if (pathParent) {
        const foundParentId = pageIdMap.get(pathParent.link);
        if (foundParentId !== undefined) {
          parentPostId = foundParentId;
        }
      }
    }

    const menuOrder = page.menuOrder ?? 0;
    const rewritten = rewriteMediaReferences(page.contentBlocks, mediaRegistry, {
      baseUrl: page.link,
      requireDestination: opts.requireDestination,
      preferAttachmentSource: opts.emitAttachments === true,
    });
    findings.push(...rewritten.findings);
    items.push(
      contentItem({ ...page, contentBlocks: rewritten.content }, pageId, parentPostId, menuOrder, opts, pub, dateGmt),
    );
    if (opts.emitAttachments) {
      for (const record of pageMedia.get(page) ?? []) {
        if (owners.get(record.recordId) !== page) continue;
        items.push(attachmentItem(record, nextId++, pageId, opts.author, pub, dateGmt));
      }
    }
  }

  return {
    xml: `<?xml version="1.0" encoding="UTF-8"?>
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
`,
    mediaRegistry,
    findings: uniqueFindings(findings),
  };
}

/** Backward-compatible WXR string API. Use buildWxrPackage for findings. */
export function buildWxr(pages: BundlePage[], opts: WxrOptions): string {
  return buildWxrPackage(pages, opts).xml;
}

export interface WxrReconciliationResult {
  xml: string;
  findings: MediaFinding[];
}

/**
 * Rewrite page content after the WordPress importer has returned real
 * attachment identities. This deliberately consumes destination URLs from
 * the reconciliation response; it never invents an uploads path.
 */
export function reconcileWxrContent(
  wxr: string,
  registry: MediaRegistry,
  options: { requireDestination?: boolean } = { requireDestination: true },
): WxrReconciliationResult {
  const findings: MediaFinding[] = [];
  const xml = wxr.replace(/<item>[\s\S]*?<\/item>/g, (item) => {
    if (/<wp:post_type>attachment<\/wp:post_type>/.test(item)) return item;
    const pageUrl = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? undefined;
    return item.replace(
      /(<content:encoded><!\[CDATA\[)([\s\S]*?)(\]\]><\/content:encoded>)/,
      (_full, prefix: string, content: string, suffix: string) => {
        const rewritten = rewriteMediaReferences(content, registry, {
          baseUrl: pageUrl,
          requireDestination: options.requireDestination ?? true,
        });
        findings.push(...rewritten.findings);
        return `${prefix}${rewritten.content}${suffix}`;
      },
    );
  });
  return { xml, findings: uniqueFindings(findings) };
}

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "page";
}

/** Stable identity used by post-import reconciliation when a caller has not supplied one. */
export function migrationIdForPage(page: Pick<BundlePage, "migrationId" | "link" | "title" | "contentBlocks">): string {
  const explicit = page.migrationId?.trim();
  if (explicit) return explicit;

  let identity = page.link.trim();
  if (identity) {
    try {
      const source = new URL(identity);
      source.hash = "";
      identity = source.href;
    } catch {
      // Preserve a non-URL source locator rather than guessing another identity.
    }
  } else {
    identity = `${page.title.trim()}\n${page.contentBlocks}`;
  }
  return `blockify-page-v1-${fnv1a64(identity)}`;
}

/** CDATA cannot contain the literal "]]>"; split it if present. */
export function cdata(text: string): string {
  return "<![CDATA[" + text.replaceAll("]]>", "]]]]><![CDATA[>") + "]]>";
}

function escapeXml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
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
  parentPostId: number,
  menuOrder: number,
  opts: WxrOptions,
  pub: string,
  dateGmt: string,
): string {
  const slug = slugify(page.title);
  const migrationId = migrationIdForPage(page);
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
        <wp:post_parent>${parentPostId}</wp:post_parent>
        <wp:menu_order>${menuOrder}</wp:menu_order>
        <wp:post_type>${opts.postType}</wp:post_type>
        <wp:post_password></wp:post_password>
        <wp:is_sticky>0</wp:is_sticky>
${postMeta("_blockify_source_url", page.link)}
${postMeta("_blockify_migration_id", migrationId)}
${postMeta("_blockify_source_html", page.sourceHtml ?? "")}
${postMeta("_blockify_target_template", page.targetTemplate ?? "")}
${postMeta("_blockify_migration_placeholders", JSON.stringify(page.placeholders ?? []))}
    </item>`;
}

function wxrTimestamp(generatedAt?: string): Date {
  const timestamp = generatedAt === undefined ? new Date() : new Date(generatedAt);
  if (Number.isNaN(timestamp.valueOf())) {
    throw new TypeError("WxrOptions.generatedAt must be a valid ISO date-time string.");
  }
  return timestamp;
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function postMeta(key: string, value: string): string {
  return `        <wp:postmeta>
            <wp:meta_key>${cdata(key)}</wp:meta_key>
            <wp:meta_value>${cdata(value)}</wp:meta_value>
        </wp:postmeta>`;
}

function attachmentItem(
  record: MediaRegistryRecord,
  postId: number,
  parentId: number,
  author: string,
  pub: string,
  dateGmt: string,
): string {
  const alt = record.provenance.alt[0]?.value ?? "";
  const src = attachmentSourceUrl(record);
  const title = record.provenance.title[0]?.value || alt.trim() || record.filename || imgTitle(src);
  const filename = attachmentFilename(src);
  const mime = record.mime || imageMime(filename);
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

function mediaRecordsForPage(page: BundlePage, registry: MediaRegistry): MediaRegistryRecord[] {
  const records: MediaRegistryRecord[] = [];
  const seen = new Set<string>();
  for (const image of page.images) {
    // Preserve the legacy WXR behavior: relative image entries without an
    // acquisition/source alias are not emitted as importer attachments.
    if (/^(?:\.\.?\/|\/)/.test(image.src)) continue;
    const lookup = findRecord(registry, image.src, page.link);
    if (lookup && !seen.has(lookup.recordId)) {
      seen.add(lookup.recordId);
      records.push(lookup);
    }
  }
  // Include aliases represented only in contentBlocks (srcset/picture/lazy attrs).
  const attrPattern = /\s(?:src|data-src|data-lazy-src|data-original|srcset)\s*=\s*(["'])([\s\S]*?)\1/gi;
  for (const match of page.contentBlocks.matchAll(attrPattern)) {
    const values = match[2].split(",");
    for (const value of values) {
      const source = value.trim().split(/\s+/, 1)[0];
      const record = findRecord(registry, source, page.link);
      if (record && !seen.has(record.recordId)) {
        seen.add(record.recordId);
        records.push(record);
      }
    }
  }
  return records;
}

function findRecord(registry: MediaRegistry, source: string, baseUrl: string): MediaRegistryRecord | null {
  try {
    const canonical = new URL(decodeEntities(source), baseUrl);
    canonical.hash = "";
    canonical.searchParams.sort();
    return registry.records.find((record) => record.sourceUrls.includes(canonical.href)) ?? null;
  } catch {
    return null;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'");
}

function uniqueFindings(findings: MediaFinding[]): MediaFinding[] {
  const result: MediaFinding[] = [];
  for (const finding of findings) {
    const key = [finding.code, finding.recordId, finding.pageUrl, finding.sourceUrl, finding.message].join("|");
    if (
      !result.some(
        (candidate) =>
          [candidate.code, candidate.recordId, candidate.pageUrl, candidate.sourceUrl, candidate.message].join("|") ===
          key,
      )
    ) {
      result.push(finding);
    }
  }
  return result;
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
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    svg: "image/svg+xml",
  };
  return types[ext ?? ""] ?? "image/jpeg";
}
