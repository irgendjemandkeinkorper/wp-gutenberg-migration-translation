#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const repoDir = resolve(scriptDir, "..");
const catalogDir = join(repoDir, "knowledge", "catalog");
const defaultVault = join(repoDir, "knowledge", "vault");
const capabilityStatuses = new Set([
  "locally-verified",
  "live-parser-verified",
  "live-target-verified",
  "placeholder-required",
  "unsupported",
]);
const confidenceLevels = new Set(["low", "medium", "high"]);
const observationOutcomes = new Set(["pass", "partial", "placeholder", "fail"]);
const observationEvidenceTiers = new Set(["deterministic-test", "disposable-wordpress", "approved-target", "pilot"]);
const catalogNoteNames = new Map([
  ["block-capabilities", "Block Capabilities"],
  ["failure-classes", "Failure Classes"],
  ["translation-observations", "Translation Observations"],
]);

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

function requireString(record, field, catalogName) {
  if (typeof record[field] !== "string" || !record[field].trim()) {
    throw new Error(`${catalogName}/${record.id || "unknown"}: ${field} must be a non-empty string.`);
  }
}

function requireStringArray(record, field, catalogName, allowEmpty = false) {
  if (
    !Array.isArray(record[field]) ||
    (!allowEmpty && record[field].length === 0) ||
    record[field].some((value) => typeof value !== "string" || !value.trim())
  ) {
    throw new Error(`${catalogName}/${record.id || "unknown"}: ${field} must be a string array.`);
  }
}

