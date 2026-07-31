# Blockify — HTML → Gutenberg → WXR

A fully client-side web app that converts content from any non-WordPress web
page into WordPress **Gutenberg block markup**, and bundles converted pages
into a **WXR** file for Tools → Import → WordPress. Nothing leaves your
browser except the optional page fetch (via a public CORS proxy) and requests
sent directly to the selected AI provider.

Live app: https://irgendjemandkeinkorper.github.io/wp-gutenberg-migration-translation/

## How it works

The pipeline keeps the LLM on judgment and off mechanics (the design proven in
[wp-migrator](https://github.com/irgendjemandkeinkorper)):

1. **Extract** — main content isolation via a CSS selector override or
   Mozilla Readability.
2. **Tokenize assets** — images, embeds, media, and forms become block-level
   `⟦ASSET_n⟧` tokens. Their source attributes and excerpts are recorded
   outside the LLM's reach, so it cannot hallucinate or silently discard them.
3. **Clean (AI)** — choose Google Gemini, Anthropic Claude, or OpenAI. The
   selected model normalizes messy HTML to a 22-tag whitelist fragment (`h2 h3
   h4 p ul ol li blockquote pre code table thead tbody tr th td strong em a br
   hr sup sub`, `href` only). Boilerplate is dropped.
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

1. Open AI settings, choose Gemini, Claude, or OpenAI, then add that provider's
   API key. Keys are retained in `sessionStorage` for the current browser tab;
   model and provider preferences are stored separately in `localStorage`.
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
- **Conversion cache**: successful AI cleanups are cached in localStorage,
  keyed on provider + model + prompt + extracted content, so re-converting an
  unchanged page never repeats the provider call (last 40 pages kept).

### API-key safety

This static build supports direct browser calls for private/internal migration
work. Do not use long-lived organization keys in a public deployment: browser
users and injected scripts can inspect client-side credentials. Put provider
requests behind a server-side proxy for production use. OpenAI access requires
an OpenAI Platform API key; a ChatGPT subscription is separate from API access.

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
