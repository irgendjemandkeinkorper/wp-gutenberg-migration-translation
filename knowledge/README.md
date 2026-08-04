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

The generated notes distinguish `locally-verified`, `live-parser-verified`,
`live-target-verified`, `placeholder-required`, and `unsupported`. A passing
unit test is not a live WordPress capability claim, and a successful disposable
import is not the same as target-theme verification. Every capability note
links to evidence and records its next probe or remediation path.

## Continuous learning workflow

1. Retain a sanitized, reproducible fixture or report for the new observation.
2. Update the existing capability in `catalog/block-capabilities.json`; do not
   create a competing record for the same source/IR block.
3. Record the observed loss mode and next probe. Add or update a failure class
   when the symptom applies across blocks or projects.
4. Link the evidence path and relevant GitHub issue, then regenerate the vault
   with `npm run knowledge:generate`.
5. Promote a status only when its evidence tier has actually passed. Keep old
   evidence links so future agents can see how the conclusion evolved.

Future repositories can either adopt the same `knowledge/` contract or project
their catalogs into a shared Obsidian vault with `--vault`. Git remains the
reviewable source of truth; Obsidian is the browsing and synthesis surface.

Do not store API keys, credentials, private source content, or unreviewed raw
logs in this knowledge base. Large source HTML and run diagnostics belong in
retained, access-controlled artifacts; notes should link to hashes and paths.
