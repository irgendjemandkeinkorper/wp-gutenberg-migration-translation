import type { BundlePage, BatchPageStatus } from "./types";

const KEY = "blockify.bundle";
const BATCH_PAGES_KEY = "blockify.batchPages";
const BATCH_STATUS_KEY = "blockify.batchStatus";
const BATCH_FILE_NAME_KEY = "blockify.batchFileName";

export interface PersistedBatchPage {
  url: string;
  title: string;
  html?: string;
}

export function loadBatchPages(): PersistedBatchPage[] {
  try {
    const raw = localStorage.getItem(BATCH_PAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBatchPages(pages: PersistedBatchPage[]): void {
  try {
    localStorage.setItem(BATCH_PAGES_KEY, JSON.stringify(pages));
  } catch {
    // If saving fails due to QuotaExceededError (large HTML content),
    // we fallback to saving only the page metadata (url & title).
    try {
      const stripped = pages.map(({ url, title }) => ({ url, title }));
      localStorage.setItem(BATCH_PAGES_KEY, JSON.stringify(stripped));
    } catch {
      // ignore
    }
  }
}

export function loadBatchStatus(): Record<string, { status: BatchPageStatus; note?: string }> {
  try {
    const raw = localStorage.getItem(BATCH_STATUS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveBatchStatus(status: Record<string, { status: BatchPageStatus; note?: string }>): void {
  try {
    localStorage.setItem(BATCH_STATUS_KEY, JSON.stringify(status));
  } catch {
    // ignore
  }
}

export function loadBatchFileName(): string {
  return localStorage.getItem(BATCH_FILE_NAME_KEY) ?? "";
}

export function saveBatchFileName(name: string): void {
  localStorage.setItem(BATCH_FILE_NAME_KEY, name);
}

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

export function addOrReplaceBundleEntry(prev: BundlePage[], entry: BundlePage): BundlePage[] {
  const at = prev.findIndex((b) => b.link === entry.link);
  if (at < 0) return [...prev, entry];
  const next = [...prev];
  next[at] = entry;
  return next;
}

export function downloadFile(filename: string, content: string, mime: string): void {
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
