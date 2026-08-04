---
id: "core/list"
status: "locally-verified"
confidence: "high"
---

# Ordered and unordered list

- **Source/IR ID:** <code>core/list</code>
- **Destination:** core/list + core/list-item
- **Status:** <code>locally-verified</code>
- **Confidence:** <code>high</code>

## Known loss modes

- non-list children are preserved with a warning

## Evidence

- <code>src/lib/compiler/core.ts</code>
- <code>src/test/compiler-core.test.ts</code>
- <code>integration/reliability/fixtures/hosted-builder.html</code>

## Next probe

Verify nested ordered/unordered lists against the target parser and theme.
