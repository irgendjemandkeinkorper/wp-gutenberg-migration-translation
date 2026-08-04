# Safe embed and unknown-content compiler (C5)

`src/lib/compiler/safe-content.ts` sanitizes embeds and unknown IR evidence through explicit host, protocol, tag, and attribute allowlists. Scripts, object/embed/form tags, and inline event handlers are never emitted. Unsafe content becomes a stable exception placeholder containing only a remediation summary; original HTML remains in the IR source-evidence record.
