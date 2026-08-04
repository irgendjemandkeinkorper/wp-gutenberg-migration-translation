---
id: "source-evidence-missing"
severity: "blocking"
---

# Source evidence cannot be audited

- **Failure ID:** <code>source-evidence-missing</code>
- **Severity:** <code>blocking</code>

## Symptom

A finding has no immutable source hash, locator, or retained audit artifact.

## Remediation

Persist the source snapshot and byte-range/HTML evidence before conversion; link the report to the artifact instead of embedding unbounded content.

## Evidence

- <code>src/lib/ir/types.ts</code>
- <code>integration/wordpress-harness/report.mjs</code>
