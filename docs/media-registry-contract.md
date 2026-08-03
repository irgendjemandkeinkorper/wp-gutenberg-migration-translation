# Media registry and WXR reconciliation contract

The media registry is the bundle-wide identity boundary between acquisition,
conversion, and WordPress delivery. It is versioned independently as
`1.0.0` in `src/lib/media/registry.ts`.

## Identity

`contentHash` from acquired bytes is the primary identity. A single hash may
have many normalized source URL aliases, including query-string or CDN
transformation variants. URL normalization lowercases the host, removes the
fragment, sorts query parameters, and preserves parameter values. It never
collapses a transformation solely because the path looks similar.

If the same normalized URL is acquired with different hashes, the registry
creates separate records and emits a blocking `source-url-content-conflict`
finding. References remain unresolved until an operator or delivery manifest
selects the correct identity; the implementation does not overwrite one byte
set with another.

## Record contents

Each record keeps:

- observed and normalized source URLs plus alias classification;
- acquisition URL, redirects, status, MIME, byte length, dimensions, filename,
  archive content reference, and archive record ID;
- alt, caption, title, credit, and link-target provenance;
- every page/node use and the source attribute (`src`, `srcset`, or lazy/picture
  reference);
- import state, attempts, WordPress attachment ID, actual destination URL, and
  generated sizes; and
- registry findings for unresolved, failed, ambiguous, or unreconciled media.

`mediaEvidenceFromAcquisition` adapts the existing versioned acquisition/archive
record without changing that contract. Asset acquisition records can attach a
content-addressed `ContentReference` and archive record ID to the media record.

## WXR flow

`buildWxrPackage` builds the existing WXR string and additionally returns the
registry and actionable findings. It emits one attachment item per registry
record, with deterministic ownership assigned to the first page use. The
legacy `buildWxr` wrapper remains available and preserves its string output.

Before WordPress import, attachment items use the acquired/requested source
URL. The importer or REST verification seam must return a
`DestinationAttachment` containing the actual attachment ID and URL. Call
`reconcileMediaRegistry` with those results, then use
`reconcileWxrContent` or `rewriteMediaReferences` to replace every known
`src`, `srcset`, lazy-load, and `<picture>` reference. Destination URLs are
never inferred from an uploads directory convention.

Set `strictMedia`, `requireAcquisition`, or `requireDestination` on the WXR
builder for a blocking preflight. Unresolved relative URLs without page
context, failed acquisition, changed bytes at one URL, missing destination
identity, and ambiguous destination matches fail with diagnostics rather than
silently dropping an attachment or leaving a guessed URL.

The live WordPress attachment-count/remapping proof remains an external
environment concern for the disposable harness. The registry and WXR APIs
provide the deterministic seam for that proof.
