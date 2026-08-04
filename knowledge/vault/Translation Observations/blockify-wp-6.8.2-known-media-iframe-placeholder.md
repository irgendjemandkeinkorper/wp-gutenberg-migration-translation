---
id: "blockify-wp-6.8.2-known-media-iframe-placeholder"
project: "blockify"
capability: "core/embed"
outcome: "placeholder"
evidence_tier: "disposable-wordpress"
confidence: "high"
observed_at: "2026-08-04"
---

# Iframe remains an exact visible placeholder

- **Project:** [[Projects/Blockify migration|Blockify migration]]
- **Capability:** [[Block Capabilities/core-embed|Embed]]
- **Outcome:** <code>placeholder</code>
- **Evidence tier:** <code>disposable-wordpress</code>
- **Confidence:** <code>high</code>
- **Observed:** <code>2026-08-04</code>

## Source pattern

Unsupported booking iframe in the known-media fixture

## Destination profile

WordPress 6.8.2 core/html migration placeholder via official importer 0.8.3

## Metrics

- **expectedPlaceholderIds:** <code>1</code>
- **actualPlaceholderIds:** <code>1</code>
- **exactPlaceholderMatch:** <code>true</code>
- **parserFailures:** <code>0</code>

## Observed loss modes

- iframe behavior and provider semantics are preserved only as an unresolved visible placeholder

## Evidence

- <code>integration/wordpress-harness/fixtures/known-media.wxr.xml</code>
- <code>knowledge/evidence/wordpress/a3-text-placeholder-wordpress-6.8.2.json</code>

## Related work

- #104

## Next probe

Capture approved provider, privacy, and target-plugin requirements before attempting semantic embed translation.
