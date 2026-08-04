#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const repoDir = resolve(scriptDir, "..");
const catalogDir = join(repoDir, "knowledge", "catalog");
const defaultVault = join(repoDir, "knowledge", "vault");

function parseArgs(argv) {
  const options = { vault: defaultVault, write: false, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--write") options.write = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--vault") options.vault = resolve(argv[++index] || "");
    else throw new Error("Unknown argument: " + arg);
  }
  if (options.write === options.check) throw new Error("Choose exactly one of --write or --check.");
  return options;
}

function readCatalog(name) {
  return JSON.parse(readFileSync(join(catalogDir, name), "utf8"));
}

function yaml(value) {
  return JSON.stringify(String(value ?? ""));
}

function links(values) {
  return values.map((value) => "- " + value).join("\n");
}

function capabilityNote(record) {
  return [
    "---",
    "id: " + yaml(record.id),
    "status: " + yaml(record.status),
    "confidence: " + yaml(record.confidence),
    "---",
    "",
    "# " + record.label,
    "",
    "- **Source/IR ID:** <code>" + record.id + "</code>",
    "- **Destination:** " + record.destination,
    "- **Status:** <code>" + record.status + "</code>",
    "- **Confidence:** <code>" + record.confidence + "</code>",
    "",
    "## Known loss modes",
    "",
    record.lossModes.length ? links(record.lossModes) : "- None recorded.",
    "",
    "## Evidence",
    "",
    links(record.evidence.map((item) => "<code>" + item + "</code>")),
    "",
    "## Next probe",
    "",
    record.nextProbe,
    "",
  ].join("\n");
}

function failureNote(record) {
  return [
    "---",
    "id: " + yaml(record.id),
    "severity: " + yaml(record.severity),
    "---",
    "",
    "# " + record.label,
    "",
    "- **Failure ID:** <code>" + record.id + "</code>",
    "- **Severity:** <code>" + record.severity + "</code>",
    "",
    "## Symptom",
    "",
    record.symptom,
    "",
    "## Remediation",
    "",
    record.remediation,
    "",
    "## Evidence",
    "",
    links(record.evidence.map((item) => "<code>" + item + "</code>")),
    "",
  ].join("\n");
}

function projectNote(record) {
  return [
    "---",
    "id: " + yaml(record.id),
    "status: " + yaml(record.status),
    "repository: " + yaml(record.repository),
    "---",
    "",
    "# " + record.name,
    "",
    "**Status:** <code>" + record.status + "</code>",
    "**Scope:** " + record.scope,
    "",
    "## Evidence policy",
    "",
    record.evidencePolicy,
    "",
    "## Open gates",
    "",
    links(record.openGates),
    "",
    "## Catalogs",
    "",
    links(record.catalogs.map((item) => "[[" + item + "]]")),
    "",
  ].join("\n");
}

function buildFiles() {
  const capabilities = readCatalog("block-capabilities.json");
  const failures = readCatalog("failure-classes.json");
  const projects = readCatalog("projects.json");
  const files = new Map();
  files.set(
    "README.md",
    "# Blockify migration knowledge vault\n\nThis vault is generated from knowledge/catalog/. Edit the canonical JSON records, then regenerate.\n\n- [[Block Capabilities]]\n- [[Failure Classes]]\n- [[Projects/Blockify migration]]\n",
  );
  const capabilityRows = capabilities
    .map(
      (record) =>
        "| [[Block Capabilities/" +
        record.id.replaceAll("/", "-") +
        "]] | <code>" +
        record.status +
        "</code> | <code>" +
        record.confidence +
        "</code> | " +
        record.destination +
        " |",
    )
    .join("\n");
  files.set(
    "Block Capabilities.md",
    "# Block Capabilities\n\n| Capability | Status | Confidence | Destination |\n| --- | --- | --- | --- |\n" +
      capabilityRows +
      "\n",
  );
  for (const record of capabilities)
    files.set("Block Capabilities/" + record.id.replaceAll("/", "-") + ".md", capabilityNote(record));
  const failureRows = failures
    .map(
      (record) =>
        "| [[Failure Classes/" + record.id + "]] | <code>" + record.severity + "</code> | " + record.label + " |",
    )
    .join("\n");
  files.set(
    "Failure Classes.md",
    "# Failure Classes\n\n| Failure | Severity | Description |\n| --- | --- | --- |\n" + failureRows + "\n",
  );
  for (const record of failures) files.set("Failure Classes/" + record.id + ".md", failureNote(record));
  for (const record of projects) files.set("Projects/" + record.name + ".md", projectNote(record));
  return files;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = buildFiles();
  const mismatches = [];
  for (const [relativePath, content] of files) {
    const target = join(options.vault, relativePath);
    if (options.write) {
      mkdirSync(resolve(target, ".."), { recursive: true });
      writeFileSync(target, content);
    } else if (!existsSync(target) || readFileSync(target, "utf8") !== content) {
      mismatches.push(relativePath);
    }
  }
  if (options.check && mismatches.length)
    throw new Error("Knowledge vault is stale or incomplete: " + mismatches.join(", "));
  console.log((options.write ? "WROTE " : "CHECKED ") + files.size + " knowledge-vault files at " + options.vault);
}

main();
