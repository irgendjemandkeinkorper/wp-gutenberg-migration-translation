---
id: "unresolved-media-identity"
severity: "blocking"
---

# Media identity not reconciled

- **Failure ID:** <code>unresolved-media-identity</code>
- **Severity:** <code>blocking</code>

## Symptom

An image or gallery asset has no verified destination attachment ID and URL.

## Remediation

Acquire once, match by content hash or source alias, reconcile the destination response, and rewrite only from observed evidence.

## Evidence

- <code>src/lib/media/registry.ts</code>
- <code>src/lib/compiler/media.ts</code>
- <code>docs/media-registry-contract.md</code>
- <code>integration/wordpress-harness/verification.mjs</code>
- <code>integration/wordpress-harness/fixtures/known-media.wxr.xml</code>
- <code>knowledge/evidence/wordpress/a4-known-media-wordpress-6.8.2.json</code>
- <code>knowledge/evidence/wordpress/a1-generated-harness-wordpress-6.8.2.json</code>
