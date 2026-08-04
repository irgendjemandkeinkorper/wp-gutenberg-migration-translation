---
id: "core/gallery"
status: "locally-verified"
confidence: "medium"
---

# Gallery

- **Source/IR ID:** <code>core/gallery</code>
- **Destination:** core/gallery + core/image
- **Status:** <code>locally-verified</code>
- **Confidence:** <code>medium</code>

## Known loss modes

- gallery layout/options are intentionally minimal; each asset still requires media reconciliation

## Evidence

- <code>src/lib/ir/emitter.ts</code>
- <code>src/lib/compiler/media.ts</code>
- <code>src/test/ir-emitter.test.ts</code>
- <code>src/test/compiler-media.test.ts</code>

## Next probe

Verify ordering, shared assets, and gallery rendering in the target WordPress environment.
