import type { SemanticNode } from "../ir/types";

export interface MediaIdentity {
  assetId: string;
  url?: string;
  attachmentId?: number;
  alt?: string;
  caption?: string;
}

export interface MediaCompilationFinding {
  code: string;
  message: string;
  severity: "warning" | "blocking";
  sourceNodeId: string;
}

export interface MediaCompilation {
  markup: string;
  sourceNodeId: string;
  destinationPath: string;
  findings: MediaCompilationFinding[];
  assetIds: string[];
}

export interface MediaCompilerOptions {
  identities: ReadonlyMap<string, MediaIdentity> | Readonly<Record<string, MediaIdentity>>;
  /** Maps provisional registry IDs to actual imported attachment IDs. */
  rewriteAssetId?: (assetId: string) => string;
}

export function compileMediaNode(node: SemanticNode, options: MediaCompilerOptions): MediaCompilation {
  const findings: MediaCompilationFinding[] = [];
  const assetIds = node.assetRefs.map((ref) => ref.assetId);
  const markup =
    node.kind === "gallery" ? compileGallery(node, options, findings) : compileImage(node, options, findings);
  return {
    markup,
    sourceNodeId: node.id,
    destinationPath: node.source.locator.value,
    findings,
    assetIds,
  };
}

function compileImage(node: SemanticNode, options: MediaCompilerOptions, findings: MediaCompilationFinding[]): string {
  const assetId = node.assetRefs[0]?.assetId;
  if (!assetId) return unresolved(node, "Image has no reconciled media identity.", findings, "image-asset-missing");
  const identity = resolveIdentity(assetId, options);
  if (!identity?.url)
    return unresolved(node, `Media identity ${assetId} has no delivery URL.`, findings, "image-asset-unresolved");
  const attachmentId = identity.attachmentId;
  const attrs: Record<string, string | number> = {};
  if (attachmentId !== undefined) attrs.id = attachmentId;
  attrs.sizeSlug = "large";
  attrs.linkDestination = "none";
  const alt = identity.alt ?? node.attributes.alt ?? "";
  const captionMarkup = renderCaption(
    identity.caption ?? node.attributes.caption,
    node.attributes.credit,
    node.attributes.creditUrl,
  );
  const blockAttrs = JSON.stringify(attrs);
  return `<!-- wp:image ${blockAttrs} -->\n<figure class="wp-block-image size-large"><img src="${escapeAttr(identity.url)}" alt="${escapeAttr(alt)}"/>${captionMarkup}</figure>\n<!-- /wp:image -->`;
}

function compileGallery(
  node: SemanticNode,
  options: MediaCompilerOptions,
  findings: MediaCompilationFinding[],
): string {
  const items = node.children.length ? node.children : [node];
  const rendered = items
    .map((item, index) => {
      const assetId = item.assetRefs[0]?.assetId ?? node.assetRefs[index]?.assetId;
      if (!assetId) {
        return unresolved(
          item,
          `Gallery item ${index + 1} has no reconciled media identity.`,
          findings,
          "gallery-item-unresolved",
        );
      }
      const identity = resolveIdentity(assetId, options);
      if (!identity?.url) {
        return unresolved(
          item,
          `Gallery item ${index + 1} media identity ${assetId} has no delivery URL.`,
          findings,
          "gallery-item-unresolved",
        );
      }
      const attachmentId = identity.attachmentId;
      const blockAttrs = JSON.stringify({
        ...(attachmentId === undefined ? {} : { id: attachmentId }),
        sizeSlug: "large",
        linkDestination: "none",
      });
      const alt = identity.alt ?? item.attributes.alt ?? "";
      const captionMarkup = renderCaption(
        identity.caption ?? item.attributes.caption,
        item.attributes.credit,
        item.attributes.creditUrl,
      );
      return `<!-- wp:image ${blockAttrs} -->\n<figure class="wp-block-image size-large"><img src="${escapeAttr(identity.url)}" alt="${escapeAttr(alt)}"/>${captionMarkup}</figure>\n<!-- /wp:image -->`;
    })
    .join("\n");
  return `<!-- wp:gallery {"linkTo":"none"} -->\n<figure class="wp-block-gallery has-nested-images columns-default is-cropped">${rendered}</figure>\n<!-- /wp:gallery -->`;
}

function renderCaption(caption?: string, credit?: string, creditUrl?: string): string {
  const parts: string[] = [];
  if (caption) parts.push(escapeHtml(caption));
  if (credit) {
    const creditText = escapeHtml(credit);
    const safeUrl = creditUrl && /^(?:https?:)\/\//i.test(creditUrl) ? ` href="${escapeAttr(creditUrl)}" target="_blank" rel="noopener noreferrer"` : "";
    parts.push(
      `<span class="blockify-media-credit">Credit: ${safeUrl ? `<a${safeUrl}>${creditText}</a>` : creditText}</span>`,
    );
  }
  return parts.length ? `<figcaption class="wp-element-caption">${parts.join(" ")}</figcaption>` : "";
}

function resolveIdentity(assetId: string, options: MediaCompilerOptions): MediaIdentity | undefined {
  const rewritten = options.rewriteAssetId?.(assetId) ?? assetId;
  if ("get" in options.identities && typeof options.identities.get === "function") {
    return options.identities.get(rewritten) ?? options.identities.get(assetId);
  }
  const records = options.identities as Readonly<Record<string, MediaIdentity>>;
  return records[rewritten] ?? records[assetId];
}

function unresolved(node: SemanticNode, message: string, findings: MediaCompilationFinding[], code: string): string {
  findings.push({ code, message, severity: "blocking", sourceNodeId: node.id });
  const exceptionId = `blockify-${node.id}`;
  return `<!-- wp:html {"blockifyExceptionId":"${escapeAttr(exceptionId)}"} -->\n<div class="blockify-migration-placeholder" data-exception-id="${escapeAttr(exceptionId)}">${escapeHtml(message)}</div>\n<!-- /wp:html -->`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
