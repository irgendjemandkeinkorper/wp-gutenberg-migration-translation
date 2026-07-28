// Browsers cannot fetch arbitrary cross-origin sites, so URL mode goes
// through public CORS proxies, best-effort. Paste-HTML is the reliable path.
const PROXIES: ((url: string) => string)[] = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
];

export async function fetchPage(url: string): Promise<string> {
  let lastError = "";
  for (const proxy of PROXIES) {
    try {
      const resp = await fetch(proxy(url), { redirect: "follow" });
      if (!resp.ok) {
        lastError = `HTTP ${resp.status}`;
        continue;
      }
      const text = await resp.text();
      if (text.trim()) return text;
      lastError = "empty response";
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(
    `Could not fetch the page through a CORS proxy (${lastError}). ` +
      `Use the "Paste HTML" tab instead: open the page, View Page Source, copy and paste it here.`,
  );
}
