---
id: "blockify-wp-6.8.2-known-media-shared-image"
project: "blockify"
capability: "core/image"
outcome: "pass"
evidence_tier: "disposable-wordpress"
confidence: "high"
observed_at: "2026-08-04"
---

# Query-string image aliases reconcile to one shared attachment

- **Project:** [[Projects/Blockify migration|Blockify migration]]
- **Capability:** [[Block Capabilities/core-image|Image]]
- **Outcome:** <code>pass</code>
- **Evidence tier:** <code>disposable-wordpress</code>
- **Confidence:** <code>high</code>
- **Observed:** <code>2026-08-04</code>

## Source pattern

One PNG referenced by two pages through distinct query-string transformation aliases

## Destination profile

WordPress 6.8.2 media library and core/image via official importer 0.8.3

## Metrics

- **pageReferences:** <code>2</code>
- **canonicalAttachments:** <code>1</code>
- **destinationUrls:** <code>1</code>
- **remainingSourceAliases:** <code>0</code>
- **findings:** <code>0</code>

## Observed loss modes

- None observed in this fixture.

## Evidence

- <code>integration/wordpress-harness/fixtures/known-media.wxr.xml</code>
- <code>knowledge/evidence/wordpress/a4-known-media-wordpress-6.8.2.json</code>
- <code>knowledge/evidence/wordpress/a3-text-placeholder-wordpress-6.8.2.json</code>

## Related work

- #10
- #70

## Next probe

Add responsive variants, captions, galleries, and approved-target rendering evidence.
