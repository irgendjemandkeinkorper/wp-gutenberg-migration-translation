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

## Translation observation records

Every record in `catalog/translation-observations.json` must identify:

- stable observation `id` and label;
- `projectId` and existing `capabilityId` foreign keys;
- source pattern and destination profile/version;
- outcome: `pass`, `partial`, `placeholder`, or `fail`;
- evidence tier: `deterministic-test`, `disposable-wordpress`,
  `approved-target`, or `pilot`;
- confidence and ISO `observedAt` date;
- finite primitive metrics that make the outcome comparable;
- observed loss modes, retained evidence paths/URLs, related issues, and a
  concrete next probe.

The portable machine-readable contract is
`schemas/translation-observation.schema.json`; the vault generator also
enforces foreign keys and catalog-specific invariants that JSON Schema cannot
resolve across files.

Use one observation per materially distinct project/profile/fixture outcome.
Update an observation when rerunning the same evidence contract; create a new
stable ID when the target version, profile, or source pattern changes enough to
make comparison meaningful. A `pass` at the disposable-WordPress tier does not
imply approved-target or pilot support. A `placeholder` is successful
preservation but unsuccessful semantic translation.

Never promote a capability solely from an unretained manual observation.
