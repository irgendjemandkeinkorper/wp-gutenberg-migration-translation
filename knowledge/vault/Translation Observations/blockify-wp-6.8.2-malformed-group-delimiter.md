---
id: "blockify-wp-6.8.2-malformed-group-delimiter"
project: "blockify"
capability: "core/group"
outcome: "fail"
evidence_tier: "disposable-wordpress"
confidence: "high"
observed_at: "2026-08-04"
---

# Malformed group delimiter fails the live parser gate

- **Project:** [[Projects/Blockify migration|Blockify migration]]
- **Capability:** [[Block Capabilities/core-group|Group]]
- **Outcome:** <code>fail</code>
- **Evidence tier:** <code>disposable-wordpress</code>
- **Confidence:** <code>high</code>
- **Observed:** <code>2026-08-04</code>

## Source pattern

Deliberately mismatched Gutenberg group closing delimiter

## Destination profile

WordPress 6.8.2 parser in the disposable harness

## Metrics

- **importedPages:** <code>1</code>
- **parserFailures:** <code>1</code>
- **unexpectedFreeformHtml:** <code>1</code>
- **harnessExitNonZero:** <code>true</code>

## Observed loss modes

- mismatched closing delimiters produce a parser failure and unexpected freeform HTML

## Evidence

- <code>integration/wordpress-harness/fixtures/known-malformed.wxr.xml</code>
- <code>knowledge/evidence/wordpress/c6-known-malformed-wordpress-6.8.2.json</code>

## Related work

- #71

## Next probe

Keep this fixture in CI and add a minimal case for each newly observed delimiter or recovery failure.
