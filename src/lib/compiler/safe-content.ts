import type { SemanticNode } from "../ir/types";

export interface SafeContentFinding {
  code: string;
  message: string;
  severity: "warning" | "blocking";
  sourceNodeId: string;
  exceptionId: string;
}

export interface SafeContentCompilation {
  markup: string;
  sourceNodeId: string;
  destinationPath: string;
  findings: SafeContentFinding[];
  exceptionId?: string;
}

export interface SafeContentOptions {
  allowedHosts?: ReadonlySet<string>;
  allowedProtocols?: ReadonlySet<string>;
  allowedTags?: ReadonlySet<string>;
  allowedAttributes?: ReadonlySet<string>;
}

const DEFAULT_HOSTS = new Set([
  "maps.google.com",
  "www.google.com",
  "youtube.com",
  "www.youtube.com",
  "player.vimeo.com",
  "vimeo.com",
]);
const DEFAULT_PROTOCOLS = new Set(["https:"]);
const DEFAULT_TAGS = new Set(["a", "br", "div", "iframe", "img", "p", "span", "strong", "em", "ul", "ol", "li"]);
const DEFAULT_ATTRIBUTES = new Set([
  "alt",
  "class",
  "height",
  "href",
  "loading",
  "rel",
  "src",
  "target",
  "title",
  "width",
]);

/**
 * Compile unknown/embed content through an allowlist sanitizer. Unsafe source
 * is represented by a stable exception placeholder; the original HTML is
 * retained only by the IR source-evidence reference.
 */
export function compileSafeContentNode(node: SemanticNode, options: SafeContentOptions = {}): SafeContentCompilation {
  const rawHtml = node.kind === "unknown" ? node.unknown.rawHtml : (node.source.htmlExcerpt.excerpt ?? "");
  const findings: SafeContentFinding[] = [];
  const sanitized = sanitize(rawHtml, {
    allowedHosts: options.allowedHosts ?? DEFAULT_HOSTS,
    allowedProtocols: options.allowedProtocols ?? DEFAULT_PROTOCOLS,
    allowedTags: options.allowedTags ?? DEFAULT_TAGS,
    allowedAttributes: options.allowedAttributes ?? DEFAULT_ATTRIBUTES,
  });
  if (!sanitized.safe || !sanitized.html.trim()) {
    const exceptionId = exceptionFor(node);
    const message = sanitized.reason ?? `Content from ${node.kind} requires migration review.`;
    findings.push({
      code: sanitized.code ?? "unsafe-content",
      message,
      severity: "blocking",
      sourceNodeId: node.id,
      exceptionId,
    });
    return {
      markup: placeholder(exceptionId, message),
      sourceNodeId: node.id,
      destinationPath: node.source.locator.value,
      findings,
      exceptionId,
    };
  }
  return {
    markup: `<!-- wp:html -->\n${sanitized.html}\n<!-- /wp:html -->`,
    sourceNodeId: node.id,
    destinationPath: node.source.locator.value,
    findings,
  };
}

interface SanitizerOptions {
  allowedHosts: ReadonlySet<string>;
  allowedProtocols: ReadonlySet<string>;
  allowedTags: ReadonlySet<string>;
  allowedAttributes: ReadonlySet<string>;
}

interface SanitizedContent {
  safe: boolean;
  html: string;
  code?: string;
  reason?: string;
}

function sanitize(rawHtml: string, options: SanitizerOptions): SanitizedContent {
  if (!rawHtml.trim())
    return { safe: false, html: "", code: "empty-safe-content", reason: "Content has no source HTML to serialize." };
  const document = new DOMParser().parseFromString(rawHtml, "text/html");
  const body = document.body;
  // ⚡ Bolt: Avoid Array.from allocation on NodeList for performance
  body.querySelectorAll("script,style,object,embed,form").forEach((el) => el.remove());
  let unsafeReason: string | undefined;
  const walk = (element: Element): void => {
    if (unsafeReason) return;
    const tag = element.tagName.toLowerCase();
    if (!options.allowedTags.has(tag)) {
      unsafeReason = `Tag <${tag}> is not in the safe-content allowlist.`;
      return;
    }
    // ⚡ Bolt: Avoid Array.from allocation; iterate backwards for safe in-place removal
    const attrs = element.attributes;
    for (let i = attrs.length - 1; i >= 0; i--) {
      const attribute = attrs[i];
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || !options.allowedAttributes.has(name)) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (["href", "src"].includes(name)) {
        const urlCheck = safeUrl(attribute.value, options);
        if (!urlCheck.safe) {
          unsafeReason = urlCheck.reason;
          return;
        }
      }
    }
    // ⚡ Bolt: Avoid Array.from allocation; use native firstElementChild/nextElementSibling
    let child = element.firstElementChild;
    while (child) {
      const next = child.nextElementSibling;
      walk(child);
      child = next;
    }
  };
  // ⚡ Bolt: Avoid Array.from allocation
  let child = body.firstElementChild;
  while (child) {
    const next = child.nextElementSibling;
    walk(child);
    child = next;
  }
  if (unsafeReason) return { safe: false, html: "", code: "unsafe-content", reason: unsafeReason };
  // ⚡ Bolt: Avoid Array.from and intermediate map array allocations
  let html = "";
  let node = body.firstChild;
  while (node) {
    html += node.nodeType === Node.ELEMENT_NODE ? (node as Element).outerHTML : escapeText(node.textContent ?? "");
    node = node.nextSibling;
  }
  return { safe: true, html };
}

function safeUrl(value: string, options: SanitizerOptions): { safe: boolean; reason: string } {
  let url: URL;
  try {
    url = new URL(value, "https://blockify.invalid/");
  } catch {
    return { safe: false, reason: `URL ${value} is malformed.` };
  }
  if (!options.allowedProtocols.has(url.protocol))
    return { safe: false, reason: `Protocol ${url.protocol} is not allowed.` };
  if (url.hostname !== "blockify.invalid" && !options.allowedHosts.has(url.hostname.toLowerCase())) {
    return { safe: false, reason: `Host ${url.hostname} is not in the safe-content allowlist.` };
  }
  return { safe: true, reason: "" };
}

function exceptionFor(node: SemanticNode): string {
  return `blockify-${node.id}`;
}

function placeholder(exceptionId: string, message: string): string {
  return `<!-- wp:html {"blockifyExceptionId":"${escapeAttr(exceptionId)}"} -->\n<div class="blockify-migration-placeholder" data-exception-id="${escapeAttr(exceptionId)}" data-remediation="review-source-evidence">${escapeHtml(message)}</div>\n<!-- /wp:html -->`;
}

function escapeText(value: string): string {
  return escapeHtml(value);
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
