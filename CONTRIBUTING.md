# Contributing

Use Node 22 (`>=22 <23`) and npm.

```bash
npm ci
npm run verify
npm run check:bundle
```

The CI checks are intentionally split into `Validate` and `WordPress integration`. The latter provisions only the checked-in disposable fixtures and does not contact a source website. To reproduce them locally, install Docker Compose v2 and run:

```bash
npm run test:wordpress -- --dry-run
npm run test:checkpoint
npm run test:wordpress
```

When the WordPress harness fails, inspect the sanitized state under `/tmp/blockify-wordpress-harness/`; its logs, Compose state, importer output, media manifest, and reconciliation report are retained for the failed run. The harness removes its containers and volumes after a successful run.

For agent work, choose the next dependency-ready issue from [`handoff/implementation-handoff.md`](handoff/implementation-handoff.md), keep the issue's file scope disjoint from parallel work, and report changed files, verification commands, external validation, risks, and remaining decisions. Do not close an issue on intent or local tests when its acceptance calls for live WordPress, a real PR check, protected-main settings, authoritative target data, or pilot evidence.

Keep acquisition evidence immutable, keep semantic IR source-agnostic, and add focused fixtures for every new migration behavior. Do not close issues whose acceptance requires live WordPress, authoritative target data, protected-branch checks, or pilot evidence without those checks.

Pull requests should describe changed files, tests, external validation, risks, and remaining decisions. Keep dependency-ordered issue scopes disjoint when using parallel agents.

## Protected `main` policy

`main` is protected with strict, up-to-date status checks. Pull requests must
pass both CI job contexts before merge:

- `Validate` — clean install, formatting, lint, build/tests, bundle budget, and
  high-severity dependency audit;
- `WordPress integration` — harness dry-run, interruption recovery, and a live
  disposable WordPress import with retained failure diagnostics.

The rule applies to administrators, blocks force pushes and branch deletion,
and requires conversation resolution. At configuration time on 2026-08-04,
GitHub reported one direct collaborator: the repository owner. Required review
count is therefore intentionally zero under the single-maintainer exception in
[#56](https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation/issues/56).
Enable at least one approving review before adding a second direct collaborator.

Administrators can inspect the live settings export with:

```bash
gh api repos/irgendjemandkeinkorper/wp-gutenberg-migration-translation/branches/main/protection
```
