# Disposable WordPress import harness

This harness provisions an isolated WordPress and MariaDB pair, installs the
official `wordpress-importer` plugin, imports a checked-in generated WXR fixture, checks
the homepage/REST API and imported page state, runs the post-import Gutenberg
verifier, then removes the containers and volumes on success.
Every live run also writes schema-versioned `reconciliation-report.json`, an
escaped `reconciliation-report.html` companion, a JSONL source-evidence
manifest, and one raw source HTML audit file per migration record under the
durable report directory. The scorecard contains hashes, complete category
totals, PRD-backed gate evaluations, structural destination evidence, and
stable finding IDs; raw source HTML is kept in adjacent audit files rather than
duplicated into either report. The report builder validates every emitted
object against the checked-in draft-2020-12 schema before writing either view.

## One command

From the repository root after `npm ci`:

```sh
npm run test:wordpress
```

The command requires the checked-in npm dependencies, Node.js 22, Docker Engine
or Docker Desktop, and Docker Compose v2. The first run downloads the
pinned WordPress/MariaDB images, the WordPress CLI image, and the official
WordPress Importer package.

The default fixture is local and deterministic; no source website is contacted.
`known-media.wxr.xml` is generated through the production WXR and media-registry
modules. `npm run fixtures:wordpress:check` fails if it drifts, while
`npm run fixtures:wordpress` deliberately regenerates it. A
successful run enumerates every fixture page by `_blockify_migration_id`,
reports block names and nesting paths, and removes its temporary Docker project.

## Diagnostics and fixtures

Use `--dry-run` to validate the harness and fixture without Docker:

```sh
node integration/wordpress-harness/run.mjs --dry-run
```

The intentionally malformed importer fixture is useful for checking failure
retention:

```sh
node integration/wordpress-harness/run.mjs --fixture known-bad
```

The `known-malformed` fixture is valid WXR with deliberately malformed
Gutenberg delimiters and root-level HTML. It should import successfully and
then fail the Gutenberg gate with a retained JSON verification report:

```sh
node integration/wordpress-harness/run.mjs --fixture known-malformed
```

The default `known-media` fixture imports two pages that share one query-string
image, one resolvable internal link, plus a visible unsupported-content marker
and its postmeta manifest. It
passes only when WordPress creates exactly one attachment, preserves metadata
and parsed blocks, keeps the internal link healthy, and rewrites both pages to
that attachment's local uploads URL:

```sh
node integration/wordpress-harness/run.mjs --fixture known-media
```

WordPress's safe HTTP client normally rejects Docker-private hosts. The
checked-in `mu-plugins/blockify-fixture-media.php` therefore allows only the
exact disposable URL
`http://wordpress/blockify-fixture.png`; it is mounted
only in this harness and does not relax requests in generated or production
WordPress environments.

Set `BLOCKIFY_REPORT_DIR` to choose the durable report location. The default is
`/tmp/blockify-wordpress-harness/reports/<project>`, so successful reports are
available to CI artifact upload even though the disposable Docker project is
removed. `BLOCKIFY_STATE_DIR` continues to control retained operational failure
logs and state. `BLOCKIFY_RECONCILIATION_CONFIG` may point to a reviewed
versioned threshold file; otherwise the checked-in `prd-pilot-v1` profile is
used and its SHA-256 is recorded.

The verifier reports each page's stable migration ID, block names, nesting
paths, parser failures, invalid/unregistered blocks, recovered blocks, link
identity/health counts, and unexpected freeform HTML. Any blocking diagnostic
or configured gate failure fails the run. Its
markup scanner and fixture tests run without Docker; a live run additionally
uses WordPress `parse_blocks()` and the registered block-type registry.
The WordPress probe selects only pages carrying `_blockify_migration_id`, so
the installation's default Sample and Privacy Policy pages cannot be mistaken
for imported fixture pages; a missing fixture record still fails explicitly.
The server-side probe intentionally emits hashes and structural diagnostics,
not post content, so retained artifacts keep the existing redaction behavior.

Failed runs retain sanitized logs, `docker compose ps`, service logs, plugin
state, the WordPress home option, and page state under
`/tmp/blockify-wordpress-harness/<project>/` (or `BLOCKIFY_STATE_DIR`). The
containers are stopped but volumes are retained for inspection. The failure
output gives the project name needed to remove them after inspection:

```sh
docker compose -p <project> -f integration/wordpress-harness/docker-compose.yml down --volumes --remove-orphans
```

The harness never writes API keys or passwords to its state files/logs. Its
database and admin credentials are ephemeral fixture credentials, and command
output is redacted before it is persisted.

## Optional target pieces

The handoff does not identify an authoritative private GolfNow theme or plugin
that can be installed safely by default. When an authoritative WordPress.org
slug is available, provide it explicitly:

```sh
BLOCKIFY_WP_THEME_SLUG=example-theme \
BLOCKIFY_WP_PLUGIN_SLUGS=example-plugin,another-plugin \
node integration/wordpress-harness/run.mjs
```

The harness validates slugs before passing them to WP-CLI. It does not invent
private blocks, themes, plugins, schemas, or credentials.

## Reproducibility controls

WordPress, WordPress CLI, and MariaDB image tags are pinned in
`docker-compose.yml` and can be overridden for an approved environment with
`BLOCKIFY_WORDPRESS_IMAGE`, `BLOCKIFY_WPCLI_IMAGE`, and `BLOCKIFY_DB_IMAGE`.
The importer defaults to official version `0.8.3` and can be overridden with
`BLOCKIFY_IMPORTER_VERSION`. `BLOCKIFY_RUN_ID` can provide a stable diagnostic
project name; it must be unique while a prior failed run is being inspected.
