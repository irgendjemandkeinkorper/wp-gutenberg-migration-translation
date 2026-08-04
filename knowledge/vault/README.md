# Blockify migration knowledge vault

This vault is generated from `knowledge/catalog/`. Edit the canonical JSON records, retain sanitized evidence, then regenerate.

- [[Block Capabilities]] — what translates, its evidence tier, known loss modes, and next probe
- [[Failure Classes]] — reusable symptoms and remediation paths
- [[Translation Observations]] — project/version-specific passes, partial translations, placeholders, and failures
- [[Projects/Blockify migration]] — project scope and open release gates

## Evidence tiers

`locally-verified` → `live-parser-verified` → `live-target-verified`. `placeholder-required` and `unsupported` remain explicit until a reviewed solution has evidence.

Update an existing capability instead of creating a competing conclusion, preserve prior evidence links, and never store secrets or private source HTML in this vault.
