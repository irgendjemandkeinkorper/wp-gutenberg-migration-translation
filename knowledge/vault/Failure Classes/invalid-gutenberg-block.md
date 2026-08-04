---
id: "invalid-gutenberg-block"
severity: "blocking"
---

# Invalid or recovered Gutenberg block

- **Failure ID:** <code>invalid-gutenberg-block</code>
- **Severity:** <code>blocking</code>

## Symptom

WordPress marks a block invalid, unregistered, or recovered during parse.

## Remediation

Retain the structural diagnostic, identify the target capability/version mismatch, and update the compiler or profile fixture.

## Evidence

- <code>integration/wordpress-harness/verification.mjs</code>
- <code>integration/wordpress-harness/fixtures/known-malformed.wxr.xml</code>
