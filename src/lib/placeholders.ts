import type { MigrationPlaceholder } from "./types";

// These are meaningful page features that core blocks cannot faithfully
// recreate. Replace them with visible, searchable QA markers rather than
// silently deleting them.
const UNSUPPORTED = "iframe, object, embed, video, audio, form";

export function preserveUnsupported(html: string): {
  html: string;
  placeholders: MigrationPlaceholder[];
} {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const placeholders: MigrationPlaceholder[] = [];
  for (const el of Array.from(doc.body.querySelectorAll(UNSUPPORTED))) {
    if (!el.isConnected || el.closest(`${UNSUPPORTED}`) !== el) continue;
    const index = placeholders.length;
    const kind = el.tagName.toLowerCase();
    const source =
      el.getAttribute("src") ||
      el.getAttribute("data-src") ||
      el.getAttribute("action") ||
      el.getAttribute("data") ||
      "";
    const label = `MIGRATION PLACEHOLDER ${index + 1}: ${kind}${source ? ` — ${source}` : ""}`;
    placeholders.push({ index, kind, source, label });
    const p = doc.createElement("p");
    p.textContent = `[${label}]`;
    el.replaceWith(p);
  }
  return { html: doc.body.innerHTML, placeholders };
}
