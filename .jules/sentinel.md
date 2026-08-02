## 2024-05-15 - Unsanitized Href in HTML Extraction
**Vulnerability:** Cross-Site Scripting (XSS) via `javascript:`, `vbscript:`, and `data:` URIs in extracted `<a>` tag `href` attributes.
**Learning:** While the DOM parser and HTML sanitization process enforce a strict tag whitelist, attributes kept on whitelisted tags (like `href` on `<a>`) can still carry dangerous payloads. Attackers can bypass naive checks using control characters (e.g. `java\nscript:`).
**Prevention:** Always validate and sanitize URLs before rendering them into attributes. Strip control characters from URLs before checking their scheme, and reject unsafe schemes (like `javascript:`, `vbscript:`, and `data:`).
## 2024-06-15 - Persistent Browser-Held Credential Leak
**Vulnerability:** Leaking sensitive provider keys (Gemini API keys) via client-side `localStorage` persistence.
**Learning:** Storing API keys or sensitive authorization tokens in standard browser storage like `localStorage` leaves them highly vulnerable to theft via Cross-Site Scripting (XSS) or browser extension leaks. Furthermore, deploying such static applications without explicit architectural boundaries allows internal-only credentials to be mistaken for secure, production-grade setups.
**Prevention:** Keep sensitive keys/credentials strictly in-memory (React/session state) and automatically evict legacy stored credentials on app mount. Implement a secure Production Proxy Mode that utilizes a server-side backend to hold and attach private keys safely, keeping them completely hidden from frontend clients.
## 2025-08-01 - Denial of Service and Privacy Risk via Unbounded Fetches
**Vulnerability:** Denial of Service (DoS) via thread hanging / memory exhaustion, and exposure of private content to third-party public CORS proxies.
**Learning:** External network fetches lacking AbortController timeouts and maximum response size limits can hang indefinitely or consume excessive memory when processing extremely slow or massive responses. Additionally, relying on public CORS proxies for URL fetching routes private/credentials-protected page content through third-party services.
**Prevention:** Implement strict AbortController timeouts and stream response bodies chunk-by-chunk to enforce a maximum byte limit before reading the full response. Display prominent UI warnings about proxy risks, document secure/local alternative paths (Paste HTML, local crawler), and preserve skip reasons in operator crawler outputs.

## 2024-08-01 - Prevent API Key Leakage in Error Messages
**Vulnerability:** The raw error message from the Gemini API or LLM SDK could leak the API key if thrown during a network failure or validation error, and is then surfaced directly to the user interface via `String(e)`.
**Learning:** External API errors often reflect request payloads or sensitive identifiers. They must be sanitized before being caught and stored in application state that is rendered to the DOM.
**Prevention:** Catch errors where the API SDK is invoked (`src/lib/llm.ts`) and sanitize the error message (e.g., removing `AIzaSy...`) before rethrowing it.
