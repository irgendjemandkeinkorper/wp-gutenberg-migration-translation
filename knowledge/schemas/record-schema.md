# Knowledge record contract

Every durable record should have:

- a stable `id`;
- a human-readable label;
- a status and confidence that distinguish evidence strength;
- links to code, fixtures, issue numbers, or reports that support the claim;
- known loss modes or failure symptoms; and
- a concrete next probe or remediation step.

Capability statuses:

| Status                 | Meaning                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `locally-verified`     | Deterministic tests/contracts pass; live WordPress support is not yet proven.        |
| `live-verified`        | A retained disposable/target WordPress run proves the behavior.                      |
| `placeholder-required` | The system preserves visible unresolved content; semantic translation is incomplete. |
| `unsupported`          | No safe translation exists yet.                                                      |

Failure records must be actionable: symptom, severity, remediation, and
evidence. When a later run changes a claim, update the existing record and
retain the old evidence link rather than creating a contradictory duplicate.
