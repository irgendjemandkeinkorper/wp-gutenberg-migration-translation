---
id: "core/table"
status: "locally-verified"
confidence: "medium"
---

# Table

- **Source/IR ID:** <code>core/table</code>
- **Destination:** core/table
- **Status:** <code>locally-verified</code>
- **Confidence:** <code>medium</code>

## Known loss modes

- caption, alignment, and complex cell attributes require explicit IR extensions

## Evidence

- <code>src/lib/compiler/core.ts</code>
- <code>src/test/compiler-core.test.ts</code>
- <code>integration/reliability/fixtures/static-table.html</code>

## Next probe

Expand table fixtures for captions, colspan/rowspan, and alignment before declaring live support.
