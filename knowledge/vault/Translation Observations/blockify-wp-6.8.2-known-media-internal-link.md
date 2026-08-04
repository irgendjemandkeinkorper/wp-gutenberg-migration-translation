---
id: "blockify-wp-6.8.2-known-media-internal-link"
project: "blockify"
capability: "core/paragraph"
outcome: "pass"
evidence_tier: "disposable-wordpress"
confidence: "high"
observed_at: "2026-08-04"
---

# Relative internal paragraph link survives import and resolves

- **Project:** [[Projects/Blockify migration|Blockify migration]]
- **Capability:** [[Block Capabilities/core-paragraph|Paragraph]]
- **Outcome:** <code>pass</code>
- **Evidence tier:** <code>disposable-wordpress</code>
- **Confidence:** <code>high</code>
- **Observed:** <code>2026-08-04</code>

## Source pattern

One relative anchor from the first generated fixture page to the second page slug

## Destination profile

WordPress 6.8.2 core/paragraph via official importer 0.8.3

## Metrics

- **expectedLinks:** <code>1</code>
- **actualLinks:** <code>1</code>
- **expectedInternalLinks:** <code>1</code>
- **actualInternalLinks:** <code>1</code>
- **brokenInternalLinks:** <code>0</code>
- **brokenInternalLinkRate:** <code>0</code>
- **exactPages:** <code>2</code>
- **findings:** <code>0</code>

## Observed loss modes

- None observed in this fixture.

## Evidence

- <code>integration/wordpress-harness/fixtures/known-media.wxr.xml</code>
- <code>knowledge/evidence/wordpress/a5-link-scorecard-wordpress-6.8.2.json</code>

## Related work

- #13

## Next probe

Exercise redirected, fragment, query-string, cross-domain, and intentionally broken links against the approved target profile.
