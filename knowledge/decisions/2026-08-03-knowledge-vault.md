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

Project/version-specific outcomes live in the translation-observation catalog.
They preserve both successful and unsuccessful block mappings, metrics, target
profile, evidence tier, loss modes, and next probes without turning one fixture
into a global capability claim.

The catalog must distinguish local-contract evidence, disposable WordPress
parser verification, and approved target-profile verification. A block is not
considered production-supported merely because a unit test, deterministic
compiler test, or disposable import passes. Every unresolved capability must
have a visible placeholder or an explicit unsupported status, a loss mode, and
a next probe/remediation path.

MuninnDB records the decision for cross-project agent recall; the repository
catalog and this note remain the reviewable source artifacts.
