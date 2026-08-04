---
id: "unknown-content"
status: "placeholder-required"
confidence: "high"
---

# Unsupported or unknown content

- **Source/IR ID:** <code>unknown-content</code>
- **Destination:** core/html migration placeholder
- **Status:** <code>placeholder-required</code>
- **Confidence:** <code>high</code>

## Known loss modes

- content is not semantically translated
- release remains blocked until reviewed or remediated

## Evidence

- <code>src/lib/compiler/core.ts</code>
- <code>src/lib/blocks.ts</code>
- <code>src/test/compiler-core.test.ts</code>
- <code>integration/wordpress-harness/fixtures/known-media.wxr.xml</code>
- <code>knowledge/evidence/wordpress/a1-generated-harness-wordpress-6.8.2.json</code>

## Next probe

Classify recurring unknown nodes and add a dedicated compiler only after a target capability is approved.
