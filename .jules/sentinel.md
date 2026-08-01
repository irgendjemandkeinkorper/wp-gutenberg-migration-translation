## 2024-05-15 - Unsanitized Href in HTML Extraction
**Vulnerability:** Cross-Site Scripting (XSS) via `javascript:`, `vbscript:`, and `data:` URIs in extracted `<a>` tag `href` attributes.
**Learning:** While the DOM parser and HTML sanitization process enforce a strict tag whitelist, attributes kept on whitelisted tags (like `href` on `<a>`) can still carry dangerous payloads. Attackers can bypass naive checks using control characters (e.g. `java\nscript:`).
**Prevention:** Always validate and sanitize URLs before rendering them into attributes. Strip control characters from URLs before checking their scheme, and reject unsafe schemes (like `javascript:`, `vbscript:`, and `data:`).

## 2025-08-01 - Denial of Service and Privacy Risk via Unbounded Fetches
**Vulnerability:** Denial of Service (DoS) via thread hanging / memory exhaustion, and exposure of private content to third-party public CORS proxies.
**Learning:** External network fetches lacking AbortController timeouts and maximum response size limits can hang indefinitely or consume excessive memory when processing extremely slow or massive responses. Additionally, relying on public CORS proxies for URL fetching routes private/credentials-protected page content through third-party services.
**Prevention:** Implement strict AbortController timeouts and stream response bodies chunk-by-chunk to enforce a maximum byte limit before reading the full response. Display prominent UI warnings about proxy risks, document secure/local alternative paths (Paste HTML, local crawler), and preserve skip reasons in operator crawler outputs.
