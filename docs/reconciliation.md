# Page and attachment reconciliation (A3/A4)

`src/lib/qa/reconciliation.ts` provides deterministic evidence reports for imported page identity, metadata, normalized text recall/order, placeholder one-to-one matching, and attachment source/count reconciliation. It consumes destination records rather than guessing slugs or attachment URLs; live WordPress runs remain required for final M1 acceptance.
