#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, appendFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createServer } from "node:net";
import {
  WORDPRESS_MEDIA_VERIFICATION_EVAL,
  WORDPRESS_VERIFICATION_EVAL,
  analyzeBlockMarkup,
  assertMediaVerificationPass,
  assertVerificationPass,
  extractMigrationIdsFromWxr,
  extractSourceEvidenceFromWxr,
  verifyImportedMedia,
  verifyImportedPages,
} from "./verification.mjs";
import { buildReconciliationReport } from "./report.mjs";

const harnessDir = dirname(fileURLToPath(import.meta.url));
const repoDir = resolve(harnessDir, "../..");
const composeFile = join(harnessDir, "docker-compose.yml");
const fixturesDir = join(harnessDir, "fixtures");
const fixtureGeneratorFile = join(harnessDir, "generate-fixtures.mjs");
const fixtureFiles = {
  "known-good": "known-good.wxr.xml",
  "known-bad": "known-bad.wxr.xml",
  "known-malformed": "known-malformed.wxr.xml",
  "known-media": "known-media.wxr.xml",
};
const mediaFixturePngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const mediaFixtureExpectation = {
  expectedAttachmentCount: 1,
  forbiddenSourceUrls: [
    "http://wordpress/blockify-fixture.png",
    "http://wordpress/blockify-fixture.png?fit=crop&width=600",
    "http://wordpress/blockify-fixture.png?fit=crop&width=900",
  ],
};
const importerVersion = process.env.BLOCKIFY_IMPORTER_VERSION || "0.8.3";
const adminPassword = process.env.BLOCKIFY_ADMIN_PASSWORD || "blockify-harness-admin-password";

class HarnessError extends Error {}

function usage() {
  console.log(`Usage: node integration/wordpress-harness/run.mjs [options]

Options:
  --fixture known-good|known-bad|known-malformed|known-media  WXR fixture to import (default: known-media)
  --dry-run                       Validate the harness without Docker
  --help                          Show this help

Environment:
  BLOCKIFY_RUN_ID                 Safe run identifier for repeatable diagnostics
  BLOCKIFY_STATE_DIR              Failure artifact directory (default: OS temp)
  BLOCKIFY_REPORT_DIR             Durable scorecard/evidence directory (default: OS temp)
  BLOCKIFY_WP_THEME_SLUG         Optional WordPress.org theme to install and activate
  BLOCKIFY_WP_PLUGIN_SLUGS       Optional comma-separated WordPress.org plugins to install/activate
  BLOCKIFY_IMPORTER_VERSION      Official wordpress-importer version (default: ${importerVersion})
  BLOCKIFY_WORDPRESS_IMAGE       WordPress image override
  BLOCKIFY_DB_IMAGE              MariaDB image override
  BLOCKIFY_WPCLI_IMAGE            WordPress CLI image override`);
}

function parseArgs(argv) {
  const options = { fixture: "known-media", dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--fixture") {
      options.fixture = argv[index + 1];
      index += 1;
      continue;
    }
    throw new HarnessError(`Unknown argument: ${arg}`);
  }
  if (!Object.hasOwn(fixtureFiles, options.fixture)) {
    throw new HarnessError(
      `Unknown fixture '${options.fixture}'. Choose ${Object.keys(fixtureFiles).join(", ")}.`,
    );
  }
  return options;
}

function safeRunId(value) {
  if (!value) return `run-${Date.now()}-${process.pid}`;
  if (!/^[a-z0-9][a-z0-9-]{0,47}$/.test(value)) {
    throw new HarnessError("BLOCKIFY_RUN_ID must contain only lowercase letters, numbers, and hyphens (48 chars max).");
  }
  return value;
}

function safeSlug(value, label) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) {
    throw new HarnessError(`${label} contains an unsafe WordPress.org slug: ${value}`);
  }
  return value;
}

function slugsFromEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) return [];
  return value.split(",").map((slug) => safeSlug(slug.trim(), name));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function redact(value) {
  let output = String(value ?? "");
  for (const secret of [adminPassword, "blockify-harness-db-password", process.env.WORDPRESS_DB_PASSWORD]) {
    if (secret) output = output.split(secret).join("[REDACTED]");
  }
  return output.replace(/((?:password|secret|token|api[_-]?key)[=:\s]+)([^\s,}]+)/gi, "$1[REDACTED]");
}

