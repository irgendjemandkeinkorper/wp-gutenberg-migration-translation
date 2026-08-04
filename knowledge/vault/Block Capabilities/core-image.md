---
id: "core/image"
status: "live-parser-verified"
confidence: "high"
---

# Image

- **Source/IR ID:** <code>core/image</code>
- **Destination:** core/image
- **Status:** <code>live-parser-verified</code>
- **Confidence:** <code>high</code>

## Known loss modes

- responsive variants, captions, and target-specific image metadata remain outside the current live fixture

## Evidence

- <code>src/lib/compiler/media.ts</code>
- <code>src/test/compiler-media.test.ts</code>
- <code>src/lib/media/registry.ts</code>
- <code>src/test/media.test.ts</code>
- <code>integration/wordpress-harness/fixtures/known-media.wxr.xml</code>
- <code>knowledge/evidence/wordpress/a4-known-media-wordpress-6.8.2.json</code>
- <code>knowledge/evidence/wordpress/a1-generated-harness-wordpress-6.8.2.json</code>
- <code>knowledge/evidence/wordpress/a3-text-placeholder-wordpress-6.8.2.json</code>

## Next probe

Expand live import coverage to responsive srcset variants, captions, galleries, and the approved target theme.
