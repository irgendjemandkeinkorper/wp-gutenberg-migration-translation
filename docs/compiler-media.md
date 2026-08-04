# Media Gutenberg compiler (C4)

`src/lib/compiler/media.ts` serializes image and gallery IR nodes using media-registry identities. Delivery URLs and attachment IDs are supplied by the caller through `MediaIdentity`; provisional registry IDs can be rewritten to imported attachment identities before serialization.

Missing identities produce blocking findings and stable placeholders rather than guessed URLs. Gallery item order is the IR child order.
