# CMS source adapters (G2/G3)

`src/lib/adapters/wordpress.ts` detects WordPress evidence and returns bounded content-root, boilerplate, lazy-media, and serialized-block hints. `src/lib/adapters/cms.ts` provides equivalent Drupal and Joomla adapters. All adapters return evidence and hints only; Gutenberg output remains downstream of semantic IR validation and the compiler.
