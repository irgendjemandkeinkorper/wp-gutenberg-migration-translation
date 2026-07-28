import { Readability } from "@mozilla/readability";
import type { ExtractResult } from "./types";

const TITLE_SPLIT_RE = /\s+[|–—-]\s+/;

/**
 * Isolate the main content of a page.
 *
 * Order: explicit CSS selector override (inner HTML of the first match),
 * then Mozilla Readability, then the whole <body> as a last resort.
 */
export function extractContent(
  rawHtml: string,
  opts: { url?: string; selector?: string } = {},
): ExtractResult {
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");

  let contentHtml = "";
  let usedSelector = false;
  if (opts.selector) {
    try {
      const node = doc.querySelector(opts.selector);
      if (node && node.innerHTML.trim()) {
        contentHtml = node.innerHTML;
        usedSelector = true;
      }
    } catch {
      // invalid selector — fall through to Readability
    }
  }

  let readabilityTitle = "";
  if (!contentHtml) {
    try {
      const clone = doc.cloneNode(true) as Document;
      const article = new Readability(clone).parse();
      if (article?.content && article.content.trim()) {
        contentHtml = article.content;
        readabilityTitle = (article.title ?? "").trim();
      }
    } catch {
      // Readability can throw on odd documents — fall through
    }
  }

  if (!contentHtml) contentHtml = doc.body?.innerHTML ?? "";

  return {
    title: deriveTitle(doc, readabilityTitle),
    html: contentHtml,
    usedSelector,
  };
}

function deriveTitle(doc: Document, readabilityTitle: string): string {
  if (readabilityTitle) return readabilityTitle;
  const docTitle = (doc.title ?? "").trim();
  if (docTitle) {
    const first = docTitle.split(TITLE_SPLIT_RE)[0].trim();
    if (first) return first;
  }
  const og = doc
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content")
    ?.trim();
  if (og) return og;
  const heading = doc.querySelector("h1, h2")?.textContent?.trim();
  if (heading) return heading;
  return "Untitled";
}
