# Blockify Implementation Handoff

Updated: 2026-08-04

Repository: [irgendjemandkeinkorper/wp-gutenberg-migration-translation](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation)

## Current baseline

- Protected `main` at the start of the current scorecard work: `8ef1ea5f81bc3b3691e60183bf1b13f66e993578` after the final handoff refresh [PR #124](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/pull/124). Durable knowledge-vault PR #123 merged as `5f4375c745ec6f8cb8ec7b381e2f4250b96cf687`; A3 verification PR #122 merged as `78a44d9317bb835f00930c6812703ba02bde5e98`.
- Issue #104 closed automatically through PR #122 after live text/order/placeholder acceptance passed. Issues #11 and #71 were also reconciled and closed after PR #111 landed.
- PRs #123 and #124 are merged into protected `main`; the durable knowledge/Obsidian implementation and the prior handoff no longer depend on an unmerged work branch.
- Active branch `codex/issue-13-scorecard-contract` implements the remaining A5/#13 report contract early: schema `1.2.0`, stable finding IDs, configuration-backed PRD gates, complete link/totals evidence, JSON and escaped static HTML, and runtime draft-2020-12 schema validation. This is dependency-aware prework: merging it must not close #13 while #70 remains open.
- `main` branch protection is live: strict required checks `Validate` and `WordPress integration`, admin enforcement, conversation resolution, and force-push/deletion disabled. The zero-review setting is the documented single-maintainer exception; GitHub reported one direct collaborator.
- The reusable knowledge layer is canonical JSON under `knowledge/catalog/`, validated and projected into 28 Obsidian notes. `translation-observations.json` now separates project/version-specific pass, partial, placeholder, and failure outcomes from global capability claims. External vaults can be generated with `npm run knowledge:generate -- --vault <path>`.
- The latest protected-main GitHub Pages [run 30880301813](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/actions/runs/30880301813) completed successfully for `8ef1ea5`; the HTTPS site returned HTTP 200.

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
- A3/A4 reconciliation: the domain engine remains under `src/lib/qa/reconciliation.ts`; the live harness now measures duplicate-aware meaningful-text recall, exact sequence/order, and placeholder IDs per page/site. A3/#104 is closed with CI evidence. A4's WordPress-side attachment/remap checks pass, but #70 remains open through the B4/#68 acquisition gap.
- G5 gallery/slideshow preservation in `src/lib/ir/emitter.ts`: collection detection and ordered first-class gallery asset children.
- G4 reliability corpus under `integration/reliability/` and `src/test/reliability-fixtures.test.ts`: hosted-builder, static-layout, malformed-nesting, encoding, and repeated-chrome fixtures with explicit asset/exception assertions.
- WXR metadata contract under `docs/wxr-format.md`: canonical `_blockify_*` postmeta and placeholder-manifest schema cross-linked from reconciliation documentation.
- E3 process-level recovery under `integration/workspace/`: a forced SIGKILL during a 100-page run, fresh-process recovery, integrity verification, and unique delivery assertions wired into `npm run verify`.
- Repository quality gates: ESLint flat config and CI lint step, Prettier config/format check, provider-adapter refactor, `useProviderSettings` hook, result-panel error boundary, and their focused tests.
- Vendor disposition under `docs/vendor-disposition.md`: unreferenced `gn-wp-templates/` tree removed from the working tree; its historical bytes remain in Git history pending any authorized history rewrite.
- CI/harness orientation: `Validate` and `WordPress integration` are separate named jobs with timeout and failure-artifact upload; `CONTRIBUTING.md` documents agent workflow and harness reproduction.
- M1 scorecard: `integration/wordpress-harness/report.mjs` now emits schema `1.2.0` with stable findings plus page, block, text/order, media, placeholder, link, and failure totals. `reconciliation-thresholds.json` mirrors the PRD pilot gates, marking later-milestone metrics external instead of inventing M1 evidence. The checked-in draft-2020-12 schema is enforced at runtime with Ajv; the harness writes sanitized JSON and escaped static HTML while retaining raw source HTML only in separate audit files. Successful and failed live runs publish both reports under `/tmp/blockify-wordpress-harness/reports/` (or `BLOCKIFY_REPORT_DIR`) for CI artifact collection.
- Cross-project migration knowledge: `knowledge/catalog/` is the canonical capability/failure/project/translation-observation store; `knowledge/vault/` is an Obsidian-compatible projection; `scripts/generate-knowledge-vault.mjs` supports `npm run knowledge:generate`, `npm run knowledge:check`, and external `--vault` projections. Observation outcomes (`pass`, `partial`, `placeholder`, `fail`) are scoped to project/profile/evidence tier so future migrations can search both successes and loss modes without overpromoting a global capability.
- Gate 0 App decomposition: `src/App.tsx` is reduced to 330 lines of top-level orchestration/composition; settings, source input/batch, result review, and bundle/export live in four focused components under `src/components/`. Panel-local review/export state moved with its panel, and `src/test/app-decomposition.test.tsx` verifies the wiring and actions.
- F5 page QA workbench: `src/lib/qa/workbench.ts` validates versioned safe evidence, computes canonical entity-scoped invalidation previews, requires external grants for recrawl/publish, emits audited commands without implicit execution, and retains prior revisions. `src/components/PageQaWorkbench.tsx` exposes source/IR/placement/mapping/destination/finding/exception evidence with risk filters and rerun controls; it deliberately requires durable workspace records rather than fabricating evidence from the legacy in-memory converter. See `docs/page-qa-workbench.md`.
- C6 live WordPress verification: the server-side probe now scopes inspection to pages carrying `_blockify_migration_id`, excluding WordPress's ambient Sample/Privacy pages while still failing missing fixture identities. A deterministic generated matrix covers four levels of mixed ordered/unordered nesting and escaping edge cases. Live known-good import passed against WordPress 6.8.2, and the known-malformed fixture failed with retained `parser-failure` and `unexpected-freeform-html` evidence.
- B3 live media reconciliation: acquired aliases that resolve to one content hash collapse to the exact attachment source emitted in WXR, while the registry retains all observed aliases and provenance. The `known-media` harness fixture imports two pages and one shared PNG with the official importer, then verifies one attachment ID/URL, both post-content URLs rewritten to the local uploads URL, and no acquired source alias remaining. A harness-only MU plugin permits only the exact Docker-local fixture URL through WordPress's safe HTTP check.
- A1 generated live harness fixture (`b854274`): `npm run fixtures:wordpress` loads the production WXR/media modules and deterministically generates the checked-in two-page fixture. WXR supports fixed generation timestamps and stable `_blockify_migration_id` metadata. The harness verifies stable identity, type/status/slug, source/audit postmeta hashes, placeholder manifest validity/count, parser structure, attachment count, and exact page-to-attachment URL reconciliation. Successful acquisition final URLs are now shared by WXR attachment items and inline media so WordPress cannot retain stale transformation queries after sideloading.

## Current verification evidence

- `npm test -- --reporter=dot` — 50 test files, 245 tests passed, including six scorecard-schema tests and sixteen post-import verifier tests.
- `npm run verify` — two consecutive runs passed production build, all 245 tests, forced-process checkpoint recovery, and the 28-file Obsidian projection drift check. The suite-level 15-second timeout keeps local-server/subprocess/large-DOM integration tests bounded without the flaky five-second unit default.
- `npm run test:ui` — 6 UI/accessibility smoke tests passed.
- `npm run lint` and `npm run format:check` — passed.
- `npm run check:bundle` — largest JavaScript asset remains below the 650,000-byte budget.
- `npm audit --audit-level=high` — 0 vulnerabilities.
- `npm run build` — TypeScript and Vite production build passed.
- `git diff --check` — passed.
- `npm run fixtures:wordpress:check` — passed at SHA-256 `0961ec8b91cb5007e8f33be0d37de64bb5b9796362ca3c1ba7c8b3ae21417696`; the generated fixture now includes one relative internal link between the two migration pages.
- `npm run test:wordpress -- --dry-run` — default generated `known-media` fixture passed without Docker.
- `npm run knowledge:check` — 28 generated Obsidian-vault files match the canonical catalogs, including five project/version-specific translation observations.
- PR #111 CI run [30876742912](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/actions/runs/30876742912) — `Validate` and `WordPress integration` both passed before protected merge `86a5b39`.
- PR #122 CI run [30878520899](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/actions/runs/30878520899) — both required checks passed. Retained artifact `8880415113` contains reconciliation schema `1.1.0`: 2/2 exact pages, 23/23 meaningful tokens, recall/order `1`, 1/1 placeholder IDs, one shared attachment, zero findings, and no retained imported text.
- PR #123 CI run [30879977769](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/actions/runs/30879977769) — `Validate` passed in 44 seconds and `WordPress integration` passed in 58 seconds before protected merge `5f4375c`.
- Local live A5/#13 run `issue13-schema-live-1785849393720` — disposable WordPress import exited zero and emitted schema-valid JSON plus escaped static HTML: 2/2 pages, 8/8 blocks, 23/23 text tokens in order, 1/1 attachment, 1/1 placeholder, 1/1 internal link, zero broken links, all nine report-scoped PRD gates passing, three later-milestone gates explicitly external, zero findings, and no raw markup or secret-pattern values in the report.
- Local live malformed run `issue13-malformed-1785850383692` — exited non-zero as required and emitted schema-valid JSON plus escaped HTML with seven stable blocking findings, including `placeholder-manifest-invalid`, `parser-failure`, `unexpected-freeform-html`, and failed PRD gates. Its exact disposable Compose project, containers, volumes, and state directory were removed after report inspection.
- GitHub Pages [run 30878679537](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/actions/runs/30878679537) passed build/deploy for `78a44d9`; the HTTPS site returned HTTP 200 with title `Blockify — HTML to Gutenberg` and the expected application root.
- Latest local live report: `/tmp/blockify-wordpress-harness/reports/blockify-wp-run-1785818364941-448322/reconciliation-report.json` — generated known-media fixture passed the same text/order/placeholder/media contract before PR #122 was pushed.
- Sanitized A3 evidence is retained at `knowledge/evidence/wordpress/a3-text-placeholder-wordpress-6.8.2.json`; it links the protected merge, workflow run, artifact, fixture hash, metrics, and privacy boundary.
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

Manifest coverage remains 44 IDs total. Since the prior refresh, A1/#11, A2/#71, and A3/#104 closed through protected-main evidence. B4 still maps to already-closed #12, but audit note #68 documents acceptance gaps and must not be treated as complete manifest coverage until Claude/human scope authority resolves them.

Closed with implementation evidence:

- [#10](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/10) — bundle-wide content-identity deduplication, deterministic WXR attachment/source aliasing, relative-URL preflight, and live two-page/one-attachment WordPress remapping.
- [#11](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/11) — generated official-importer fixture, stable page/postmeta evidence, parser-valid blocks, one shared attachment, retained CI artifacts, and actionable failure behavior.
- [#71](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/71) — live registered-block parsing plus retained malformed-fixture parser/freeform failure evidence.
- [#104](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/104) — live stable page identity, duplicate-aware text recall/order, and exact placeholder reconciliation in schema `1.1.0`.
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

Open gates with verified partial evidence:

- [#68](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/68) — `human-decision` B4 audit. #12 covers modern discovery/download basics, but not per-element chosen-candidate evidence, MIME-vs-byte mismatch validation, or first-class unsafe/missing-candidate findings. Do not duplicate #12; obtain scope authority for one narrow follow-up or an explicit contract disposition.
- [#70](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/70) — live imported attachment IDs/URLs/counts and remaining-source-host checks pass, including query-string aliases and two pages sharing one attachment. Keep open because it declares #68/B4 as a dependency.
- [#13](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/13) — the remaining report-contract implementation and local live acceptance now pass on `codex/issue-13-scorecard-contract`. Keep the issue open because its declared dependency #70 is still open; after protected CI passes, record the evidence without claiming dependency completion.
- [#7](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/7) — clean-runner CI, separate checks, retained artifacts, and agent documentation pass. Close last only after every other M1 exit criterion (#68/#70/#13) passes.
- [#78](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/78) — blocked at the human-decision gate pending authoritative target capability data.

External Gate 0 work completed during integration:

- [#55](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/55) — closed after both jobs passed on real PR #111.
- [#56](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/56) — protected-main settings are applied and verified; the exact policy and single-maintainer review exception are recorded in `CONTRIBUTING.md`.

The original backlog setup report and complete A1–H5 mapping are in [`github-backlog-setup-report.md`](./github-backlog-setup-report.md). The source requirements remain [`blockify-human-grade-migration-prd.md`](./blockify-human-grade-migration-prd.md) and [`blockify-github-issue-manifest.json`](./blockify-github-issue-manifest.json).

## Recommended next wave

Work in these disjoint scopes:

1. Claude/human scope authority reviews [#68's B4 audit](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/68#issuecomment-5174760252) and chooses either one narrow acquisition follow-up or an explicit accepted-contract disposition. Do not reopen or duplicate broad #12 work.
2. If implementation is authorized, Codex owns only per-element candidate/selection evidence, MIME-vs-byte validation, and unsafe/missing-candidate findings plus their deterministic fixtures. Re-run A4 live evidence, then reconcile #68 and #70 in dependency order.
3. Land the dependency-aware #13 scorecard-contract prework after both protected checks pass, but leave #13 open. After #70 closes, re-run/confirm the imported-state evidence and reconcile #13 without repeating the already-implemented schema, stable-ID, threshold, link-total, or HTML work unless CI exposes a concrete gap.
4. Close #7 last after the completed #13 artifact is exercised by both required CI checks.
5. Keep #78 at its authoritative human-decision gate and #107 blocked by #100; do not infer target behavior from synthetic fixtures.
6. Add one `translation-observations.json` record for every materially new project/profile/fixture outcome, update global capability/failure records only when warranted, and regenerate the Obsidian projection.

Do not start #90/#94/#96 or downstream target-profile work without authoritative target data from #78. Do not start pilot/release work before its human-decision and corpus gates close.

## Later dependency order

- M1: A1/#11, A2/#71, A3/#104, B3/#10, and CI infrastructure/#55 are complete with live evidence. A5/#13 report-contract prework is implemented but remains dependency-gated. Resolve B4/#68, then A4/#70, formally reconcile A5/#13, and close final gate #7 in that order.
- M3: C1 before C2–C6; D1 before D2–D6.
- M2: E1 before E2–E5.
- M4: F/G work after the shared IR and workspace contracts stabilize.
- M5: H2 remains parent-only until pilot sites are approved; H4 remains parent-only until evidence-backed failure classes exist.

## Handoff rules

- Read the repository `AGENTS.md` instructions and all three handoff source files before changing scope.
- Preserve existing user changes and all local implementation commits.
- Keep each agent’s write set disjoint and return changed files, tests, risks, and open questions.
- Do not close an issue based only on intent or local unit tests when its acceptance requires external WordPress, PR, authoritative target, or pilot evidence.
- The former remote divergence is integrated in merge commit `74a9bf9`; do not re-run the old merge/rebase investigation. Protected merges `86a5b39` (PR #111), `78a44d9` (PR #122), and `5f4375c` (PR #123) are current truth.
- Fresh GitHub evidence/audit comments are on #104, #68, #70, #13, and #7. #11, #71, and #104 are closed. #68, #70, #13, #7, and #78 remain intentionally open for the exact gates documented above; #12 was already closed but does not silently satisfy the unresolved B4 contract. #42 remains open only for the unperformed history-size rewrite.
