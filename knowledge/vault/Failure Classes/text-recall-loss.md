---
id: "text-recall-loss"
severity: "blocking"
---

# Meaningful text was dropped or reordered

- **Failure ID:** <code>text-recall-loss</code>
- **Severity:** <code>blocking</code>

## Symptom

Imported meaningful text has recall below 1 or violates source sequence.

## Remediation

Compare immutable source evidence with destination records, isolate the compiler or parser boundary, and add a minimal regression fixture.

## Evidence

- <code>src/lib/qa/reconciliation.ts</code>
- <code>docs/reconciliation.md</code>
- <code>integration/wordpress-harness/verification.mjs</code>
- <code>integration/wordpress-harness/verification.test.mjs</code>
- <code>knowledge/evidence/wordpress/a3-text-placeholder-wordpress-6.8.2.json</code>