function validateCatalogs(capabilities, failures, projects, observations) {
  for (const [name, records] of Object.entries({ capabilities, failures, projects, observations })) {
    if (!Array.isArray(records)) throw new Error(`${name} catalog must be an array.`);
    const ids = new Set();
    for (const record of records) {
      requireString(record, "id", name);
      if (ids.has(record.id)) throw new Error(`${name}: duplicate id ${record.id}.`);
      ids.add(record.id);
    }
  }

  for (const record of capabilities) {
    for (const field of ["label", "status", "confidence", "destination", "nextProbe"])
      requireString(record, field, "capabilities");
    if (!capabilityStatuses.has(record.status))
      throw new Error(`capabilities/${record.id}: unsupported status ${record.status}.`);
    if (!confidenceLevels.has(record.confidence))
      throw new Error(`capabilities/${record.id}: unsupported confidence ${record.confidence}.`);
    requireStringArray(record, "lossModes", "capabilities", true);
    requireStringArray(record, "evidence", "capabilities");
  }

  for (const record of failures) {
    for (const field of ["label", "severity", "symptom", "remediation"]) requireString(record, field, "failures");
    requireStringArray(record, "evidence", "failures");
  }

  for (const record of projects) {
    for (const field of ["name", "status", "scope", "repository", "evidencePolicy"])
      requireString(record, field, "projects");
    requireStringArray(record, "openGates", "projects", true);
    requireStringArray(record, "catalogs", "projects");
    for (const catalog of record.catalogs)
      if (!catalogNoteNames.has(catalog)) throw new Error(`projects/${record.id}: unknown catalog ${catalog}.`);
  }

  const capabilityIds = new Set(capabilities.map((record) => record.id));
  const projectIds = new Set(projects.map((record) => record.id));
  for (const record of observations) {
    for (const field of [
      "label",
      "projectId",
      "capabilityId",
      "sourcePattern",
      "destinationProfile",
      "outcome",
      "evidenceTier",
      "confidence",
      "observedAt",
      "nextProbe",
    ])
      requireString(record, field, "observations");
    if (!projectIds.has(record.projectId))
      throw new Error(`observations/${record.id}: unknown projectId ${record.projectId}.`);
    if (!capabilityIds.has(record.capabilityId))
      throw new Error(`observations/${record.id}: unknown capabilityId ${record.capabilityId}.`);
    if (!observationOutcomes.has(record.outcome))
      throw new Error(`observations/${record.id}: unsupported outcome ${record.outcome}.`);
    if (!observationEvidenceTiers.has(record.evidenceTier))
      throw new Error(`observations/${record.id}: unsupported evidence tier ${record.evidenceTier}.`);
    if (!confidenceLevels.has(record.confidence))
      throw new Error(`observations/${record.id}: unsupported confidence ${record.confidence}.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.observedAt))
      throw new Error(`observations/${record.id}: observedAt must use YYYY-MM-DD.`);
    if (
      !record.metrics ||
      typeof record.metrics !== "object" ||
      Array.isArray(record.metrics) ||
      Object.keys(record.metrics).length === 0 ||
      Object.values(record.metrics).some(
        (value) =>
          !["string", "number", "boolean"].includes(typeof value) ||
          (typeof value === "number" && !Number.isFinite(value)),
      )
    )
      throw new Error(`observations/${record.id}: metrics must contain finite primitive values.`);
    requireStringArray(record, "lossModes", "observations", true);
    requireStringArray(record, "evidence", "observations");
    requireStringArray(record, "relatedIssues", "observations", true);
  }
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

function observationNote(record, capability, project) {
  const metrics = Object.entries(record.metrics)
    .map(([key, value]) => `- **${key}:** <code>${String(value)}</code>`)
    .join("\n");
  return [
    "---",
    "id: " + yaml(record.id),
    "project: " + yaml(record.projectId),
    "capability: " + yaml(record.capabilityId),
    "outcome: " + yaml(record.outcome),
    "evidence_tier: " + yaml(record.evidenceTier),
    "confidence: " + yaml(record.confidence),
    "observed_at: " + yaml(record.observedAt),
    "---",
    "",
    "# " + record.label,
    "",
    "- **Project:** [[Projects/" + project.name + "|" + project.name + "]]",
    "- **Capability:** [[Block Capabilities/" +
      record.capabilityId.replaceAll("/", "-") +
      "|" +
      capability.label +
      "]]",
    "- **Outcome:** <code>" + record.outcome + "</code>",
    "- **Evidence tier:** <code>" + record.evidenceTier + "</code>",
    "- **Confidence:** <code>" + record.confidence + "</code>",
    "- **Observed:** <code>" + record.observedAt + "</code>",
    "",
    "## Source pattern",
    "",
    record.sourcePattern,
    "",
    "## Destination profile",
    "",
    record.destinationProfile,
    "",
    "## Metrics",
    "",
    metrics,
    "",
    "## Observed loss modes",
    "",
    record.lossModes.length ? links(record.lossModes) : "- None observed in this fixture.",
    "",
    "## Evidence",
    "",
    links(record.evidence.map((item) => "<code>" + item + "</code>")),
    "",
    "## Related work",
    "",
    record.relatedIssues.length ? links(record.relatedIssues) : "- None recorded.",
    "",
    "## Next probe",
    "",
    record.nextProbe,
    "",
  ].join("\n");
}

function projectNote(record, observations) {
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
    links(record.catalogs.map((item) => "[[" + catalogNoteNames.get(item) + "]]")),
    "",
    "## Translation observations",
    "",
    observations.length
      ? links(
          observations.map(
            (observation) => "[[Translation Observations/" + observation.id + "|" + observation.label + "]]",
          ),
        )
      : "- None recorded.",
    "",
  ].join("\n");
}

function buildFiles() {
  const capabilities = readCatalog("block-capabilities.json");
  const failures = readCatalog("failure-classes.json");
  const projects = readCatalog("projects.json");
  const observations = readCatalog("translation-observations.json");
  validateCatalogs(capabilities, failures, projects, observations);
  const capabilitiesById = new Map(capabilities.map((record) => [record.id, record]));
  const projectsById = new Map(projects.map((record) => [record.id, record]));
  const files = new Map();
  files.set(
    "README.md",
    "# Blockify migration knowledge vault\n\n" +
      "This vault is generated from `knowledge/catalog/`. Edit the canonical JSON records, retain sanitized evidence, then regenerate.\n\n" +
      "- [[Block Capabilities]] — what translates, its evidence tier, known loss modes, and next probe\n" +
      "- [[Failure Classes]] — reusable symptoms and remediation paths\n" +
      "- [[Translation Observations]] — project/version-specific passes, partial translations, placeholders, and failures\n" +
      "- [[Projects/Blockify migration]] — project scope and open release gates\n\n" +
      "## Evidence tiers\n\n" +
      "`locally-verified` → `live-parser-verified` → `live-target-verified`. " +
      "`placeholder-required` and `unsupported` remain explicit until a reviewed solution has evidence.\n\n" +
      "Update an existing capability instead of creating a competing conclusion, preserve prior evidence links, and never store secrets or private source HTML in this vault.\n",
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
  const observationRows = observations
    .map((record) => {
      const capability = capabilitiesById.get(record.capabilityId);
      const project = projectsById.get(record.projectId);
      return (
        "| [[Translation Observations/" +
        record.id +
        "|" +
        record.label +
        "]] | [[Block Capabilities/" +
        record.capabilityId.replaceAll("/", "-") +
        "|" +
        capability.label +
        "]] | <code>" +
        record.outcome +
        "</code> | <code>" +
        record.evidenceTier +
        "</code> | [[Projects/" +
        project.name +
        "|" +
        project.name +
        "]] | <code>" +
        record.observedAt +
        "</code> |"
      );
    })
    .join("\n");
  files.set(
    "Translation Observations.md",
    "# Translation Observations\n\n" +
      "These records preserve project, target version, evidence tier, metrics, and known loss modes so a global block capability is never inferred from one fixture.\n\n" +
      "<!-- prettier-ignore -->\n" +
      "| Observation | Capability | Outcome | Evidence tier | Project | Observed |\n" +
      "| --- | --- | --- | --- | --- | --- |\n" +
      observationRows +
      "\n",
  );
  for (const record of observations)
    files.set(
      "Translation Observations/" + record.id + ".md",
      observationNote(record, capabilitiesById.get(record.capabilityId), projectsById.get(record.projectId)),
    );
  for (const record of projects)
    files.set(
      "Projects/" + record.name + ".md",
      projectNote(
        record,
        observations.filter((observation) => observation.projectId === record.id),
      ),
    );
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
