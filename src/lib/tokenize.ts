import { token } from "./tokens";
import type { AssetRef, AssetType, TokenizeResult } from "./types";

const SAFE_ATTRIBUTES: Record<string, string[]> = {
  img: ["src", "alt", "title", "width", "height", "srcset"],
  iframe: ["src", "width", "height", "title", "allow", "allowfullscreen"],
  object: ["data", "type", "width", "height"],
  embed: ["src", "type", "width", "height"],
  video: ["src", "width", "height", "poster", "controls", "autoplay", "loop", "muted"],
  audio: ["src", "controls", "autoplay", "loop", "muted"],
  form: ["action", "method", "name", "id"],
};

/**
 * Replace every usable image and unsupported element (iframe, object, embed, video, audio, form)
 * with a block-level paragraph containing an ⟦ASSET_n⟧ token, and record details of each.
 *
 * Tokens are block-level so they survive the LLM cleanup step as standalone elements.
 */
export function tokenizeImages(html: string, baseUrl?: string): TokenizeResult {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  // 1. Remove scripts, styles, noscript, nav, and elements with role="navigation"
  for (const el of Array.from(body.querySelectorAll("script, style, noscript, nav, [role='navigation']"))) {
    el.remove();
  }

  const assets: AssetRef[] = [];
  let n = 0;

  // 2. Query all target elements in reading order
  const targets = Array.from(body.querySelectorAll("img, iframe, object, embed, video, audio, form"));

  for (const el of targets) {
    // Skip if element was already removed or is nested inside an already tokenized/replaced parent
    if (!el.isConnected) {
      continue;
    }

    const tag = el.tagName.toLowerCase();
    const type = getAssetType(tag);

    // Filter tracking/analytics and non-content noise
    if (isTrackingOrNoise(el, type)) {
      el.remove();
      continue;
    }

    const src = resolveAssetSrc(el, type);

    // Images with no resolvable src (or data: URIs, which cannot be sideloaded) are removed without a token — indices stay gapless.
    if (type === "image" && (!src || src.startsWith("data:"))) {
      el.remove();
      continue;
    }

    let abs = src;
    if (abs && baseUrl) {
      try {
        abs = new URL(abs, baseUrl).href;
      } catch {
        // keep the raw value if the base is unusable
      }
    }

    const alt = (el.getAttribute("alt") || el.getAttribute("title") || "").trim();

    const figure = el.closest("figure");
    // Replace the whole <figure> only when this asset is its single tokenizable target;
    // otherwise leave the figure and replace the asset alone.
    const target =
      figure && figure.querySelectorAll("img, iframe, object, embed, video, audio, form").length === 1 ? figure : el;

    const caption = target === figure ? (figure.querySelector("figcaption")?.textContent?.trim() ?? "") : "";

    // Extract sanitized attributes
    const attributes: Record<string, string> = {};
    const safeAttrs = SAFE_ATTRIBUTES[tag] || [];
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (safeAttrs.includes(name)) {
        const val = attr.value.trim();
        const normalizedVal = val.replace(/[\x00-\x20\x7F-\x9F]/g, "").toLowerCase();

        // Block dangerous protocols like javascript: and vbscript:.
        // We only block data: URIs if they are being used to execute scripts or embed HTML.
        // data:image/... and data:audio/... are safe and should be allowed.
        if (
          !normalizedVal.startsWith("javascript:") &&
          !normalizedVal.startsWith("vbscript:") &&
          !(normalizedVal.startsWith("data:") && !normalizedVal.startsWith("data:image/") && !normalizedVal.startsWith("data:audio/") && !normalizedVal.startsWith("data:video/"))
        ) {
          attributes[name] = val;
        }
      }
    }

    // Bounded source excerpt
    const excerpt = el.outerHTML.slice(0, 300) + (el.outerHTML.length > 300 ? "..." : "");

    const p = doc.createElement("p");
    p.textContent = token(n);
    target.replaceWith(p);

    assets.push({
      index: n,
      type,
      src: abs,
      alt,
      caption,
      tagName: tag,
      attributes,
      excerpt,
    });
    n++;
  }

  return { html: body.innerHTML, images: assets };
}

function getAssetType(tagName: string): AssetType {
  switch (tagName) {
    case "img":
      return "image";
    case "iframe":
      return "iframe";
    case "object":
      return "object";
    case "embed":
      return "embed";
    case "video":
      return "video";
    case "audio":
      return "audio";
    case "form":
      return "form";
    default:
      throw new Error(`Unknown asset tag: ${tagName}`);
  }
}

function isTrackingOrNoise(el: Element, type: AssetType): boolean {
  if (type === "image") {
    const width = el.getAttribute("width");
    const height = el.getAttribute("height");
    if (width === "1" && height === "1") return true;
    if (width === "0" || height === "0") return true;
    const src = el.getAttribute("src") || "";
    if (src.includes("pixel") || src.includes("analytics") || src.includes("tracker")) {
      return true;
    }
  }
  return false;
}

function resolveAssetSrc(el: Element, type: AssetType): string {
  let src = "";
  if (type === "image") {
    src =
      el.getAttribute("src") ||
      el.getAttribute("data-src") ||
      el.getAttribute("data-lazy-src") ||
      firstSrcsetUrl(el.getAttribute("srcset")) ||
      "";
  } else if (type === "iframe" || type === "embed") {
    src = el.getAttribute("src") || "";
  } else if (type === "object") {
    src = el.getAttribute("data") || el.getAttribute("src") || "";
  } else if (type === "video" || type === "audio") {
    src = el.getAttribute("src") || "";
    if (!src) {
      const source = el.querySelector("source");
      if (source) {
        src = source.getAttribute("src") || "";
      }
    }
  } else if (type === "form") {
    src = el.getAttribute("action") || "";
  }
  return src.trim();
}

function firstSrcsetUrl(srcset: string | null): string {
  if (!srcset) return "";
  const first = srcset.split(",")[0]?.trim() ?? "";
  return first.split(/\s+/)[0] ?? "";
}
