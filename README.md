# Blockify — HTML → Gutenberg → WXR

A fully client-side web app that converts content from any non-WordPress web
page into WordPress **Gutenberg block markup**, and bundles converted pages
into a **WXR** file for Tools → Import → WordPress. Nothing leaves your
browser except the optional page fetch (via a public CORS proxy) and the
Gemini API call.

Live app: https://irgendjemandkeinkorper.github.io/wp-gutenberg-migration-translation/

## How it works

The pipeline keeps the LLM on judgment and off mechanics (the design proven in
[wp-migrator](https://github.com/irgendjemandkeinkorper)):

1. **Extract** — main content isolation via a CSS selector override or
   Mozilla Readability.
2. **Tokenize assets** — images, embeds, media, and forms become block-level
   `⟦ASSET_n⟧` tokens. Their source attributes and excerpts are recorded
   outside the LLM's reach, so it cannot hallucinate or silently discard them.
3. **Clean (Gemini)** — messy HTML is normalized to a 22-tag whitelist
   fragment (`h2 h3 h4 p ul ol li blockquote pre code table thead tbody tr th
   td strong em a br hr sup sub`, `href` only). Boilerplate is dropped.
4. **Validate** — the contract is enforced *in code*: wrapper elements
   unwrapped, off-whitelist tags removed, attributes stripped, token
   drift detected and retried (max 2), then repaired with an explicit
   "position lost" warning instead of silent image loss.
5. **Blocks** — deterministic serialization of the validated fragment to
   Gutenberg markup (`wp:paragraph`, `wp:heading`, `wp:list` with true
   nesting, `wp:quote`, `wp:code`, `wp:table`, `wp:separator`, `wp:image`
   with captions).
6. **WXR export** — converted pages accumulate in a bundle; download produces
   a WXR 1.2 file. With "Sideload images" on, each image gets an attachment
   item so the WordPress importer (with *Download and import file
   attachments* checked) copies it into the media library and remaps URLs.
   Duplicate URLs are emitted once and attachment filename/MIME metadata is
   included for more reliable WordPress imports.
7. **Migration QA** — unsupported interactive content (embeds, media players,
   and forms) becomes a visible `MIGRATION PLACEHOLDER` instead of disappearing.
   The exact original HTML, source URL, selected GolfNow template, and
   placeholder manifest are retained as `_blockify_*` post metadata in WXR.

## Usage

1. Open the app, configure your connection mode in Settings: choose Private Pilot Mode and enter your [Gemini API key](https://aistudio.google.com/apikey) (held strictly in browser memory), or choose Production Proxy Mode to route requests securely.
2. Paste a page's HTML (View Page Source), or try Fetch URL.
3. Select the target design from the current
   [GolfNow template library](https://golfnowbusiness.com/template-library/).
4. Convert, review the blocks and any manual-migration placeholders, then either copy-paste into the block editor's
   Code editor view or add the page to the WXR bundle.
5. Download the WXR and import it: WP admin → Tools → Import → WordPress,
   check "Download and import file attachments".

### Whole-site migration (crawl + batch)

CORS proxies are unreliable, so crawling runs locally in Node instead of the
browser:

```bash
npm run crawl -- https://example.com          # → crawl/pages.json
npm run crawl -- https://example.com --max 100 --delay 1000 --out crawl
```

Same-origin BFS, HTML pages only; skips WP plumbing (wp-admin, feeds,
uploads), asset and query-string URLs; respects robots.txt `Disallow` for
`User-agent: *`. Then in the app open the **Batch (crawl)** tab, load
`crawl/pages.json`, and Convert all — every page runs through the normal
pipeline (with the current CSS selector / skip-LLM / model settings) and
lands in the WXR bundle. Re-running a batch replaces bundle entries by URL
instead of duplicating them.

### Minimizing API calls

- **Skip LLM cleanup** (checkbox above Convert): pure deterministic mode —
  the whitelist is enforced in code, scripts/nav/forms are dropped outright,
  headings preserved. Zero API calls, no key needed. Best for already-clean
  pages (e.g. classic WordPress content) combined with a content CSS
  selector; nothing judges boilerplate in this mode.
- **Conversion cache**: successful LLM cleanups are cached in localStorage,
  keyed on model + prompt + extracted content, so re-converting an unchanged
  page never repeats the Gemini call (last 40 pages kept).

## Deployment Architecture & Security Boundaries

Blockify is designed with a strict security boundary that separates local private testing from secure production hosting. Understanding these deployment modes is critical before entering or configuring credentials.

### Supported Deployment Modes

#### 1. Private Pilot Mode (Direct-Browser)
* **Goal**: Local development, individual testing, or private team pilots.
* **Security Mechanics**: The operator inputs their personal Google Gemini API key directly into the settings panel. This key is held **strictly in browser memory (React state)** and is never written to `localStorage`, cookies, or persistent storage. It will be completely cleared if the browser tab is reloaded or closed.
* **Risks**: Exposing keys on frontends or prompting public users to enter their keys is highly discouraged. Direct-browser key entries are **unsafe for public production deployment** because credentials can easily be leaked or misused.

#### 2. Production Proxy Mode (Secure Server-Side Key)
* **Goal**: Safe public production hosting.
* **Security Mechanics**: The frontend application does not accept or hold any Gemini API keys. Instead, it is configured with a **Proxy Endpoint URL**. All clean/normalization LLM requests are routed through this self-hosted proxy backend, which securely appends the actual production API key, implements backend rate-limiting, and hides credentials completely from frontend clients.
* **Configuration**: Specify the Proxy URL and optional Proxy Access Token in settings. Non-sensitive config like the Proxy URL is stored in `localStorage` for convenience, while the Proxy Access Token is kept strictly in browser memory.

---

### The Provider-Proxy Contract

For production deployment, your self-hosted backend proxy must conform to the standard Gemini API REST interface so that the Google Gen AI SDK can interact with it seamlessly.

#### 1. Upstream Endpoint Mapping
The proxy must listen for standard POST requests on the following path and forward them securely to the Google API:
* **Client Request Path**: `/v1/models/{model}:generateContent`
* **Upstream Target**: `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key=SECURE_API_KEY_HERE`

The backend proxy is responsible for appending the `key` query parameter using the secure, server-side secret key, and stripping any frontend-supplied mock key.

#### 2. Request / Response Payloads
* **Request Format**: Standard JSON `application/json`
  ```json
  {
    "contents": {
      "role": "user",
      "parts": [
        {
          "text": "..."
        }
      ]
    },
    "systemInstruction": {
      "parts": [
        {
          "text": "..."
        }
      ]
    },
    "generationConfig": {
      "temperature": 0
    }
  }
  ```
* **Response Format**: Standard JSON `application/json`
  ```json
  {
    "candidates": [
      {
        "content": {
          "parts": [
            {
              "text": "Cleaned HTML result..."
            }
          ]
        }
      }
    ]
  }
  ```

#### 3. Client Authorization (Optional)
If your proxy requires client authentication, the frontend sends the Proxy Access Token as a standard `Authorization: Bearer <TOKEN>` header. Your proxy must validate this token before forwarding the request to Google.

---

### Release & Operator Checklist

Before deploying Blockify publicly or upgrading your pilot, check off the following security and architecture items:

- [ ] **No Client Keys**: Verify that no production API keys are hardcoded in the source code or stored in `localStorage`.
- [ ] **Legacy Key Eviction**: Confirm that legacy `localStorage.getItem("blockify.apiKey")` calls are deleted and any existing keys are evicted on page mount (handled automatically by the React app).
- [ ] **CORS Policy Enforcement**: Ensure your production proxy server explicitly restricts `Access-Control-Allow-Origin` headers to your trusted frontend domains (e.g., your GitHub Pages domain). Do not use wildcard `*` origins in production.
- [ ] **No Raw Payload Logging**: Configure proxy logging so that it records metadata (timestamp, model, status) but **never** logs the raw HTML contents, source URLs, or authorization tokens.
- [ ] **Key Rotation Schedule**: Put in place a regular rotation schedule (e.g., every 90 days) for both Google Gemini API keys and Proxy Access Tokens.
- [ ] **Rate Limiting**: Enforce strict server-side rate limits on the proxy (e.g., max 5 requests per minute per IP) to prevent abuse and budget exhaustion.

## Development

```bash
npm install
npm run dev    # local dev server
npm test       # vitest unit tests (tokenizer, validator, blocks, wxr)
npm run build  # typecheck + production build
```

Deploys to GitHub Pages automatically on push to `main`
(`.github/workflows/deploy.yml`).

## Limitations

- Embeds and forms require manual rebuilding; visible migration placeholders
  retain their source details. Columns and galleries are not inferred.
- Cross-origin URL fetch depends on public CORS proxies; paste HTML when it
  fails.
- Heading levels are clamped to h2–h4.
