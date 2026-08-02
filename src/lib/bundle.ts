import type { BundlePage } from "./types";

const KEY = "blockify.bundle";

export function loadBundle(): BundlePage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBundle(pages: BundlePage[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(pages));
    return true;
  } catch {
    // storage full or unavailable — the in-memory bundle still works
    return false;
  }
}

export function addOrReplaceBundleEntry(
  prev: BundlePage[],
  entry: BundlePage,
): BundlePage[] {
  const at = prev.findIndex((b) => b.link === entry.link);
  if (at < 0) return [...prev, entry];
  const next = [...prev];
  next[at] = entry;
  return next;
}

export function downloadFile(
  filename: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
