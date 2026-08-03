# Blockify Implementation Handoff

Updated: 2026-08-03

Repository: [irgendjemandkeinkorper/wp-gutenberg-migration-translation](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation)

## Current baseline

- Local HEAD: latest commit titled `Add portable source and workspace packages` (use `git log -1 --oneline` for the exact hash).
- Latest implementation wave: B5 source-evidence package and E5 portable workspace package.
- Branch: `main`, locally ahead of `origin/main` by 18 commits and behind by 21 commits before this handoff refresh.
- The handoff source files are committed with this implementation wave. A clean worktree after commit is expected.
- Do not pull, rebase, or reset blindly. Inspect the 21-commit divergence and preserve all nineteen local commits after this handoff refresh before synchronizing.
- No implementation PR has been pushed and no branch-protection change has been made.

## Implemented in c810d94

- Gate 0 CI: `.github/workflows/ci.yml` runs on pull requests to `main`, uses Node 22, runs `npm ci`, `npx tsc -b`, and `npm test`.
- Node runtime pin: `package.json` and `package-lock.json` declare `>=22 <23`.
- Acquisition contract: `src/lib/acquisition/contract.ts` defines versioned URL, redirect, retrieval, encoding, hash, discovery, policy, error, content, and compatibility records.
- Immutable archive: `src/lib/acquisition/archive.ts` and `scripts/acquisition/archive.mjs` provide content-addressed raw/HTML storage, append-only records, and offline HTML reads.
- Crawler integration: `scripts/crawl.mjs` records redirects, non-HTML responses, failures, immutable snapshots, and robots-denied attempts with `policy.decision=deny`.
- Offline pipeline input: `src/lib/pipeline.ts` accepts archived HTML sources.
- WordPress harness: `integration/wordpress-harness/` contains Docker Compose provisioning, official importer flow, fixtures, sanitized failure artifacts, isolation, teardown, and README instructions.
- Contract documentation: `docs/acquisition-archive-contract.md`.

## Implemented in the subsequent waves

- Crawler pure-logic extraction for URL normalization, same-site filtering, skip rules, and robots decisions under `scripts/crawler/logic.mjs`, with focused tests.
- C1 semantic IR contract under `src/lib/ir/`: vocabulary, validation, stable IDs, evidence, assets, unknown nodes, and version migration.
- E1 workspace contract under `src/lib/workspace/index.ts`: entities, manifest, stages, invalidation, compatibility, and corruption handling.
- B3 media registry under `src/lib/media/registry.ts`, with WXR attachment remapping and focused fixtures/tests.
- A2 Gutenberg verification harness under `integration/wordpress-harness/verification.mjs`, including known-good and known-malformed fixtures.
- C2 semantic IR emitter under `src/lib/ir/emitter.ts`: deterministic structural IDs, acquisition evidence, media-registry/fallback asset IDs, token-drift failures, confidence/method metadata, boilerplate audit events, and lossless unknown nodes.
- E2 filesystem/SQLite/content-addressed workspace store under `src/lib/workspace/store.ts`: atomic fsync-and-rename persistence, manifest recovery, SHA-256 verified blob deduplication, and bounded indexed queries.
- Node 22 type support via `@types/node` for the `node:sqlite` implementation.
- C3 core compiler under `src/lib/compiler/core.ts`: deterministic paragraphs, headings, inline marks/links, nested lists, quotes, code, tables, findings, and source-path mapping.
- C4 media compiler under `src/lib/compiler/media.ts`: deterministic image/gallery blocks, media identity rewrites, metadata, and unresolved-media placeholders.
- C5 safe-content compiler under `src/lib/compiler/safe-content.ts`: explicit host/protocol/tag/attribute allowlists, unsafe-content stripping, and stable exception placeholders.
- C6 local round-trip verifier under `src/lib/compiler/roundtrip.ts`: balanced Gutenberg delimiters, JSON attributes, stable block trees, malformed markup, and unsafe HTML checks.
- E3 checkpoint store under `src/lib/workspace/checkpoint.ts`: atomic durable state, safe pause/resume, recovery of interrupted items, integrity hashes, and audit events.
- E4 selective retry under `src/lib/workspace/retry.ts`: dependency-aware stage invalidation and affected-entity-scoped retry plans with audit records.
- F1 canonical URL mapping under `src/lib/links/url-map.ts`: deterministic requested/target records, fragments, downloads, protocol destinations, and redirect findings.
- G1 bounded source adapters under `src/lib/adapters/interface.ts`: CMS detection evidence, generic fallback, conflict diagnostics, extraction hints, and IR boundary validation.
- F2 link rewriter under `src/lib/links/rewriter.ts`: destination-record rewrites, fragment/anchor verification, and explicit unresolved-link findings.
- F3 exception lifecycle under `src/lib/exceptions/lifecycle.ts`: one-to-one placeholder identity, audited resolution, and release blocking.
- G2 WordPress adapter under `src/lib/adapters/wordpress.ts`: bounded detection, content-root/boilerplate/media hints, and serialized-block evidence.
- G3 Drupal/Joomla adapters under `src/lib/adapters/cms.ts`: bounded detection and extraction hints with generic fallback.
- B5 source-evidence package under `src/lib/acquisition/source-package.ts`: redacted acquisition records, decoded/raw content, hashes, URL index, and offline snapshot reconstruction.
- E5 workspace package under `src/lib/workspace/package.ts`: manifest/blob/log export, hash/path verification, offline import, and wrapper-schema upgrade.

