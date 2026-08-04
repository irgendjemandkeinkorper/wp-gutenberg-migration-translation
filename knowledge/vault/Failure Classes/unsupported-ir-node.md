---
id: "unsupported-ir-node"
severity: "blocking"
---

# Unsupported semantic node

- **Failure ID:** <code>unsupported-ir-node</code>
- **Severity:** <code>blocking</code>

## Symptom

A source node has no deterministic target compiler and becomes a visible migration placeholder.

## Remediation

Classify the node, capture target capability evidence, then add a focused compiler and round-trip fixture.

## Evidence

- <code>src/lib/compiler/core.ts</code>
- <code>src/lib/ir/types.ts</code>
- <code>integration/wordpress-harness/fixtures/known-media.wxr.xml</code>
- <code>knowledge/evidence/wordpress/a1-generated-harness-wordpress-6.8.2.json</code>
