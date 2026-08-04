import { isLoneToken, tokenIndices } from "./tokens";
import type { AssetRef } from "./types";

/**
 * Deterministic whitelist-HTML → Gutenberg block serializer. No LLM here.
 *
 * Input must already be validated (validate.ts): only whitelist tags, no
 * stray attributes, every ⟦ASSET_n⟧ token alone in its own top-level <p>.
 * Asset URLs/captions are joined in from the asset map, so positions come
 * from the source DOM, never guessed.
 */
export function serializeBlocks(html: string, images: Map<number, AssetRef>): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const out: string[] = [];

  for (const node of Array.from(doc.body.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) out.push(paragraphBlock(escapeHtml(text)));
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const block = elementToBlock(node as HTMLElement, images);
    if (block) out.push(block);
  }

  return out.join("\n\n");
}

function elementToBlock(el: HTMLElement, images: Map<number, AssetRef>): string {
  const tag = el.tagName.toLowerCase();
  switch (tag) {
    case "p": {
      const text = el.textContent ?? "";
      if (isLoneToken(text)) {
        const idx = tokenIndices(text)[0];
        const media = images.get(idx);
        return media ? assetBlock(media) : "";
      }
      const inner = el.innerHTML.trim();
      return inner ? paragraphBlock(inner) : "";
    }
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const level = Math.min(Math.max(parseInt(tag[1], 10), 2), 4);
      return (
        `<!-- wp:heading {"level":${level}} -->\n` +
        `<h${level} class="wp-block-heading">${el.innerHTML.trim()}</h${level}>\n` +
        `<!-- /wp:heading -->`
      );
    }
    case "ul":
      return listBlock(el, false);
    case "ol":
      return listBlock(el, true);
    case "blockquote": {
      const inner: string[] = [];
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const t = child.textContent?.trim();
          if (t) inner.push(paragraphBlock(escapeHtml(t)));
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const cel = child as HTMLElement;
          if (cel.tagName.toLowerCase() === "p") {
            const t = cel.innerHTML.trim();
            if (t) inner.push(paragraphBlock(t));
          } else {
            const t = cel.innerHTML.trim();
            if (t) inner.push(paragraphBlock(t));
          }
        }
      }
      return (
        `<!-- wp:quote -->\n` +
        `<blockquote class="wp-block-quote">${inner.join("\n\n")}</blockquote>\n` +
        `<!-- /wp:quote -->`
      );
    }
    case "pre":
      return (
        `<!-- wp:code -->\n` +
        `<pre class="wp-block-code"><code>${escapeHtml(el.textContent ?? "")}</code></pre>\n` +
        `<!-- /wp:code -->`
      );
    case "table":
      // Bare <table> inside the figure — core rejects nonstandard classes.
      return (
        `<!-- wp:table -->\n` +
        `<figure class="wp-block-table"><table>${el.innerHTML.trim()}</table></figure>\n` +
        `<!-- /wp:table -->`
      );
    case "hr":
      return (
        `<!-- wp:separator -->\n` +
        `<hr class="wp-block-separator has-alpha-channel-opacity"/>\n` +
        `<!-- /wp:separator -->`
      );
    default: {
      const inner = el.innerHTML.trim();
      return inner ? paragraphBlock(inner) : "";
    }
  }
}

function paragraphBlock(inner: string): string {
  return `<!-- wp:paragraph -->\n<p>${inner}</p>\n<!-- /wp:paragraph -->`;
}

function listBlock(el: HTMLElement, ordered: boolean): string {
  const tag = ordered ? "ol" : "ul";
  const attrs = ordered ? ' {"ordered":true}' : "";
  const items: string[] = [];

  for (const li of Array.from(el.children)) {
    if (li.tagName.toLowerCase() !== "li") continue;

    // Separate nested lists (Gutenberg nests a wp:list block inside the
    // parent wp:list-item) from the item's own inline content.
    const nested: HTMLElement[] = [];
    const clone = li.cloneNode(true) as HTMLElement;
    for (const sub of Array.from(clone.children)) {
      const subTag = sub.tagName.toLowerCase();
      if (subTag === "ul" || subTag === "ol") {
        nested.push(sub as HTMLElement);
        sub.remove();
      }
    }
    const inline = clone.innerHTML.trim();
    const nestedMarkup = nested.map((n) => listBlock(n, n.tagName.toLowerCase() === "ol")).join("\n\n");

    items.push(`<!-- wp:list-item -->\n` + `<li>${inline}${nestedMarkup}</li>\n` + `<!-- /wp:list-item -->`);
  }

  return (
    `<!-- wp:list${attrs} -->\n` +
    `<${tag} class="wp-block-list">${items.join("\n\n")}</${tag}>\n` +
    `<!-- /wp:list -->`
  );
}

function assetBlock(media: AssetRef): string {
  if (media.type === "image") {
    const alt = escapeAttr(media.alt);
    const caption = media.caption
      ? `<figcaption class="wp-element-caption">${escapeHtml(media.caption)}</figcaption>`
      : "";
    return (
      `<!-- wp:image {"sizeSlug":"large"} -->\n` +
      `<figure class="wp-block-image size-large"><img src="${escapeAttr(media.src)}" alt="${alt}"/>${caption}</figure>\n` +
      `<!-- /wp:image -->`
    );
  } else {
    // Unsupported reference serialization into an intentionally visible Gutenberg block with stable machine-readable identity
    const sanitizedAttrs = JSON.stringify(media.attributes);
    const excerptEscaped = escapeHtml(media.excerpt);
    const label =
      `MIGRATION PLACEHOLDER ${media.index + 1}: ${media.type}` + ` — Unsupported ${media.tagName.toUpperCase()}`;
    const srcHtml = media.src ? `<p><strong>Source:</strong> <code>${escapeHtml(media.src)}</code></p>` : "";
    return (
      `<!-- wp:html {"blockifyAsset":true,"assetIndex":${media.index},"assetType":"${media.type}"} -->\n` +
      `<div class="blockify-unsupported-placeholder" style="border: 2px dashed #ff4d4f; padding: 15px; margin: 15px 0; background-color: #fff2f0; font-family: monospace;" data-asset-index="${media.index}" data-asset-type="${media.type}">\n` +
      `  <h4 style="margin: 0 0 10px 0; color: #ff4d4f;">⚠️ ${label} (Placeholder #${media.index})</h4>\n` +
      `  ${srcHtml}\n` +
      `  <p><strong>Attributes:</strong> <code>${escapeHtml(sanitizedAttrs)}</code></p>\n` +
      `  <details>\n` +
      `    <summary style="cursor: pointer; font-weight: bold;">Original Source Excerpt</summary>\n` +
      `    <pre style="margin-top: 10px; background: #fafafa; padding: 10px; border: 1px solid #d9d9d9; overflow: auto; white-space: pre-wrap;"><code>${excerptEscaped}</code></pre>\n` +
      `  </details>\n` +
      `</div>\n` +
      `<!-- /wp:html -->`
    );
  }
}

export function escapeHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replaceAll('"', "&quot;");
}
