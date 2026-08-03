# Semantic IR v1 contract

The semantic intermediate representation is the stable, source-agnostic
boundary between extraction/adapters and future target compilers. This module
does not fetch sources, discover media, or serialize Gutenberg blocks.

## Shape

`SemanticDocument` contains a schema version, document ID, document-level source
evidence, title, compatibility policy, extensions, and a `root` node of kind
`document`. Every node has:

- an opaque stable `id`;
- a `kind` from the v1 vocabulary (`document`, `section`, `heading`,
  `paragraph`, `rich-text-span`, `list`, `list-item`, `quote`, `code`, `table`,
  `image`, `gallery`, `figure`, `caption`, `cta`, `button-group`, `button`,
  `columns`, `group`, `embed`, `media`, `form`, `widget`, or `unknown`);
- ordered `children`;
- `text`, string `attributes`, ID-only `assetRefs`, `classification`, and
  `auditEvents`;
- `source` evidence containing the acquisition snapshot ID, a DOM/structural
  locator, and a hash/storage-key/range reference into immutable content;
- an `extensions` object for additive fields.

`unknown` nodes additionally carry the original kind, exact non-empty
`rawHtml`, raw attributes, and a reason. This is the lossless escape hatch for
unsupported content. Asset references contain no `src` or URL: URLs remain in
the acquisition/media registry and are resolved by later stages.

`source.snapshotId` is the existing acquisition `AcquisitionRecord.recordId`.
For a decoded page snapshot, `source.htmlExcerpt.contentSha256` and
`storageKey` should identify `record.content.decodedHtml`; offsets are
character offsets for decoded HTML and byte offsets for raw bytes. The optional
inline `excerpt` is useful for fixtures and unknown-content preservation, but
the immutable archive remains authoritative.

## IDs and validation

`stableNodeId({ snapshotId, structuralPath, kind })` produces a deterministic
`ir-node-v1-*` ID. Callers must provide a unique structural path within a
snapshot. The validator rejects duplicate IDs, invalid child ordering, missing
evidence, confidence outside `[0, 1]`, unknown methods/kinds, cyclic trees,
and URL-only asset references. `serializeSemanticDocument` and
`parseSemanticDocument` validate at their boundary and preserve JSON order and
extensions.

## Version and migration policy

- `1.x.y` is the supported major line. Patch/minor releases are additive and
  readers preserve fields they do not interpret through `extensions`.
- A required-field or meaning change requires a new major version; an older
  reader must reject it rather than guess.
- `migrateToCurrentIr` currently migrates the documented legacy `0.1.0` shape:
  flat `nodes` become ordered children under a document root, source paths and
  excerpts become v1 evidence, asset IDs become ID-only references, and
  unmapped legacy types become lossless `unknown` nodes.
- A valid `1.x.y` document is not rewritten. Its version, IDs, order, evidence,
  unknown content, and extensions are retained. There is no implicit migration
  for an unknown major version.
- Migration is deterministic and must be validated before persistence. A
  migration that cannot prove preservation fails closed.

The focused tests cover the complete node vocabulary, round trips, unknown
content, validation failures, legacy migration, and additive future-version
compatibility.
