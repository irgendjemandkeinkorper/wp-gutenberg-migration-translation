---
id: "core/group"
status: "live-parser-verified"
confidence: "high"
---

# Group

- **Source/IR ID:** <code>core/group</code>
- **Destination:** core/group
- **Status:** <code>live-parser-verified</code>
- **Confidence:** <code>high</code>

## Known loss modes

- layout and supports attributes beyond the fixture still require target-profile validation

## Evidence

- <code>integration/wordpress-harness/verification.mjs</code>
- <code>integration/wordpress-harness/fixtures/known-good.wxr.xml</code>
- <code>knowledge/evidence/wordpress/c6-known-good-wordpress-6.8.2.json</code>

## Next probe

Expand the live fixture across layout/supports attributes and compare the rendered target tree.
