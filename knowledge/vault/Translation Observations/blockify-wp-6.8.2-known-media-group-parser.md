---
id: "blockify-wp-6.8.2-known-media-group-parser"
project: "blockify"
capability: "core/group"
outcome: "pass"
evidence_tier: "disposable-wordpress"
confidence: "high"
observed_at: "2026-08-04"
---

# Known-media groups parse without recovery

- **Project:** [[Projects/Blockify migration|Blockify migration]]
- **Capability:** [[Block Capabilities/core-group|Group]]
- **Outcome:** <code>pass</code>
- **Evidence tier:** <code>disposable-wordpress</code>
- **Confidence:** <code>high</code>
- **Observed:** <code>2026-08-04</code>

## Source pattern

One generated group wrapper per known-media fixture page

## Destination profile

WordPress 6.8.2 core blocks via official importer 0.8.3

## Metrics

- **groupInstances:** <code>2</code>
- **parserFailures:** <code>0</code>
- **invalidBlocks:** <code>0</code>
- **recoveredBlocks:** <code>0</code>
- **unexpectedFreeformHtml:** <code>0</code>

## Observed loss modes

- None observed in this fixture.

## Evidence

- <code>integration/wordpress-harness/fixtures/known-media.wxr.xml</code>
- <code>knowledge/evidence/wordpress/a1-generated-harness-wordpress-6.8.2.json</code>

## Related work

- #71
- #104

## Next probe

Exercise layout, spacing, supports attributes, and nested group variants against the approved target profile.
