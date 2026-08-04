# Portable source-evidence package (B5)

`src/lib/acquisition/source-package.ts` exports decoded HTML, optional raw bytes, redacted acquisition records, hashes, errors, and a deterministic URL index. It uses safe relative paths, verifies every imported file hash, excludes credential-like response headers, and reconstructs archived snapshots for offline processing.
