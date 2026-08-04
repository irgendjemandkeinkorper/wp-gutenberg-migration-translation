# Portable workspace package (E5)

`src/lib/workspace/package.ts` packages the E1/E2 workspace manifest, verified content-addressed blobs, and redacted logs into a safe directory package. Import verifies hashes and rejects traversal paths before reopening the workspace offline; a prior package-wrapper schema is upgraded explicitly.
