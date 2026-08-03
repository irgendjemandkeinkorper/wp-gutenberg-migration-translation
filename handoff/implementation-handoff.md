# Blockify Implementation Handoff

Updated: 2026-08-03

Repository: [irgendjemandkeinkorper/wp-gutenberg-migration-translation](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation)

## Current baseline

- Local HEAD: latest commit titled `Implement semantic IR emission and workspace store` (use `git log -1 --oneline` for the exact hash).
- Latest implementation wave: E2 workspace store and C2 semantic IR emitter.
- Branch: `main`, locally ahead of `origin/main` by 5 commits and behind by 21 commits.
- The handoff source files are committed with this implementation wave. A clean worktree after commit is expected.
- Do not pull, rebase, or reset blindly. Inspect the 21-commit divergence and preserve all five local commits before synchronizing.
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

## Current verification evidence

- `npm test -- --reporter=dot` — 19 test files, 114 tests passed.
- `npm run build` — TypeScript and Vite production build passed.
- `git diff --check` — passed.
- `node integration/wordpress-harness/run.mjs --dry-run` — passed.
- Live WordPress/Docker validation remains unavailable because Docker Desktop/WSL integration is not enabled in this environment.

## Verification evidence

All of the following passed after the robots-policy fix:

- `npm test -- --reporter=dot` — 12 test files, 55 tests passed.
- `npm run build` — TypeScript and Vite build passed.
- `node --check scripts/crawl.mjs` — passed.
- `git diff --check` — passed before commit.
- `node integration/wordpress-harness/run.mjs --dry-run` — passed.

The live WordPress harness has not run because Docker Desktop/WSL integration is unavailable in the current environment.

## GitHub issue state

Manifest coverage is 44 IDs total. The current tracked issue state is six closed from implementation evidence and 38 open; some closed IDs are setup/contract issues outside the current wave.

Closed with implementation evidence:

- [#47](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/47) — Node engine pin.
- [#69](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/69) — acquisition/page-snapshot contract.
- [#103](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/103) — immutable source archive.
- [#61](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/61) — pure crawler logic extraction and tests.
- [#73](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/73) — migration workspace contract.
- [#74](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/74) — semantic IR contract.
- [#77](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/77) — filesystem/SQLite/content-addressed workspace store.
- [#82](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/82) — semantic IR emission.

Implemented but intentionally still open:

- [#11](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/11) — harness needs a live Docker/WordPress run.
- [#55](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/55) — needs an actual PR check run and branch protection requiring `CI / Validate`.
- [#78](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/78) — blocked at the human-decision gate pending authoritative target capability data.

The original backlog setup report and complete A1–H5 mapping are in [`github-backlog-setup-report.md`](./github-backlog-setup-report.md). The source requirements remain [`blockify-human-grade-migration-prd.md`](./blockify-human-grade-migration-prd.md) and [`blockify-github-issue-manifest.json`](./blockify-github-issue-manifest.json).

## Recommended next wave

Work in three disjoint scopes:

1. Resolve D1/#78 by supplying an authenticated designated WordPress installation or authoritative GolfNow theme/plugin exports. Do not invent profiles.
2. Complete D2/D6 only after the authoritative profile data exists; preserve the `human-decision` gate.
3. Continue C3–C6 and E3–E5 in disjoint dependency-ordered scopes using the now-implemented IR and workspace contracts.
4. Run the live WordPress harness to close A1/#11, B3/#10, and A2/#71; create a real PR and verify branch protection before closing CI #55.

Do not start C2, E2, or downstream consumers until their contract artifacts are reviewed. Do not start D2/D6 without authoritative GolfNow target data.

## Later dependency order

- M1: finish #11/#55, then A2/A3/A4 and reconcile A5/#13; B3/#10 remains the media-delivery implementation lane and still needs live WordPress evidence.
- M3: C1 before C2–C6; D1 before D2–D6.
- M2: E1 before E2–E5.
- M4: F/G work after the shared IR and workspace contracts stabilize.
- M5: H2 remains parent-only until pilot sites are approved; H4 remains parent-only until evidence-backed failure classes exist.

## Handoff rules

- Read the repository `AGENTS.md` instructions and all three handoff source files before changing scope.
- Preserve existing user changes and the two local commits.
- Keep each agent’s write set disjoint and return changed files, tests, risks, and open questions.
- Do not close an issue based only on intent or local unit tests when its acceptance requires external WordPress, PR, authoritative target, or pilot evidence.
- The local branch remains behind `origin/main` by 21 commits and ahead by five local commits; inspect divergence before synchronization. No implementation PR or push has been made.
- GitHub comments were posted for E2/#77, C2/#82, and the D1/#78 blocker. #77 and #82 are closed; #78 remains open.
