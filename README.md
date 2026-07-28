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
2. **Tokenize images** — every `<img>` becomes a block-level `⟦IMG_n⟧` token;
   `{src, alt, figcaption}` are recorded outside the LLM's reach, so it can
   never hallucinate an image.
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

## Usage

1. Open the app, add your [Gemini API key](https://aistudio.google.com/apikey)
   in Settings (stored in `localStorage` only).
2. Paste a page's HTML (View Page Source), or try Fetch URL.
3. Convert, review the blocks, then either copy-paste into the block editor's
   Code editor view or add the page to the WXR bundle.
4. Download the WXR and import it: WP admin → Tools → Import → WordPress,
   check "Download and import file attachments".

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

- No embeds, columns, or galleries — iframes are intentionally stripped.
- Cross-origin URL fetch depends on public CORS proxies; paste HTML when it
  fails.
- Heading levels are clamped to h2–h4.
