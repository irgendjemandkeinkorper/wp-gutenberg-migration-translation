# Acquisition and page-snapshot contract

The crawler writes an append-only archive under the selected output directory,
normally `crawl/archive/`. The contract is versioned independently from the
application bundle:

- `contractVersion`: `1.0.0` — wire/storage shape.
- `semanticVersion`: `1.0.0` — meaning of acquisition fields.
- `compatibility`: readers are forward-compatible and ignore unknown fields;
  the minimum reader version is recorded with every record.

Every record contains the requested URL, final URL when known, redirect chain,
retrieval metadata (timestamp, method, user agent, duration, response headers),
HTTP status, encoding, discovery parent/depth, policy decision, errors, and
content references. A successful `page-snapshot` also records the raw-byte and
decoded-HTML SHA-256 hashes, byte lengths, and content-addressed storage keys.

Successful pages are stored as:

```text
archive/
  manifest.jsonl                 # append-only record index
  records/<record-id>.json       # immutable acquisition record
  blobs/raw/<raw-sha256>         # exact response bytes
  blobs/html/<html-sha256>.html  # decoded HTML, UTF-8 encoded
```

Non-HTML responses, HTTP failures, redirect loops, and other unsuccessful
attempts create `recordKind: "attempt"` records. A successful response reached
through redirects is a `page-snapshot` with `outcome: "redirect"` and a full
redirect chain; each redirect hop is retained in that record.

Writes are create-only. A rerun appends new attempt/snapshot metadata and never
overwrites a previous record. Content-addressed blobs are reused only when the
same bytes already exist. A hash mismatch prevents archive completion.

`crawl/pages.json` remains backward-compatible with the existing app: its
`pages` entries still include `url`, `title`, and decoded `html`. That HTML is
safe to convert offline. The conversion pipeline also accepts a validated
`archivedSnapshot`; it uses the archived HTML and final URL and performs no
source fetch. Use deterministic (`skipLlm`) conversion when the entire
conversion run must be network-free.
