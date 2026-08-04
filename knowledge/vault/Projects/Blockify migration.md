---
id: "blockify"
status: "active"
repository: "wp-gutenberg-migration-translation"
---

# Blockify migration

**Status:** <code>active</code>
**Scope:** HTML/source evidence to Gutenberg IR, deterministic blocks, WXR delivery, and verified WordPress import

## Evidence policy

Local tests establish contracts; live WordPress harness results are required before declaring production support.

## Open gates

- B4 acquisition coverage disposition (#68)
- A4 dependency reconciliation after B4 (#70)
- M1 stable finding IDs, thresholds, schema, and HTML report (#13)
- M1 final CI gate after every exit criterion (#7)
- authoritative target profile approval (#78)
- pilot/release decision

## Catalogs

- [[Block Capabilities]]
- [[Failure Classes]]
- [[Translation Observations]]

## Translation observations

- [[Translation Observations/blockify-wp-6.8.2-known-media-paragraph-text|Known-media paragraph text survives import exactly]]
- [[Translation Observations/blockify-wp-6.8.2-known-media-group-parser|Known-media groups parse without recovery]]
- [[Translation Observations/blockify-wp-6.8.2-known-media-shared-image|Query-string image aliases reconcile to one shared attachment]]
- [[Translation Observations/blockify-wp-6.8.2-known-media-iframe-placeholder|Iframe remains an exact visible placeholder]]
- [[Translation Observations/blockify-wp-6.8.2-malformed-group-delimiter|Malformed group delimiter fails the live parser gate]]
