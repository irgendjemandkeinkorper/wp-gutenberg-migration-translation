## 2024-05-15 - Unsanitized Href in HTML Extraction
**Vulnerability:** Cross-Site Scripting (XSS) via `javascript:`, `vbscript:`, and `data:` URIs in extracted `<a>` tag `href` attributes.
**Learning:** While the DOM parser and HTML sanitization process enforce a strict tag whitelist, attributes kept on whitelisted tags (like `href` on `<a>`) can still carry dangerous payloads. Attackers can bypass naive checks using control characters (e.g. `java\nscript:`).
**Prevention:** Always validate and sanitize URLs before rendering them into attributes. Strip control characters from URLs before checking their scheme, and reject unsafe schemes (like `javascript:`, `vbscript:`, and `data:`).
## 2024-08-01 - Prevent API Key Leakage in Error Messages
**Vulnerability:** The raw error message from the Gemini API or LLM SDK could leak the API key if thrown during a network failure or validation error, and is then surfaced directly to the user interface via `String(e)`.
**Learning:** External API errors often reflect request payloads or sensitive identifiers. They must be sanitized before being caught and stored in application state that is rendered to the DOM.
**Prevention:** Catch errors where the API SDK is invoked (`src/lib/llm.ts`) and sanitize the error message (e.g., removing `AIzaSy...`) before rethrowing it.
