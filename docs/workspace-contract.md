# Migration workspace contract (E1)

This document defines the portable manifest and deterministic stage graph for
the Blockify migration workspace. It implements PRD FR-1 and the Section 11
portable-workspace boundary. It does not implement persistence, SQLite,
locking, or blob storage; those are E2 responsibilities.

The TypeScript contract is exported from `src/lib/workspace/index.ts`.

## Manifest shape

Every workspace export contains one JSON `WorkspaceManifest`:

```text
migration-workspace/
  manifest.json
  config/
  source/pages/<page-id>/source.html
  snapshots/
  blobs/
  ir/
  profiles/
  plans/
  output/
  delivery/
  qa/
  logs/
```

The E1 manifest describes the records in those directories. E2 decides how
the records and blobs are persisted.

The root fields are:

- `kind`: `blockify.migration-workspace`.
- `schemaVersion`: currently `1.0.0`.
- `manifestId`: deterministic ID derived from `workspaceId`.
- `workspaceId`: the caller-owned logical identity for the workspace.
- `contentHash`: deterministic hash of all known manifest fields other than
  this field.
- `provenance`, `timestamps`, `producer`, and `dependencyHashes`: required
  artifact metadata.
- `compatibility`: the reader and unknown-field policy.
- `entities`: all ten required logical collections.
- `stages`: one nullable stage record for each graph stage.

The required logical entities are:

`workspace`, `source_site`, `page_snapshot`, `asset`, `semantic_document`,
`template_profile`, `conversion_run`, `delivery_record`, `qa_finding`, and
`exception`.

An entity has a stable `id`, a caller-owned logical `identity`, JSON `data`,
and the common artifact metadata. Its ID is derived as:

```text
<entity-kind>:stableHash(<entity-kind> + NUL + <identity>)
```

The implementation uses a portable deterministic 64-bit FNV-1a hash for
identifiers and fingerprints. It is not a cryptographic content hash. A
producer may supply a cryptographic `contentHash` (SHA-256 is recommended for
acquired bytes and blobs); the contract treats it as an opaque, non-empty
string. E2 must use the supplied content hash for content-addressed storage.

This identity rule means that array order, export location, process ID, and
rerun number cannot change an entity ID. If a source URL is the identity, the
acquisition layer must first decide its canonical identity; changing that
identity intentionally creates a new logical record.

## Artifact metadata

Every entity and stage record includes:

```ts
{
  schemaVersion: string;
  contentHash: string;
  provenance: {
    source: string;
    method: string;
    sourceEntityIds: string[];
    evidence: string[];
  };
  timestamps: { createdAt: string; updatedAt: string };
  producer: { name: string; version: string };
  dependencyHashes: Record<string, string>;
}
```

`dependencyHashes` is deliberately keyed rather than positional. Producers
should key it with stable IDs or named external inputs. A changed input hash,
producer version, or dependency stage fingerprint must be visible in the
manifest rather than inferred from filesystem timestamps.

## Stage graph

The graph is exported as `WORKSPACE_STAGE_GRAPH` and its order is available
from `topologicalStageOrder()`.

| Stage | Direct entity inputs | Depends on | Main output |
| --- | --- | --- | --- |
| `acquisition` | `workspace`, `source_site` | — | `page_snapshot` |
| `extraction` | `page_snapshot` | `acquisition` | `semantic_document` |
| `media` | `page_snapshot`, `asset` | `acquisition` | `asset` |
| `profile` | `template_profile` | — | validated `template_profile` |
| `placement` | `semantic_document`, `asset`, `template_profile` | `extraction`, `media`, `profile` | placement artifact |
| `conversion` | `semantic_document`, `asset`, `template_profile` | `placement`, `extraction`, `media`, `profile` | `conversion_run` |
| `delivery` | `conversion_run`, `asset` | `conversion` | `delivery_record` |
| `reconciliation` | `delivery_record` | `delivery` | reconciliation artifact |
| `qa` | `semantic_document`, `template_profile`, `conversion_run`, `delivery_record`, `exception` | `extraction`, `profile`, `conversion`, `delivery`, `reconciliation` | `qa_finding` |

The graph is acyclic. The planner always returns stages in topological order,
with dependencies before dependents. A stage record stores its own producer
version, input hashes, dependency-stage fingerprints, output IDs, status, and
reproducible fingerprint.

## Invalidation rules

`planInvalidation()` accepts a declarative change set. It never consults the
clock, filesystem ordering, array position, or random state.

- An input entity content hash change invalidates each stage that directly
  consumes that entity kind.
- An input entity producer-version change invalidates those same direct
  consumers, even if the producer happened to emit the same content hash.
- A stage implementation/producer version change directly invalidates that
  stage.
- A schema-version change invalidates every stage.
- A forced stage invalidates that stage.
- Every invalidated stage invalidates all graph dependents transitively.
- A change with equal previous/current values is a no-op.
- Multiple reasons are de-duplicated and sorted, so the output is stable.

For example, changing a `page_snapshot` hash directly invalidates
`extraction` and `media`, then transitively invalidates `placement`,
`conversion`, `delivery`, `reconciliation`, and `qa`. It does not invalidate
the independent `profile` stage.

An E2 store should persist completed stage records and use the planner before
resuming or selectively retrying work. A successful stage may be reused only
when its status is complete and its producer, input hashes, and dependency
fingerprints still match.

## Versioning and compatibility

Writers emit `1.0.0`. Readers accept the current schema and older versions in
the same major/minor compatibility window (`1.0.x` today). A future minor
schema is not silently guessed, and a different major is rejected. A schema
migration must add an explicit reader migration and tests before widening the
accepted window.

The declared compatibility policy is:

```json
{
  "reader": "forward-compatible",
  "minimumReaderVersion": "1.0.0",
  "unknownFields": "ignore"
}
```

Unknown additive fields are ignored by the current reader and are excluded
from the known-field content hash. Required fields cannot be made optional by
adding an unknown field. E2 should preserve unknown fields when copying a
manifest, even though E1 does not interpret them.

`serializeWorkspaceManifest()` emits canonical JSON with recursively sorted
object keys and deterministic entity collection ordering. Export/import
therefore preserves IDs and produces the same bytes for the same known
manifest state.

## Corrupt-manifest behavior

`parseWorkspaceManifest()` fails closed:

- invalid JSON throws `WorkspaceManifestError` with code `invalid-json`;
- a valid JSON value with missing, malformed, duplicated, mismatched, or
  tampered fields throws `corrupt-manifest`;
- an unreadable schema throws `unsupported-schema`;
- an explicitly incompatible reader throws `incompatible-reader`.

The error includes structured `issues` with a field path and reason. The
parser never returns a partial manifest, invents IDs, repairs hashes, or
silently drops corrupt records. A store may quarantine the original bytes and
surface the issue to an operator, but that recovery behavior belongs to E2.

