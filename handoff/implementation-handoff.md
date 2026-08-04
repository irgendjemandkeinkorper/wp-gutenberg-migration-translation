# Blockify Implementation Handoff

Updated: 2026-08-04

Repository: [irgendjemandkeinkorper/wp-gutenberg-migration-translation](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation)

## Current baseline

- Implementation HEAD before this handoff refresh: `80f53ce Harden the reusable migration knowledge vault`.
- Integration merge: `74a9bf9` has parents `7600045` (the preserved local PRD implementation) and `4d11563` (the then-current remote `main`), resolving the former 44-local/51-remote divergence without rebasing or dropping either history.
- Branch: `codex/blockify-prd-integration-20260803`, tracking the same branch on `origin`.
- Pull request: [#111](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/pull/111), open and mergeable. Its first real CI run passed both `Validate` and `WordPress integration`.
- `main` branch protection is live: strict required checks `Validate` and `WordPress integration`, admin enforcement, conversation resolution, and force-push/deletion disabled. The zero-review setting is the documented single-maintainer exception; GitHub reported one direct collaborator.
- The reusable knowledge layer is canonical JSON under `knowledge/catalog/`, validated and projected into 22 Obsidian notes. External vaults can be generated with `npm run knowledge:generate -- --vault <path>`.
- A clean worktree after this handoff/protection documentation commit is expected.

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
- CI/repository hygiene: shared `npm run verify`, bundle budget/audit gates, Dependabot, CONTRIBUTING.md, SECURITY.md, MIT license metadata, and generated-artifact ignore/removal.
- F4 risk scoring under `src/lib/qa/risk.ts`: deterministic severity/confidence/evidence scores and QA queue filters.
- A3/A4 reconciliation under `src/lib/qa/reconciliation.ts`: page identity/text/placeholder evidence and attachment source/count evidence. Live page/block and attachment/remap reports now exist; remaining dependent issue closure must still follow each issue's dependency and text/placeholder acceptance gates.
- G5 gallery/slideshow preservation in `src/lib/ir/emitter.ts`: collection detection and ordered first-class gallery asset children.
- G4 reliability corpus under `integration/reliability/` and `src/test/reliability-fixtures.test.ts`: hosted-builder, static-layout, malformed-nesting, encoding, and repeated-chrome fixtures with explicit asset/exception assertions.
- WXR metadata contract under `docs/wxr-format.md`: canonical `_blockify_*` postmeta and placeholder-manifest schema cross-linked from reconciliation documentation.
- E3 process-level recovery under `integration/workspace/`: a forced SIGKILL during a 100-page run, fresh-process recovery, integrity verification, and unique delivery assertions wired into `npm run verify`.
- Repository quality gates: ESLint flat config and CI lint step, Prettier config/format check, provider-adapter refactor, `useProviderSettings` hook, result-panel error boundary, and their focused tests.
- Vendor disposition under `docs/vendor-disposition.md`: unreferenced `gn-wp-templates/` tree removed from the working tree; its historical bytes remain in Git history pending any authorized history rewrite.
- CI/harness orientation: `Validate` and `WordPress integration` are separate named jobs with timeout and failure-artifact upload; `CONTRIBUTING.md` documents agent workflow and harness reproduction.
- M1 scorecard: `integration/wordpress-harness/report.mjs` builds a hash-and-structure-only reconciliation report, while `verification.mjs` extracts source records and the harness retains one raw source HTML audit file per migration record. Successful and failed live runs publish durable reports under `/tmp/blockify-wordpress-harness/reports/` (or `BLOCKIFY_REPORT_DIR`) for CI artifact collection.
- Cross-project migration knowledge: `knowledge/catalog/` is the canonical capability/failure/project record store; `knowledge/vault/` is an Obsidian-compatible projection; `scripts/generate-knowledge-vault.mjs` supports `npm run knowledge:generate`, `npm run knowledge:check`, and external `--vault` projections. Status values distinguish local contracts from live WordPress support.
- Gate 0 App decomposition: `src/App.tsx` is reduced to 330 lines of top-level orchestration/composition; settings, source input/batch, result review, and bundle/export live in four focused components under `src/components/`. Panel-local review/export state moved with its panel, and `src/test/app-decomposition.test.tsx` verifies the wiring and actions.
- F5 page QA workbench: `src/lib/qa/workbench.ts` validates versioned safe evidence, computes canonical entity-scoped invalidation previews, requires external grants for recrawl/publish, emits audited commands without implicit execution, and retains prior revisions. `src/components/PageQaWorkbench.tsx` exposes source/IR/placement/mapping/destination/finding/exception evidence with risk filters and rerun controls; it deliberately requires durable workspace records rather than fabricating evidence from the legacy in-memory converter. See `docs/page-qa-workbench.md`.
- C6 live WordPress verification: the server-side probe now scopes inspection to pages carrying `_blockify_migration_id`, excluding WordPress's ambient Sample/Privacy pages while still failing missing fixture identities. A deterministic generated matrix covers four levels of mixed ordered/unordered nesting and escaping edge cases. Live known-good import passed against WordPress 6.8.2, and the known-malformed fixture failed with retained `parser-failure` and `unexpected-freeform-html` evidence.
- B3 live media reconciliation: acquired aliases that resolve to one content hash collapse to the exact attachment source emitted in WXR, while the registry retains all observed aliases and provenance. The `known-media` harness fixture imports two pages and one shared PNG with the official importer, then verifies one attachment ID/URL, both post-content URLs rewritten to the local uploads URL, and no acquired source alias remaining. A harness-only MU plugin permits only the exact Docker-local fixture URL through WordPress's safe HTTP check.
- A1 generated live harness fixture (`b854274`): `npm run fixtures:wordpress` loads the production WXR/media modules and deterministically generates the checked-in two-page fixture. WXR supports fixed generation timestamps and stable `_blockify_migration_id` metadata. The harness verifies stable identity, type/status/slug, source/audit postmeta hashes, placeholder manifest validity/count, parser structure, attachment count, and exact page-to-attachment URL reconciliation. Successful acquisition final URLs are now shared by WXR attachment items and inline media so WordPress cannot retain stale transformation queries after sideloading.

## Current verification evidence

- `npm test -- --reporter=dot` — 48 test files, 236 tests passed.
- `npm run verify` — production build, full test suite, and forced-process checkpoint integration passed with fixture-server/subprocess permissions.
- `npm run test:ui` — 6 UI/accessibility smoke tests passed.
- `npm run lint` and `npm run format:check` — passed.
- `npm run check:bundle` — largest JavaScript asset remains below the 650,000-byte budget.
- `npm audit --audit-level=high` — 0 vulnerabilities.
- `npm run build` — TypeScript and Vite production build passed.
- `git diff --check` — passed.
- `npm run fixtures:wordpress:check` — passed at SHA-256 `de03c2e3da37a743818cc000c03ac98a296c84c75bcf3ccbaf4fa58a364e8960`.
- `npm run test:wordpress -- --dry-run` — default generated `known-media` fixture passed without Docker.
- `npm run knowledge:check` — 22 generated Obsidian-vault files match the canonical catalogs.
- PR #111 CI run [30876469818](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/actions/runs/30876469818) — `Validate` and `WordPress integration` both passed on the real pull request; this completed #55's remote-run acceptance.
- Post-merge local live report: `/tmp/blockify-wordpress-harness/reports/blockify-wp-run-1785815738496-390454/reconciliation-report.json` — generated known-media fixture imported and reconciled successfully after the remote-main integration.
- Live known-good WordPress report: `/tmp/blockify-wordpress-harness/reports/blockify-wp-codex-live-92-10-20260804b/reconciliation-report.json` — passed with one stable page and two registered Gutenberg blocks.
- Live known-malformed report: `/tmp/blockify-wordpress-harness/reports/blockify-wp-codex-live-92-malformed-20260804a/reconciliation-report.json` — failed as expected with actionable parser/freeform findings; its disposable containers and volumes were removed after evidence capture.
- Live known-media report: `/tmp/blockify-wordpress-harness/reports/blockify-wp-codex-live-10-media-20260804b/reconciliation-report.json` — passed with two stable pages, one attachment, and one shared destination uploads URL. Sanitized durable evidence is committed at `knowledge/evidence/wordpress/a4-known-media-wordpress-6.8.2.json`.
- Live generated A1/#11 report: `/tmp/blockify-wordpress-harness/reports/blockify-wp-codex-live-11-generated-20260804b/reconciliation-report.json` — passed with two stable pages, eight registered Gutenberg blocks, all source/audit postmeta hashes and placeholder counts preserved, one shared attachment, one exact destination URL, and zero findings. Sanitized durable evidence is committed at `knowledge/evidence/wordpress/a1-generated-harness-wordpress-6.8.2.json`.
- The earlier generated-fixture run `blockify-wp-codex-live-11-generated-20260804a` correctly failed because WordPress retained stale query parameters after sideloading. WXR/page rewriting now share the successful acquisition final URL; the failed run's exact containers and volumes were removed after diagnosis, while its report remains under `/tmp/blockify-wordpress-harness/`.
- The earlier failed media project `blockify-wp-codex-live-10-media-20260804a` was diagnosed as WordPress safe-HTTP rejection of the Docker-private fixture host; its exact containers and volumes were removed after the narrow harness-only fix. Sanitized failure logs/report remain under `/tmp/blockify-wordpress-harness/` for diagnosis.
- Docker Desktop/WSL integration was enabled for these runs. Recheck `docker version` after machine or Desktop restarts rather than assuming the engine remains available.

## Historical c810d94 verification evidence

All of the following passed after the robots-policy fix:

- `npm test -- --reporter=dot` — 12 test files, 55 tests passed.
- `npm run build` — TypeScript and Vite build passed.
- `node --check scripts/crawl.mjs` — passed.
- `git diff --check` — passed before commit.
- `node integration/wordpress-harness/run.mjs --dry-run` — passed.

At historical commit `c810d94`, the live WordPress harness had not run. The current live evidence above supersedes that historical limitation.

## GitHub issue state

Manifest coverage is 44 IDs total. Twenty-five are closed by this implementation, B4/#12 was already closed, and 18 manifest issues remain open. Additional repository and code-quality issues #43–#46, #48–#54, #57–#60, and #62 are now closed outside the 44-item PRD mapping.

Closed with implementation evidence:

- [#10](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/10) — bundle-wide content-identity deduplication, deterministic WXR attachment/source aliasing, relative-URL preflight, and live two-page/one-attachment WordPress remapping.
- [#92](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/92) — deterministic compiler round trips, generated nesting/escaping matrix, live registered-block parsing, and actionable live malformed-fixture failure.
- [#95](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/95) — safe page evidence view, canonical invalidation preview, external recrawl/publish authorization, and immutable rerun/revision audit history.
- [#48](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/48) — App decomposed into four focused panels with explicit state/action props and regression coverage.
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
- [#93](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/93) — migration risk scoring and QA queue.
- [#83](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/83) — gallery/slideshow semantic collections.
- [#84](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/84) — hosted-builder and malformed legacy-static reliability fixtures.
- [#89](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/89) — incremental checkpoints, pause/resume, and forced-process recovery.

Implemented but intentionally still open:

- [#11](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/11) — generated-fixture, successful-import, and actionable-failure acceptance pass; dependency #55 is now closed. Keep #11 open only until PR #111 lands on protected `main`, then reconcile it using [the retained evidence comment](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/11#issuecomment-5174191557).
- [#13](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/13) — durable success/failure scorecards now have live evidence; dependent page/media reconciliation acceptance remains.
- [#70](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/70) — live imported IDs/URLs/counts and remaining-source-host checks now pass, but its #11 dependency remains open.
- [#71](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/71) — live parser and malformed-fixture evidence now exists, but its #11 dependency remains open.
- [#104](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/104) — stable page identity, source/audit postmeta, text/structure, and placeholder-count reconciliation now have live imported-page evidence; its #11 dependency remains open.
- [#78](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/78) — blocked at the human-decision gate pending authoritative target capability data.

External Gate 0 work completed during integration:

- [#55](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/55) — closed after both jobs passed on real PR #111.
- [#56](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/56) — protected-main settings are applied and verified; the exact policy and single-maintainer review exception are recorded in `CONTRIBUTING.md`.

The original backlog setup report and complete A1–H5 mapping are in [`github-backlog-setup-report.md`](./github-backlog-setup-report.md). The source requirements remain [`blockify-human-grade-migration-prd.md`](./blockify-human-grade-migration-prd.md) and [`blockify-github-issue-manifest.json`](./blockify-github-issue-manifest.json).

## Recommended next wave

Work in these disjoint scopes:

1. Review and merge PR #111 through the protected-main checks; do not bypass the required contexts.
2. After the implementation is on `main`, reconcile/close #11 and then #71/#104/#70/#13 in dependency order against their remaining acceptance and human-review gates. The generated live report is evidence, not permission to bypass dependencies.
3. Keep #78 at its authoritative human-decision gate and #107 blocked by #100; do not infer target behavior from synthetic fixtures.
4. Continue recording reusable block successes, loss modes, evidence, and next probes in `knowledge/catalog/`, then regenerate the Obsidian projection.

Do not start #90/#94/#96 or downstream target-profile work without authoritative target data from #78. Do not start pilot/release work before its human-decision and corpus gates close.

## Later dependency order

- M1: B3/#10 and CI/#55 are complete with live evidence. Merge PR #111, then reconcile A1/#11 and A2/A3/A4/A5 (#71/#104/#70/#13) against their remaining gates.
- M3: C1 before C2–C6; D1 before D2–D6.
- M2: E1 before E2–E5.
- M4: F/G work after the shared IR and workspace contracts stabilize.
- M5: H2 remains parent-only until pilot sites are approved; H4 remains parent-only until evidence-backed failure classes exist.

## Handoff rules

- Read the repository `AGENTS.md` instructions and all three handoff source files before changing scope.
- Preserve existing user changes and all local implementation commits.
- Keep each agent’s write set disjoint and return changed files, tests, risks, and open questions.
- Do not close an issue based only on intent or local unit tests when its acceptance requires external WordPress, PR, authoritative target, or pilot evidence.
- The former remote divergence is integrated in merge commit `74a9bf9`; do not re-run the old merge/rebase investigation. PR #111 is the authoritative review surface.
- GitHub comments were posted for the 25 implemented PRD issues, G4/#84, E3/#89, WXR schema/#62, CI/#7/#55, A3/#104, A4/#70, #10/#11/#13/#71, and the repository/code-quality issues #43–#54/#57–#60. #55 is closed; #56 has verified settings and repository documentation. #13, #70, #71, #78, and #104 remain open; #11 awaits merge/reconciliation; #12 was already closed before this work. #42 remains open only for the unperformed history-size rewrite.
