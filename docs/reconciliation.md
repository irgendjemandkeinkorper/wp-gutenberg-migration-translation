# Page and attachment reconciliation (A3/A4)

`src/lib/qa/reconciliation.ts` provides deterministic evidence reports for imported page identity, metadata, normalized text recall/order, placeholder one-to-one matching, and attachment source/count reconciliation. It consumes destination records rather than guessing slugs or attachment URLs; live WordPress runs remain required for final M1 acceptance.

The canonical WXR metadata and placeholder-manifest schema is documented in [`wxr-format.md`](wxr-format.md).

## M1 scorecard contract

Every live harness run writes two equivalent views under its report directory:

- `reconciliation-report.json` — schema-versioned automation contract;
- `reconciliation-report.html` — escaped, static human-readable summary.

JSON schema `1.2.0` is checked in at
[`integration/wordpress-harness/schemas/reconciliation-report.schema.json`](../integration/wordpress-harness/schemas/reconciliation-report.schema.json).
The report builder validates every emitted object against that draft-2020-12
schema before it can be written; schema drift throws a blocking harness error.
The schema requires complete page, block, text, media, placeholder, link, and failure
totals. Every finding has a deterministic `id`, stable class `code`, severity,
blocking flag, scope, and escaped diagnostic. Raw imported post content, source
HTML, credentials, and logs are excluded; source HTML remains a separate
hash/path-addressed audit artifact.

The default blocking configuration is
[`integration/wordpress-harness/reconciliation-thresholds.json`](../integration/wordpress-harness/reconciliation-thresholds.json).
Its `prd-pilot-v1` values mirror PRD Section 6. Metrics owned by later
milestones remain explicit `external` evaluations with their owner issue,
rather than being guessed by the M1 harness. Report-scoped missing evidence or
failed thresholds creates a blocking finding and a non-zero harness exit.
Override the configuration only with a reviewed versioned file:

```bash
BLOCKIFY_RECONCILIATION_CONFIG=/absolute/path/thresholds.json npm run test:wordpress
```

The source and SHA-256 of the selected threshold file are retained in both
reports. CI uploads the complete harness report directory, so JSON, HTML,
source-evidence pointers, and failure diagnostics remain together.

GitHub issue [#13](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/13)
tracks this report contract. Its declared dependency on #70 remains the closure
gate even when the contract implementation passes independently.
