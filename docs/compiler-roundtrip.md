# Compiler round-trip verifier (C6)

`src/lib/compiler/roundtrip.ts` parses the deterministic Gutenberg delimiter subset emitted by the C3–C5 compilers. It validates balanced nesting, JSON block attributes, unwrapped content, and unsafe HTML in `wp:html` blocks, then exposes a stable block-tree representation for snapshot tests.

This is a local contract verifier. A live WordPress parser run remains an M1/A2 integration concern and requires the Docker/WordPress harness environment.