function appendLog(logPath, label, result) {
  const stdout = redact(result.stdout);
  const stderr = redact(result.stderr);
  appendFileSync(
    logPath,
    `\n===== ${label} =====\n$ ${redact(result.command)}\n${stdout}${stderr ? `\n[stderr]\n${stderr}` : ""}\nexit=${result.status ?? "signal"}\n`,
  );
}

function commandResult(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || harnessDir,
    env: options.env || process.env,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    ...result,
    command: [command, ...args].join(" "),
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function verifyGeneratedFixture(fixtureKey) {
  if (fixtureKey !== "known-media") return;
  const result = commandResult(process.execPath, [fixtureGeneratorFile, "--check"], { cwd: repoDir });
  if (result.status !== 0) {
    const detail = redact(result.stderr || result.stdout).trim();
    throw new HarnessError(detail || "Generated WordPress fixture check failed.");
  }
}

function findAvailablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolvePort(port)));
    });
  });
}

async function waitForHttp(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (response.status < 500) return response;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 2_000));
  }
  throw new HarnessError(`WordPress did not become reachable at ${url}: ${lastError}`);
}

function dryRun(fixtureKey) {
  verifyGeneratedFixture(fixtureKey);
  const fixturePath = join(fixturesDir, fixtureFiles[fixtureKey]);
  const mediaAllowlistPath = join(harnessDir, "mu-plugins", "blockify-fixture-media.php");
  const composeText = readFileSync(composeFile, "utf8");
  const fixtureText = readFileSync(fixturePath, "utf8");
  const requiredComposeTokens = [
    "wordpress:",
    "db:",
    "wpcli:",
    "/fixtures:/fixtures",
    "./mu-plugins:/var/www/html/wp-content/mu-plugins:ro",
  ];
  const runnerText = readFileSync(join(harnessDir, "run.mjs"), "utf8");
  const missing = requiredComposeTokens.filter((token) => !composeText.includes(token));
  if (missing.length) throw new HarnessError(`Harness configuration is missing: ${missing.join(", ")}`);
  if (!runnerText.includes('"wordpress-importer"')) {
    throw new HarnessError("Runner does not install the official WordPress importer.");
  }
  if (!fixtureText.includes("<wp:wxr_version>1.2</wp:wxr_version>")) {
    throw new HarnessError(`Fixture is not WXR 1.2: ${fixturePath}`);
  }
  if (fixtureKey === "known-good" && !fixtureText.includes("blockify-harness-fixture-page")) {
    throw new HarnessError("Known-good fixture is missing its deterministic page slug.");
  }
  if (fixtureKey === "known-good") {
    const analysis = analyzeBlockMarkup(
      fixtureText.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i)?.[1] || "",
    );
    if (analysis.parserFailures.length || analysis.unexpectedFreeformHtml.length) {
      throw new HarnessError("Known-good fixture contains malformed block markup or unexpected freeform HTML.");
    }
  }
  if (fixtureKey === "known-malformed") {
    const analysis = analyzeBlockMarkup(
      fixtureText.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i)?.[1] || "",
    );
    if (!analysis.parserFailures.length) {
      throw new HarnessError("Known-malformed fixture does not contain a detectable parser failure.");
    }
  }
  if (fixtureKey === "known-media") {
    if (extractMigrationIdsFromWxr(fixtureText).length !== 2) {
      throw new HarnessError("Known-media fixture must declare exactly two stable page migration IDs.");
    }
    if ((fixtureText.match(/<wp:post_type>attachment<\/wp:post_type>/g) || []).length !== 1) {
      throw new HarnessError("Known-media fixture must declare exactly one shared attachment item.");
    }
    if (!fixtureText.includes("http://wordpress/blockify-fixture.png")) {
      throw new HarnessError("Known-media fixture is missing its deterministic in-network attachment URL.");
    }
    if (!existsSync(mediaAllowlistPath)) {
      throw new HarnessError("Known-media fixture is missing its Docker-local HTTP allowlist plugin.");
    }
    const mediaAllowlistText = readFileSync(mediaAllowlistPath, "utf8");
    if (
      !mediaAllowlistText.includes("http_request_host_is_external") ||
      !mediaAllowlistText.includes("http://wordpress/blockify-fixture.png") ||
      !mediaAllowlistText.includes("'wordpress' === $host")
    ) {
      throw new HarnessError("Known-media HTTP allowlist is not scoped to the exact disposable fixture URL.");
    }
  }
  if (!extractMigrationIdsFromWxr(fixtureText).length && fixtureKey !== "known-bad") {
    throw new HarnessError(`Fixture is missing ${"_blockify_migration_id"} post metadata: ${fixturePath}`);
  }
  console.log(`DRY RUN PASS: ${fixtureKey} fixture ${sha256(fixturePath).slice(0, 16)}…`);
  console.log("Docker is not required for --dry-run.");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.dryRun) {
    dryRun(options.fixture);
    return;
  }

  verifyGeneratedFixture(options.fixture);

  const dockerCheck = commandResult("docker", ["compose", "version"]);
  if (dockerCheck.status !== 0) {
    throw new HarnessError(
      "Docker Compose v2 is required. Install/start Docker Desktop or Docker Engine, then rerun this command.",
    );
  }

  const runId = safeRunId(process.env.BLOCKIFY_RUN_ID);
  const project = `blockify-wp-${runId}`;
  const stateDir = resolve(process.env.BLOCKIFY_STATE_DIR || join("/tmp", "blockify-wordpress-harness", project));
  const reportDir = resolve(
    process.env.BLOCKIFY_REPORT_DIR || join("/tmp", "blockify-wordpress-harness", "reports", project),
  );
  if (existsSync(stateDir)) {
    throw new HarnessError(
      `Failure state directory already exists: ${stateDir}. Choose another BLOCKIFY_RUN_ID or remove it after inspection.`,
    );
  }
  if (existsSync(reportDir)) {
    throw new HarnessError(
      `Report directory already exists: ${reportDir}. Choose another BLOCKIFY_RUN_ID or remove it after inspection.`,
    );
  }
  const port = Number(process.env.BLOCKIFY_WP_PORT || (await findAvailablePort()));
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new HarnessError("BLOCKIFY_WP_PORT must be an integer between 1024 and 65535.");
  }
  mkdirSync(stateDir, { recursive: true });
  mkdirSync(join(reportDir, "source-html"), { recursive: true });
  const logPath = join(stateDir, "harness.log");
  const statePath = join(stateDir, "state.json");
  const reportPath = join(reportDir, "reconciliation-report.json");
  const sourceManifestPath = join(reportDir, "source-evidence.jsonl");
  const mediaFixturePath = join(stateDir, "blockify-fixture.png");
  writeFileSync(mediaFixturePath, Buffer.from(mediaFixturePngBase64, "base64"));
  const fixturePath = join(fixturesDir, fixtureFiles[options.fixture]);
  const fixtureText = readFileSync(fixturePath, "utf8");
  const sourceRecords = extractSourceEvidenceFromWxr(fixtureText);
  const sourceEvidenceManifest = sourceRecords.map((record, index) => {
    const fileName = `source-${String(index + 1).padStart(4, "0")}.html`;
    const relativePath = `source-html/${fileName}`;
    const sourcePath = join(reportDir, relativePath);
    writeFileSync(sourcePath, record.sourceHtml);
    return {
      migrationId: record.migrationId,
      sourcePostId: record.sourcePostId,
      title: record.title,
      slug: record.slug,
      type: record.type,
      status: record.status,
      sourceHtmlOrigin: record.sourceHtmlOrigin,
      postMeta: record.postMeta,
      path: relativePath,
      bytes: Buffer.byteLength(record.sourceHtml, "utf8"),
      sha256: createHash("sha256").update(record.sourceHtml).digest("hex"),
    };
  });
  writeFileSync(
    sourceManifestPath,
    sourceEvidenceManifest.map((record) => JSON.stringify(record)).join("\n") +
      (sourceEvidenceManifest.length ? "\n" : ""),
  );
  const url = `http://127.0.0.1:${port}`;
  const composeEnv = {
    ...process.env,
    BLOCKIFY_WP_PORT: String(port),
    BLOCKIFY_MEDIA_FIXTURE_PATH: mediaFixturePath,
    COMPOSE_PROJECT_NAME: project,
  };
  const summary = {
    runId,
    project,
    fixture: options.fixture,
    fixtureSha256: sha256(fixturePath),
    importerVersion,
    url,
    stateDir,
    reportDir,
    reportPath,
    sourceManifestPath,
    startedAt: new Date().toISOString(),
    optionalTargetPieces: {
      theme: process.env.BLOCKIFY_WP_THEME_SLUG || null,
      plugins: process.env.BLOCKIFY_WP_PLUGIN_SLUGS || null,
    },
  };
  writeFileSync(statePath, `${JSON.stringify(summary, null, 2)}\n`);

  const compose = (args, label) => {
    const result = commandResult("docker", ["compose", "--project-name", project, "--file", composeFile, ...args], {
      env: composeEnv,
    });
    appendLog(logPath, label, result);
    return result;
  };
  const wp = (args, label) => compose(["run", "--rm", "--no-deps", "wpcli", ...args], label);
  const requireSuccess = (result, label) => {
    if (result.status !== 0) throw new HarnessError(`${label} failed; inspect ${stateDir}/harness.log.`);
    return result;
  };
  const started = { value: false };
  let completed = false;
  let verification = null;
  let mediaVerification = null;
  let importedPages = [];
  let homepageStatus = null;
  let restApiStatus = null;

  const writeReport = (failure = null) => {
    const report = buildReconciliationReport({
      run: {
        runId,
        project,
        fixture: options.fixture,
        fixtureSha256: summary.fixtureSha256,
        importerVersion,
        startedAt: summary.startedAt,
        completedAt: summary.completedAt || null,
      },
      sourceRecords,
      sourceEvidenceManifest,
      verification,
      mediaVerification,
      homepageStatus,
      restApiStatus,
      failure,
    });
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    summary.reconciliationReport = { path: reportPath, pass: report.pass, findingCount: report.findings.length };
    writeFileSync(statePath, `${JSON.stringify(summary, null, 2)}\n`);
    return report;
  };

  const captureFailureState = (reason) => {
    summary.failure = redact(reason instanceof Error ? reason.message : String(reason));
    summary.failedAt = new Date().toISOString();
    writeReport(summary.failure);
    compose(["ps", "--all"], "failure docker compose ps");
    compose(["logs", "--no-color", "--tail=250", "wordpress", "db"], "failure service logs");
    wp(["core", "version"], "failure WordPress core version");
    wp(["plugin", "list", "--format=table"], "failure plugin list");
    wp(["option", "get", "home"], "failure WordPress home option");
    wp(
      ["post", "list", "--post_type=page", "--fields=ID,post_title,post_status,post_name", "--format=table"],
      "failure page state",
    );
    compose(["stop"], "failure stop containers");
  };

  try {
    requireSuccess(compose(["up", "--detach", "db", "wordpress"], "start WordPress fixture"), "Docker Compose startup");
    started.value = true;
    await waitForHttp(`${url}/wp-login.php`);

    const installed = wp(["core", "is-installed"], "check WordPress installation");
    if (installed.status !== 0) {
      requireSuccess(
        wp(
          [
            "core",
            "install",
            `--url=${url}`,
            "--title=Blockify Disposable Harness",
            "--admin_user=blockify-harness",
            `--admin_password=${adminPassword}`,
            "--admin_email=blockify-harness@example.invalid",
            "--skip-email",
          ],
          "install WordPress core",
        ),
        "WordPress core installation",
      );
    }

    requireSuccess(
      wp(
        ["plugin", "install", "wordpress-importer", `--version=${importerVersion}`, "--activate"],
        "install official WordPress importer",
      ),
      "Official importer installation",
    );

    const theme = process.env.BLOCKIFY_WP_THEME_SLUG?.trim();
    if (theme)
      requireSuccess(
        wp(
          ["theme", "install", safeSlug(theme, "BLOCKIFY_WP_THEME_SLUG"), "--activate"],
          "install optional target theme",
        ),
        "Optional target theme installation",
      );
    else console.log("Optional target theme: not configured; skipped.");

    for (const plugin of slugsFromEnv("BLOCKIFY_WP_PLUGIN_SLUGS")) {
      requireSuccess(
        wp(["plugin", "install", plugin, "--activate"], `install optional target plugin ${plugin}`),
        `Optional target plugin ${plugin} installation`,
      );
    }
    if (!process.env.BLOCKIFY_WP_PLUGIN_SLUGS?.trim()) console.log("Optional target plugins: not configured; skipped.");

    requireSuccess(
      wp(["plugin", "is-active", "wordpress-importer"], "verify official importer active"),
      "Official importer activation",
    );
    requireSuccess(
      wp(
        ["import", `/fixtures/${fixtureFiles[options.fixture]}`, "--authors=create"],
        `import ${options.fixture} WXR fixture`,
      ),
      "WXR import",
    );

    const home = await waitForHttp(`${url}/`);
    const api = await waitForHttp(`${url}/wp-json/`);
    homepageStatus = home.status;
    restApiStatus = api.status;
    if (homepageStatus !== 200 || restApiStatus !== 200)
      throw new HarnessError(`Unexpected verification status: homepage=${homepageStatus}, REST API=${restApiStatus}`);
    const pageInspection = requireSuccess(
      wp(["--quiet", "eval", WORDPRESS_VERIFICATION_EVAL], "inspect imported Gutenberg blocks"),
      "WordPress Gutenberg inspection",
    );
    let inspectedPages;
    try {
      inspectedPages = JSON.parse(pageInspection.stdout.trim() || "[]");
    } catch {
      throw new HarnessError("WordPress returned an unreadable Gutenberg verification response.");
    }
    const expectedMigrationIds = extractMigrationIdsFromWxr(fixtureText);
    verification = verifyImportedPages({ pages: inspectedPages, expectedMigrationIds, expectedSourceRecords: sourceRecords });
    importedPages = verification.pages.map((page) => ({
      ID: page.postId,
      post_title: page.title,
      post_status: page.status,
      post_name: page.slug,
      migration_id: page.migrationId,
    }));
    summary.verification = { homepageStatus, restApiStatus, importedPages, ...verification };
    if (options.fixture === "known-media") {
      const mediaInspectionResult = requireSuccess(
        wp(["--quiet", "eval", WORDPRESS_MEDIA_VERIFICATION_EVAL], "inspect imported media reconciliation"),
        "WordPress media inspection",
      );
      let mediaInspection;
      try {
        mediaInspection = JSON.parse(mediaInspectionResult.stdout.trim() || "{}");
      } catch {
        throw new HarnessError("WordPress returned an unreadable media verification response.");
      }
      mediaVerification = verifyImportedMedia({
        inspection: mediaInspection,
        expectedMigrationIds,
        ...mediaFixtureExpectation,
      });
      summary.mediaVerification = mediaVerification;
    }
    writeFileSync(statePath, `${JSON.stringify(summary, null, 2)}\n`);
    const report = writeReport();
    assertVerificationPass(verification);
    if (mediaVerification) assertMediaVerificationPass(mediaVerification);
    if (!report.pass) throw new HarnessError(`Reconciliation report contains ${report.findings.length} finding(s).`);
    summary.completedAt = new Date().toISOString();
    writeFileSync(statePath, `${JSON.stringify(summary, null, 2)}\n`);
    writeReport();
    completed = true;
    console.log(`PASS: imported ${options.fixture} WXR into disposable WordPress at ${url}.`);
    console.log(
      `Verified homepage=${home.status}, REST API=${api.status}, pages=${verification.actualMigrationIds.length}, Gutenberg blocks=${verification.pages.reduce((count, page) => count + page.blocks.length, 0)}.`,
    );
    if (mediaVerification) {
      console.log(
        `Verified attachments=${mediaVerification.attachmentCount}, reconciled media pages=${mediaVerification.pages.length}, destination URLs=${mediaVerification.destinationUrls.length}.`,
      );
    }
    console.log(`Reconciliation report: ${reportPath}`);
  } catch (error) {
    if (started.value) captureFailureState(error);
    throw error;
  } finally {
    if (completed && started.value) {
      const teardown = compose(["down", "--volumes", "--remove-orphans"], "clean teardown");
      if (teardown.status !== 0) {
        console.error(`WARNING: teardown failed; inspect ${stateDir}/harness.log.`);
        process.exitCode = 1;
      } else {
        rmSync(stateDir, { recursive: true, force: true });
      }
    }
  }
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  if (
    error instanceof HarnessError &&
    (error.message.includes("Failure state directory") || error.message.includes("Report directory"))
  ) {
    console.error("No containers were started; no failure artifacts were changed.");
  }
  process.exitCode = 1;
});
