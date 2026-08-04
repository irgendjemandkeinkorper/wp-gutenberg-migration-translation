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
