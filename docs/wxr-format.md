# Blockify WXR post metadata

Every page/post item emitted by `buildWxr` carries five `_blockify_*` postmeta records. WordPress stores each value as text; the shapes below are the canonical contract consumed by reconciliation and downstream QA tooling.

| Meta key | Type in WXR | Required value | Meaning |
| --- | --- | --- | --- |
| `_blockify_source_url` | string | `BundlePage.link` | The requested/source page URL used to identify the source record. It is emitted as an empty string only when the input page link is empty. |
| `_blockify_migration_id` | string | `BundlePage.migrationId` or a deterministic `blockify-page-v1-*` fallback | Stable identity used to match the expected page to its imported WordPress post. The fallback hashes the fragment-free source URL, or the title/content when no source locator exists. |
| `_blockify_source_html` | string | `BundlePage.sourceHtml \|\| ""` | The exact retained source HTML before conversion. It is evidence, not generated target markup. |
| `_blockify_target_template` | string | `BundlePage.targetTemplate \|\| ""` | The selected target template/profile label. An empty value means no target template was selected. |
| `_blockify_migration_placeholders` | JSON string | `JSON.stringify(BundlePage.placeholders \|\| [])` | The durable unsupported-content manifest described below. |

## Placeholder manifest

`_blockify_migration_placeholders` is a JSON-encoded array. An empty manifest is `[]`. Each entry has exactly these fields:

```json
{
  "index": 0,
  "kind": "iframe",
  "source": "https://booking.example.test/tee-times",
  "label": "MIGRATION PLACEHOLDER 1: iframe — https://booking.example.test/tee-times"
}
```

| Field | JSON type | Contract |
| --- | --- | --- |
| `index` | non-negative integer | Stable zero-based asset-token index. |
| `kind` | string | Unsupported asset kind, such as `iframe`, `form`, or `video`. |
| `source` | string | Original resolved source URL or action, or an empty string when the source had no URL. |
| `label` | string | Human-readable label shown in the migration UI and retained for QA. |

The manifest is evidence of an explicit exception. It must not be treated as permission to execute or import the original interactive content. The corresponding target content must remain a visible placeholder until an operator resolves the exception.

## Reconciliation link

The post-import reconciliation contract is documented in [`reconciliation.md`](reconciliation.md) and tracked by GitHub issue [#13](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/13). Reconciliation should compare the imported metadata against the saved source evidence and placeholder blocks; it must not infer missing source URLs or silently discard an entry.
