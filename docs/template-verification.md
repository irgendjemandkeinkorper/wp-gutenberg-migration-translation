# Template-match verification

Verifies that converted Gutenberg output structurally matches the operator's
selected GolfNow target template, at three layers:

## 1. Contract library (`src/lib/template-contract.ts`)

`verifyTemplateMatch(serializedBlocks, contract)` parses top-level Gutenberg
comment delimiters and evaluates deterministic rules:

| Rule | Meaning |
| --- | --- |
| `required-block` / `max-block` | Top-level block census must satisfy per-template min/max counts. |
| `forbidden-block` | Named blocks may not appear anywhere (including nested). |
| `lead-block` | The page must open with an allowed block (heading/image/cover). |
| `html-fallback-ratio` | Raw `wp:html` fallbacks are budgeted — a page dominated by fallbacks will not restyle under the template. |
| `image-alt` | Every image must carry alt text. |
| `non-empty` | Output must contain at least one block. |

Per-template contracts live in `src/lib/template-contracts.ts`, keyed by the
same names as the UI selector. The baseline is intentionally conservative;
tighten individual templates as their section anatomy is confirmed against the
[template library](https://golfnowbusiness.com/template-library/). The vitest
suite (`src/test/template-match.test.ts`) guards the verifier and asserts every
selector template has a contract.

## 2. Playwright E2E (`e2e/template-match.spec.ts`)

`npm run test:e2e` drives the real UI in Chromium via the Vite dev server
(configured in `playwright.config.ts`, using the production base path and the
deterministic Local-only cleanup mode — no LLM key or network needed):

1. Paste a fixture page, select a template, Convert; run the contract verifier
   against the rendered block output.
2. Assert the template chip and bundle list carry the selected template.
3. Download the WXR and re-verify the contract against the
   `content:encoded` CDATA plus the `_blockify_target_template` post meta —
   covering the full UI → bundle → WXR path.
4. Assert conversion still succeeds (and is visibly flagged) when no template
   is selected.

CI runs this as the `Template-match E2E` job; failure uploads Playwright traces.

## 3. WordPress import harness (future tightening)

`integration/wordpress-harness/verification.mjs` already records
`targetTemplateSha256` per imported page. Next step: feed the same contracts
into the harness so post-import `post_content` is verified against the
template contract inside a real WordPress, not just in the browser.
