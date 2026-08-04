# Knowledge record contract

Every durable record should have:

- a stable `id`;
- a human-readable label;
- a status and confidence that distinguish evidence strength;
- links to code, fixtures, issue numbers, or reports that support the claim;
- known loss modes or failure symptoms; and
- a concrete next probe or remediation step.

Capability statuses:

| Status                 | Meaning                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `locally-verified`     | Deterministic tests/contracts pass; live WordPress support is not yet proven.         |
| `live-parser-verified` | A retained disposable WordPress import proves parser acceptance and stored structure. |
| `live-target-verified` | The approved target profile/theme proves import, structure, and required rendering.   |
| `placeholder-required` | The system preserves visible unresolved content; semantic translation is incomplete.  |
| `unsupported`          | No safe translation exists yet.                                                       |

Failure records must be actionable: symptom, severity, remediation, and
evidence. When a later run changes a claim, update the existing record and
retain the old evidence link rather than creating a contradictory duplicate.

Project observations should identify the project, source/IR block ID,
destination profile and version, fixture/report path, observed loss mode, and
related GitHub issue. Never promote a capability solely from an unretained
manual observation.
