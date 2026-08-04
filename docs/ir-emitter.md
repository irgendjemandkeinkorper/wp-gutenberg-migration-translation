# Deterministic semantic IR emitter

`src/lib/ir/emitter.ts` is the C2 adapter between the existing extraction,
tokenization, validation pipeline and the versioned semantic IR v1 contract in
`src/lib/ir`.

## Boundary

Call `emitSemanticIr` with a `PageResult` from `convertPage` and the matching
`ArchivedPageSnapshot`:

```ts
const document = emitSemanticIr({
  page: conversionResult,
  snapshot,
  mediaRegistry,
});
```

`page.intermediateHtml` is the source of truth. The emitter is deterministic:
it does not call an LLM, fetch a URL, discover media, or serialize Gutenberg
blocks. A caller may provide `deterministicHtml` when it has an equivalent
deterministic fragment, but an arbitrary model response must not be supplied.

## Mapping

The adapter maps the current deterministic HTML vocabulary as follows:

| Source HTML | IR kind |
| --- | --- |
| `h1`–`h6` | `heading` |
| `p` | `paragraph` |
| `ul`, `ol` | `list` |
| `li` | `list-item` |
| `blockquote` | `quote` |
| `pre` | `code` |
| `table` | `table` |
| `figure`, `figcaption` | `figure`, `caption` |
| `strong`, `em`, `a`, `br`, `sup`, `sub`, `code` | `rich-text-span` |
| `article`, `main`, `section` | `section` |
| `div` | `group` |
| isolated `⟦ASSET_n⟧` | asset-specific `image`, `embed`, `media`, or `form` |

An element without a v1 mapping becomes an `unknown` node. Its exact
`outerHTML`, original tag, and string attributes are retained, and an audit
event explains why it was preserved. Direct media elements that bypass
tokenization fail instead: emitting a URL-bearing media element would break
the C1 ID-only asset contract.

## Evidence and identity

Every document and node is anchored to the supplied acquisition record. The
locator is a deterministic structural path in the emitted fragment, while the
HTML excerpt contains the corresponding source or deterministic fragment
evidence. Node IDs are derived from acquisition snapshot ID, structural path,
and IR kind through `stableNodeId`.

Asset references contain only IDs. Resolution order is:

1. explicit `assetIds` override keyed by tokenizer index;
2. a matching `MediaRegistry` record ID;
3. a deterministic `asset-unresolved-v1-*` ID that can be reconciled later.

The fallback never embeds the source URL in the IR. Every issued tokenizer
asset must occur exactly once in the deterministic HTML. Missing, duplicate,
or invented tokens produce `SemanticIrEmissionError` with actionable details.

Root audit events record the deterministic pipeline boundary, explicit
boilerplate exclusions when supplied, pipeline warnings, and any repaired
asset positions. If the upstream stage supplies no exclusion records, the
root receives a warning event rather than silently implying that no
boilerplate was removed.

The focused fixture coverage is in
`src/test/ir-emitter.test.ts`; it verifies ordering, source evidence, stable
output, media IDs, token accountability, and lossless unknown content.
