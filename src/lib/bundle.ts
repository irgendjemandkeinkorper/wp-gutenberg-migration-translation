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

export function saveBundle(pages: BundlePage[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(pages));
  } catch {
    // storage full or unavailable — the in-memory bundle still works
  }
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
