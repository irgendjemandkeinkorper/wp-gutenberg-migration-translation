# Disposable WordPress import harness

This harness provisions an isolated WordPress and MariaDB pair, installs the
official `wordpress-importer` plugin, imports a checked-in WXR fixture, checks
the homepage/REST API and imported page state, then removes the containers and
volumes on success.

## One command

From the repository root:

```sh
node integration/wordpress-harness/run.mjs
```

The command has no npm dependency. It requires Node.js 20 or newer, Docker
Engine or Docker Desktop, and Docker Compose v2. The first run downloads the
pinned WordPress/MariaDB images, the WordPress CLI image, and the official
WordPress Importer package.

The fixture is local and deterministic; no source website is contacted. A
successful run prints the local URL and removes its temporary Docker project.

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
