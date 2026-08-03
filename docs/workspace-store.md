# Workspace store (E2)

`src/lib/workspace/store.ts` is the Node 22 persistence implementation around
the portable E1 manifest contract. It is intentionally Node-only and does not
use browser storage or `localStorage`.

## Layout

Each workspace root contains:

- `workspace.sqlite` — the authoritative manifest record, entity rows,
  indexed scalar fields, and blob metadata.
- `manifest.json` — an atomically replaced, portable E1 snapshot for export and
  human inspection.
- `blobs/<first-two-hash-characters>/<sha256>` — verified content-addressed
  blob bytes.

SQLite uses `node:sqlite`'s synchronous `DatabaseSync` API, available in the
supported Node 22 runtime. No native npm SQLite dependency is required.

## Atomic and recoverable writes

Manifest and blob files are written to a unique temporary file, flushed with
`fsync`, and renamed into place. Manifest entity/index updates are committed
inside one `BEGIN IMMEDIATE` / `COMMIT` transaction before the snapshot rename.
If a process stops between those operations, SQLite remains the source of
truth; opening the workspace validates that record and repairs the snapshot.
Valid orphaned blob files are registered during open, so a crash after a blob
rename but before its metadata transaction does not discard successfully
written content. Invalid or partial files are never registered as blobs.

The focused recovery test injects an interruption immediately before the
manifest rename and verifies that reopening recovers the committed entity and
cleans the temporary snapshot.

## Verified blobs

`putBlob` computes SHA-256, optionally checks a caller-supplied expected hash,
and stores each byte sequence once. Existing bytes are re-read and verified
before deduplication is reported. `getBlob` verifies size and SHA-256 on every
read; missing or corrupted bytes fail closed with a typed
`WorkspaceStoreError`.

## Indexed queries

Entity rows remain in SQLite and are fetched only after a count and bounded
page query. Scalar fields in entity `data` are stored in `entity_fields`, with
an index on `(kind, field, value_json, entity_id)`. `listPages`, `listAssets`,
and `listFindings` are constrained wrappers over `queryEntities`; filters,
limits, and offsets are evaluated by SQLite and do not load the complete
workspace into memory. `explainQuery` is available for acceptance checks and
diagnostics.

The store currently indexes scalar values up to 512 JSON characters and four
nested object levels. Large HTML/raw payloads stay in the entity JSON and
should be addressed by content-addressed blobs when the acquisition pipeline
needs blob-scale storage.

## Unresolved decisions

- Blob garbage collection and retention policy are intentionally deferred to
  the workspace lifecycle/export work.
- Multi-process writers are serialized by SQLite transactions, but a separate
  workspace lease/lock policy is still needed for long-running pipeline stages.
- `node:sqlite` is experimental in Node 22. The repository pins Node 22 and
  uses the built-in API to avoid an unmaintained native dependency; a future
  Node LTS decision may revisit that tradeoff.
