# Page and attachment reconciliation (A3/A4)

`src/lib/qa/reconciliation.ts` provides deterministic evidence reports for imported page identity, metadata, normalized text recall/order, placeholder one-to-one matching, and attachment source/count reconciliation. It consumes destination records rather than guessing slugs or attachment URLs; live WordPress runs remain required for final M1 acceptance.

The canonical WXR metadata and placeholder-manifest schema is documented in [`wxr-format.md`](wxr-format.md). GitHub issue [#13](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/13) tracks the machine-readable reconciliation report that consumes this metadata.
