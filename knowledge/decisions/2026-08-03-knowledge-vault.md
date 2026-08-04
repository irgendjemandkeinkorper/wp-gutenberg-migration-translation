---
decision: versioned-migration-knowledge-vault
status: accepted
date: 2026-08-03
---

# Versioned migration knowledge vault

Migration capability and failure knowledge is maintained in canonical JSON
catalogs under `knowledge/catalog/` and projected into `knowledge/vault/` for
Obsidian browsing. External vaults may be generated with
`scripts/generate-knowledge-vault.mjs --vault <path> --write`.

The catalog must distinguish local-contract evidence from live WordPress
verification. A block is not considered production-supported merely because a
unit test or deterministic compiler test passes. Every unresolved capability
must have a visible placeholder or an explicit unsupported status, a loss mode,
and a next probe/remediation path.

MuninnDB records the decision for cross-project agent recall; the repository
catalog and this note remain the reviewable source artifacts.
