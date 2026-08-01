## 2024-05-15 - Unsanitized Href in HTML Extraction
**Vulnerability:** Cross-Site Scripting (XSS) via `javascript:`, `vbscript:`, and `data:` URIs in extracted `<a>` tag `href` attributes.
**Learning:** While the DOM parser and HTML sanitization process enforce a strict tag whitelist, attributes kept on whitelisted tags (like `href` on `<a>`) can still carry dangerous payloads. Attackers can bypass naive checks using control characters (e.g. `java\nscript:`).
**Prevention:** Always validate and sanitize URLs before rendering them into attributes. Strip control characters from URLs before checking their scheme, and reject unsafe schemes (like `javascript:`, `vbscript:`, and `data:`).

## 2025-02-21 - API Key Leakage in Provider Error Messages
**Vulnerability:** Information disclosure via exposure of raw Gemini API credentials inside unhandled SDK or fetch response error messages and stack traces.
**Learning:** External LLM SDKs and HTTP clients often append full request headers, URLs, or query parameters directly into thrown error messages when authentication fails or models are retired. These raw messages propagate up to user-visible error panels.
**Prevention:** Intercept all provider-level API calls with a centralized error handler. Use a strict sanitization function to filter out known API key pattern strings (such as Google's `AIzaSy...` prefix, bearer tokens, or query parameters) and replace them with redaction placeholders before propagating the error to the UI.
