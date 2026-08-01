## 2024-05-15 - Unsanitized Href in HTML Extraction
**Vulnerability:** Cross-Site Scripting (XSS) via `javascript:`, `vbscript:`, and `data:` URIs in extracted `<a>` tag `href` attributes.
**Learning:** While the DOM parser and HTML sanitization process enforce a strict tag whitelist, attributes kept on whitelisted tags (like `href` on `<a>`) can still carry dangerous payloads. Attackers can bypass naive checks using control characters (e.g. `java\nscript:`).
**Prevention:** Always validate and sanitize URLs before rendering them into attributes. Strip control characters from URLs before checking their scheme, and reject unsafe schemes (like `javascript:`, `vbscript:`, and `data:`).

## 2024-06-15 - Persistent Browser-Held Credential Leak
**Vulnerability:** Leaking sensitive provider keys (Gemini API keys) via client-side `localStorage` persistence.
**Learning:** Storing API keys or sensitive authorization tokens in standard browser storage like `localStorage` leaves them highly vulnerable to theft via Cross-Site Scripting (XSS) or browser extension leaks. Furthermore, deploying such static applications without explicit architectural boundaries allows internal-only credentials to be mistaken for secure, production-grade setups.
**Prevention:** Keep sensitive keys/credentials strictly in-memory (React/session state) and automatically evict legacy stored credentials on app mount. Implement a secure Production Proxy Mode that utilizes a server-side backend to hold and attach private keys safely, keeping them completely hidden from frontend clients.
