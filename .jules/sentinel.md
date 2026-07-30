## 2023-10-25 - XSS Vulnerability in HTML Validation
**Vulnerability:** The application was vulnerable to Cross-Site Scripting (XSS) via unsafe protocols (e.g., `javascript:`, `vbscript:`, `data:`) in the `href` attributes of `<a>` tags.
**Learning:** While the HTML validator `enforceWhitelist` stripped unauthorized tags and attributes, it did not validate the content of the `href` attribute. This allowed potentially malicious LLM outputs or Readability extractions to execute scripts.
**Prevention:** Implement an `isSafeUrl` check that strips control characters and validates that URLs do not start with dangerous protocols before assigning them to `href` attributes.
