---
id: "core/quote"
status: "locally-verified"
confidence: "medium"
---

# Quote

- **Source/IR ID:** <code>core/quote</code>
- **Destination:** core/quote
- **Status:** <code>locally-verified</code>
- **Confidence:** <code>medium</code>

## Known loss modes

- non-paragraph quote children are rendered as flow content

## Evidence

- <code>src/lib/compiler/core.ts</code>
- <code>src/test/compiler-core.test.ts</code>

## Next probe

Add a live quote fixture with nested inline marks and compare rendered structure.
