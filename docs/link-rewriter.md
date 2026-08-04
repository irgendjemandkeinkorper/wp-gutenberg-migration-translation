# Internal link rewriting (F2)

`src/lib/links/rewriter.ts` rewrites internal links only through authoritative destination records. It preserves external, mailto, tel, and download policies; retains fragments only when the destination anchor exists; and emits findings for missing destinations or anchors.
