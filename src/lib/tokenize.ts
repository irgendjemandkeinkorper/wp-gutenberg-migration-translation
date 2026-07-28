import { token } from "./tokens";
import type { ImageRef, TokenizeResult } from "./types";

/**
 * Replace every usable <img> with a block-level paragraph containing an
 * ⟦IMG_n⟧ token, and record {index, src, alt, caption} per image.
 *
 * Tokens are block-level (their own <p>) so they survive the LLM cleanup step
 * as standalone elements. Images with no resolvable src (or data: URIs, which
 * cannot be sideloaded) are removed without a token — indices stay gapless.
 */
export function tokenizeImages(html: string, baseUrl?: string): TokenizeResult {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  const images: ImageRef[] = [];
  let n = 0;

  for (const img of Array.from(body.querySelectorAll("img"))) {
    const src = resolveSrc(img);
    const figure = img.closest("figure");
    // Replace the whole <figure> only when this img is its single image;
    // otherwise leave the figure and replace the img alone.
    const target =
      figure && figure.querySelectorAll("img").length === 1 ? figure : img;

    if (!src) {
      img.remove();
      continue;
    }

    let abs = src;
    if (baseUrl) {
      try {
        abs = new URL(src, baseUrl).href;
      } catch {
        // keep the raw value if the base is unusable
      }
    }

    const alt = (
      img.getAttribute("alt") ||
      img.getAttribute("title") ||
      ""
    ).trim();
    const caption =
      target === figure
        ? (figure.querySelector("figcaption")?.textContent?.trim() ?? "")
        : "";

    const p = doc.createElement("p");
    p.textContent = token(n);
    target.replaceWith(p);

    images.push({ index: n, src: abs, alt, caption });
    n++;
  }

  return { html: body.innerHTML, images };
}

function resolveSrc(img: Element): string {
  const direct =
    img.getAttribute("src") ||
    img.getAttribute("data-src") ||
    img.getAttribute("data-lazy-src") ||
    firstSrcsetUrl(img.getAttribute("srcset"));
  if (!direct) return "";
  const trimmed = direct.trim();
  if (trimmed.startsWith("data:")) return "";
  return trimmed;
}

function firstSrcsetUrl(srcset: string | null): string {
  if (!srcset) return "";
  const first = srcset.split(",")[0]?.trim() ?? "";
  return first.split(/\s+/)[0] ?? "";
}
