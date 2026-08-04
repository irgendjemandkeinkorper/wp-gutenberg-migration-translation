// Browsers cannot fetch arbitrary cross-origin sites, so URL mode goes
// through public CORS proxies, best-effort. Paste-HTML is the reliable path.
const PROXIES: ((url: string) => string)[] = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
];

export interface FetchPageOptions {
  timeoutMs?: number;
  maxBytes?: number;
  proxies?: ((url: string) => string)[];
}

export async function fetchPage(url: string, options: FetchPageOptions = {}): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 10000; // 10s default timeout
  const maxBytes = options.maxBytes ?? 10 * 1024 * 1024; // 10MB default size limit

  // Support local development and testing by ignoring proxies if accessing localhost/127.0.0.1
  const proxies = options.proxies ?? (url.includes("127.0.0.1") || url.includes("localhost") ? [(u) => u] : PROXIES);

  let lastError = "";
  for (const proxy of proxies) {
    let timeoutId: any;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const proxyUrl = proxy(url);
      const resp = await fetch(proxyUrl, {
        redirect: "follow",
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      if (!resp.ok) {
        lastError = `HTTP ${resp.status}`;
        continue;
      }

      // Validate Content-Type
      const contentType = resp.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        throw new Error(`Rejected non-HTML response (content-type: "${contentType}")`);
      }

      // Check Content-Length header if present
      const contentLengthStr = resp.headers.get("content-length");
      if (contentLengthStr) {
        const contentLength = parseInt(contentLengthStr, 10);
        if (Number.isFinite(contentLength) && contentLength > maxBytes) {
          throw new Error(
            `Rejected response as its size (${contentLength} bytes) exceeds the limit of ${maxBytes} bytes.`,
          );
        }
      }

      // Stream / read response body chunk-by-chunk up to maxBytes
      let text = "";
      const reader = resp.body?.getReader();
      if (reader) {
        const chunks: Uint8Array[] = [];
        let bytesReceived = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              bytesReceived += value.length;
              if (bytesReceived > maxBytes) {
                throw new Error(`Response size limit of ${maxBytes} bytes exceeded.`);
              }
              chunks.push(value);
            }
          }
        } finally {
          reader.releaseLock();
        }
        const combined = new Uint8Array(bytesReceived);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        text = new TextDecoder().decode(combined);
      } else {
        text = await resp.text();
        if (text.length > maxBytes) {
          throw new Error(`Response size limit of ${maxBytes} bytes exceeded.`);
        }
      }

      if (text.trim()) return text;
      lastError = "empty response";
    } catch (e: any) {
      if (e && (e.name === "AbortError" || e.name === "TimeoutError")) {
        lastError = `Request timed out after ${timeoutMs}ms`;
      } else {
        lastError = e instanceof Error ? e.message : String(e);
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  throw new Error(
    `Could not fetch the page ${url} through a CORS proxy (${lastError}). ` +
      `CORS proxies are third-party and unreliable. For a private and reliable path, ` +
      `use the "Paste HTML" tab instead: open the page, View Page Source, copy and paste it here.`,
  );
}
