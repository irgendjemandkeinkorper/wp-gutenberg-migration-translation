---
id: "blockify-wp-6.8.2-known-media-paragraph-text"
project: "blockify"
capability: "core/paragraph"
outcome: "pass"
evidence_tier: "disposable-wordpress"
confidence: "high"
observed_at: "2026-08-04"
---

# Known-media paragraph text survives import exactly

- **Project:** [[Projects/Blockify migration|Blockify migration]]
- **Capability:** [[Block Capabilities/core-paragraph|Paragraph]]
- **Outcome:** <code>pass</code>
- **Evidence tier:** <code>disposable-wordpress</code>
- **Confidence:** <code>high</code>
- **Observed:** <code>2026-08-04</code>

## Source pattern

Generated paragraph prose across two known-media fixture pages

## Destination profile

WordPress 6.8.2 core blocks via official importer 0.8.3

## Metrics

- **expectedPages:** <code>2</code>
- **exactPages:** <code>2</code>
- **expectedTokens:** <code>23</code>
- **actualTokens:** <code>23</code>
- **matchedTokens:** <code>23</code>
- **textRecall:** <code>1</code>
- **orderPreserved:** <code>true</code>
- **findings:** <code>0</code>

## Observed loss modes

- None observed in this fixture.

## Evidence

- <code>integration/wordpress-harness/fixtures/known-media.wxr.xml</code>
- <code>knowledge/evidence/wordpress/a3-text-placeholder-wordpress-6.8.2.json</code>
- <code>https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/actions/runs/30878520899</code>

## Related work

- #104
- PR #122

## Next probe

Repeat text reconciliation against the approved target theme with broader paragraph markup and typography.
