---
id: "core/image"
status: "locally-verified"
confidence: "high"
---

# Image

- **Source/IR ID:** <code>core/image</code>
- **Destination:** core/image
- **Status:** <code>locally-verified</code>
- **Confidence:** <code>high</code>

## Known loss modes

- delivery is blocking until media identity is reconciled to a destination attachment

## Evidence

- <code>src/lib/compiler/media.ts</code>
- <code>src/test/compiler-media.test.ts</code>
- <code>src/lib/media/registry.ts</code>

## Next probe

Run the shared/query-string media fixture through live WordPress and reconcile attachment IDs and URLs.
