# Migration knowledge base

This directory is the durable, versioned knowledge layer for Blockify and
future migration projects. It is intentionally separate from chat history and
from generated run artifacts.

## Structure

- `catalog/` — canonical machine-readable records. Update these first.
- `vault/` — an Obsidian-compatible Markdown projection of the catalogs.
- `schemas/` — the record contracts future projects should follow.
- `decisions/` — reviewed project decisions and explicit assumptions.

Open `knowledge/vault/` as an Obsidian vault. To project the same catalogs into
an external vault, run:

```sh
node scripts/generate-knowledge-vault.mjs --write --vault /path/to/your/vault
```

The generated notes distinguish `locally-verified`, `live-verified`,
`placeholder-required`, and `unsupported`. A passing unit test is not a live
WordPress capability claim. Every capability note should link to evidence and
record its next probe or remediation path.

Do not store API keys, credentials, private source content, or unreviewed raw
logs in this knowledge base. Large source HTML and run diagnostics belong in
retained, access-controlled artifacts; notes should link to hashes and paths.
