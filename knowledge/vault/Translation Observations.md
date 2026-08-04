# Translation Observations

These records preserve project, target version, evidence tier, metrics, and known loss modes so a global block capability is never inferred from one fixture.

<!-- prettier-ignore -->
| Observation | Capability | Outcome | Evidence tier | Project | Observed |
| --- | --- | --- | --- | --- | --- |
| [[Translation Observations/blockify-wp-6.8.2-known-media-paragraph-text|Known-media paragraph text survives import exactly]] | [[Block Capabilities/core-paragraph|Paragraph]] | <code>pass</code> | <code>disposable-wordpress</code> | [[Projects/Blockify migration|Blockify migration]] | <code>2026-08-04</code> |
| [[Translation Observations/blockify-wp-6.8.2-known-media-group-parser|Known-media groups parse without recovery]] | [[Block Capabilities/core-group|Group]] | <code>pass</code> | <code>disposable-wordpress</code> | [[Projects/Blockify migration|Blockify migration]] | <code>2026-08-04</code> |
| [[Translation Observations/blockify-wp-6.8.2-known-media-shared-image|Query-string image aliases reconcile to one shared attachment]] | [[Block Capabilities/core-image|Image]] | <code>pass</code> | <code>disposable-wordpress</code> | [[Projects/Blockify migration|Blockify migration]] | <code>2026-08-04</code> |
| [[Translation Observations/blockify-wp-6.8.2-known-media-iframe-placeholder|Iframe remains an exact visible placeholder]] | [[Block Capabilities/core-embed|Embed]] | <code>placeholder</code> | <code>disposable-wordpress</code> | [[Projects/Blockify migration|Blockify migration]] | <code>2026-08-04</code> |
| [[Translation Observations/blockify-wp-6.8.2-malformed-group-delimiter|Malformed group delimiter fails the live parser gate]] | [[Block Capabilities/core-group|Group]] | <code>fail</code> | <code>disposable-wordpress</code> | [[Projects/Blockify migration|Blockify migration]] | <code>2026-08-04</code> |
