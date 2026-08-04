---
id: "placeholder-drift"
severity: "blocking"
---

# Placeholder or exception manifest drift

- **Failure ID:** <code>placeholder-drift</code>
- **Severity:** <code>blocking</code>

## Symptom

Expected placeholder IDs do not match imported IDs one-to-one.

## Remediation

Preserve stable exception identity through IR, WXR metadata, import, and reconciliation; never silently discard unresolved content.

## Evidence

- <code>src/lib/qa/reconciliation.ts</code>
- <code>src/lib/exceptions/lifecycle.ts</code>
- <code>docs/wxr-format.md</code>
- <code>integration/wordpress-harness/verification.mjs</code>
- <code>integration/wordpress-harness/verification.test.mjs</code>
- <code>knowledge/evidence/wordpress/a3-text-placeholder-wordpress-6.8.2.json</code>