## Current verification evidence

- `npm test -- --reporter=dot` — 32 test files, 148 tests passed.
- `npm run build` — TypeScript and Vite production build passed.
- `git diff --check` — passed.
- `node integration/wordpress-harness/run.mjs --dry-run` — passed.
- Live WordPress/Docker validation remains unavailable because Docker Desktop/WSL integration is not enabled in this environment.

## Historical c810d94 verification evidence

All of the following passed after the robots-policy fix:

- `npm test -- --reporter=dot` — 12 test files, 55 tests passed.
- `npm run build` — TypeScript and Vite build passed.
- `node --check scripts/crawl.mjs` — passed.
- `git diff --check` — passed before commit.
- `node integration/wordpress-harness/run.mjs --dry-run` — passed.

The live WordPress harness has not run because Docker Desktop/WSL integration is unavailable in the current environment.

## GitHub issue state

Manifest coverage is 44 IDs total. The current tracked issue state is eighteen closed from implementation evidence and 26 open; some closed IDs are setup/contract issues outside the current wave.

Closed with implementation evidence:

- [#47](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/47) — Node engine pin.
- [#69](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/69) — acquisition/page-snapshot contract.
- [#103](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/103) — immutable source archive.
- [#61](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/61) — pure crawler logic extraction and tests.
- [#73](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/73) — migration workspace contract.
- [#74](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/74) — semantic IR contract.
- [#77](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/77) — filesystem/SQLite/content-addressed workspace store.
- [#82](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/82) — semantic IR emission.
- [#79](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/79) — safe embed and unknown-node compilation.
- [#80](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/80) — image and gallery compilation.
- [#81](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/81) — core text/list/quote/code/table compilation.
- [#88](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/88) — selective retry and dependency invalidation.
- [#72](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/72) — canonical URL and redirect map.
- [#75](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/75) — bounded source-adapter interface and CMS evidence.
- [#76](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/76) — authoritative internal-link rewriting.
- [#87](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/87) — migration-exception lifecycle.
- [#85](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/85) — Drupal and Joomla source adapters.
- [#86](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/86) — WordPress source adapter.
- [#105](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/105) — portable raw-HTML/source-evidence package.
- [#106](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/106) — portable workspace export/import.

Implemented but intentionally still open:

- [#11](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/11) — harness needs a live Docker/WordPress run.
- [#55](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/55) — needs an actual PR check run and branch protection requiring `CI / Validate`.
- [#78](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/78) — blocked at the human-decision gate pending authoritative target capability data.
- [#89](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/89) — implementation exists; actual forced-kill process integration remains to be run.
- [#92](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/92) — local round-trip verifier exists; live WordPress parser validation remains to be run.

The original backlog setup report and complete A1–H5 mapping are in [`github-backlog-setup-report.md`](./github-backlog-setup-report.md). The source requirements remain [`blockify-human-grade-migration-prd.md`](./blockify-human-grade-migration-prd.md) and [`blockify-github-issue-manifest.json`](./blockify-github-issue-manifest.json).

## Recommended next wave

Work in three disjoint scopes:

1. Run live WordPress validation for C6/#92, E3/#89, A1/#11, B3/#10, and A2/#71; resolve D1/#78 only with authoritative target data.
2. Complete remaining CI/release-readiness issues (#55/#56/#59/#60/#57) through a real PR and protected-main verification.
3. Continue remaining adapter/compiler QA and release-readiness issues in manifest dependency order.
4. Preserve this handoff and inspect the 21-commit remote divergence before any synchronization.

Do not start C2, E2, or downstream consumers until their contract artifacts are reviewed. Do not start D2/D6 without authoritative GolfNow target data.

## Later dependency order

- M1: finish #11/#55, then A2/A3/A4 and reconcile A5/#13; B3/#10 remains the media-delivery implementation lane and still needs live WordPress evidence.
- M3: C1 before C2–C6; D1 before D2–D6.
- M2: E1 before E2–E5.
- M4: F/G work after the shared IR and workspace contracts stabilize.
- M5: H2 remains parent-only until pilot sites are approved; H4 remains parent-only until evidence-backed failure classes exist.

## Handoff rules

- Read the repository `AGENTS.md` instructions and all three handoff source files before changing scope.
- Preserve existing user changes and all local implementation commits.
- Keep each agent’s write set disjoint and return changed files, tests, risks, and open questions.
- Do not close an issue based only on intent or local unit tests when its acceptance requires external WordPress, PR, authoritative target, or pilot evidence.
- The local branch remains behind `origin/main` by 21 commits and ahead by nineteen local commits after this handoff refresh; inspect divergence before synchronization. No implementation PR or push has been made.
- GitHub comments were posted for E2/#77, C2/#82, C3/#81, C4/#80, C5/#79, E3/#89, E4/#88, C6/#92, F1/#72, G1/#75, F2/#76, F3/#87, G2/#86, G3/#85, B5/#105, E5/#106, and the D1/#78 blocker. #72, #75, #76, #77, #79, #80, #81, #82, #85, #86, #87, #88, #105, and #106 are closed; #78, #89, and #92 remain open.
