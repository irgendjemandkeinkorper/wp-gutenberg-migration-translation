import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

export const RECONCILIATION_SCHEMA_VERSION = "1.2.0";
export const RECONCILIATION_THRESHOLD_SCHEMA_VERSION = "1.0.0";
export const DEFAULT_RECONCILIATION_THRESHOLD_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "reconciliation-thresholds.json",
);
export const DEFAULT_RECONCILIATION_REPORT_SCHEMA_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "schemas",
  "reconciliation-report.schema.json",
);

const reconciliationReportSchema = JSON.parse(readFileSync(DEFAULT_RECONCILIATION_REPORT_SCHEMA_PATH, "utf8"));
const validateReconciliationReportSchema = new Ajv2020({
  allErrors: true,
  allowUnionTypes: true,
  strict: true,
}).compile(reconciliationReportSchema);

const REQUIRED_REPORT_THRESHOLDS = new Set([
  "meaningfulTextRecall",
  "sourceImageAccountability",
  "supportedImageLocalRate",
  "silentLossDefects",
  "placeholderReconciliation",
  "parserValidPageRate",
  "unapprovedSourceHostMediaReferences",
  "brokenInternalLinkRate",
  "autoPassingPageRate",
]);
const OPERATORS = new Set(["eq", "gte", "lte", "lt", "gt"]);
const SAFE_FINDING_DETAILS = new Set([
  "actual",
  "diagnosticKind",
  "metadataKey",
  "metric",
  "name",
  "operator",
  "path",
  "postId",
  "threshold",
]);

export class ReportConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReportConfigurationError";
  }
}

export class ReportSchemaError extends Error {
  constructor(errors) {
    const diagnostics = errors
      .map((item) => `${item.instancePath || "/"} ${item.message || "does not satisfy the report schema"}`)
      .join("; ");
    super(`Reconciliation report does not satisfy schema ${RECONCILIATION_SCHEMA_VERSION}: ${diagnostics}`);
    this.name = "ReportSchemaError";
    this.errors = errors;
  }
}

export function assertReconciliationReportSchema(report) {
  if (!validateReconciliationReportSchema(report)) {
    throw new ReportSchemaError(validateReconciliationReportSchema.errors || []);
  }
  return report;
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalValue(item)]),
    );
  return value;
}

function stableJson(value) {
  return JSON.stringify(canonicalValue(value));
}

function stableHash(value) {
  return createHash("sha256")
    .update(String(value ?? ""))
    .digest("hex");
}

function validateThresholdConfiguration(config) {
  const errors = [];
  if (!config || typeof config !== "object" || Array.isArray(config)) errors.push("Configuration must be an object.");
  if (config?.schemaVersion !== RECONCILIATION_THRESHOLD_SCHEMA_VERSION)
    errors.push(`schemaVersion must be ${RECONCILIATION_THRESHOLD_SCHEMA_VERSION}.`);
  if (typeof config?.profile !== "string" || !config.profile.trim()) errors.push("profile must be a non-empty string.");
  if (!config?.thresholds || typeof config.thresholds !== "object" || Array.isArray(config.thresholds))
    errors.push("thresholds must be an object.");

  const thresholds = config?.thresholds && typeof config.thresholds === "object" ? config.thresholds : {};
  for (const metric of REQUIRED_REPORT_THRESHOLDS)
    if (!Object.hasOwn(thresholds, metric)) errors.push(`Missing required report threshold ${metric}.`);
  for (const [metric, threshold] of Object.entries(thresholds)) {
    if (!threshold || typeof threshold !== "object" || Array.isArray(threshold)) {
      errors.push(`${metric} must be an object.`);
      continue;
    }
    if (typeof threshold.label !== "string" || !threshold.label.trim()) errors.push(`${metric}.label is required.`);
    if (!OPERATORS.has(threshold.operator)) errors.push(`${metric}.operator is unsupported.`);
    if (!Number.isFinite(threshold.value)) errors.push(`${metric}.value must be finite.`);
    if (!new Set(["report", "external"]).has(threshold.scope)) errors.push(`${metric}.scope is unsupported.`);
    if (threshold.scope === "report" && !new Set(["always", "media"]).has(threshold.appliesWhen))
      errors.push(`${metric}.appliesWhen is unsupported.`);
    if (typeof threshold.blocking !== "boolean") errors.push(`${metric}.blocking must be boolean.`);
  }
  if (errors.length) throw new ReportConfigurationError(errors.join(" "));
  return config;
}

export function loadThresholdConfiguration(configPath = DEFAULT_RECONCILIATION_THRESHOLD_PATH) {
  const source = basename(configPath);
  let raw;
  try {
    raw = readFileSync(configPath, "utf8");
  } catch (error) {
    throw new ReportConfigurationError(
      `Cannot read ${source}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  let config;
  try {
    config = JSON.parse(raw);
  } catch (error) {
    throw new ReportConfigurationError(
      `Cannot parse ${source}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  validateThresholdConfiguration(config);
  return { source, sha256: stableHash(raw), config };
}

function thresholdEnvelope(value) {
  if (!value) {
    try {
      return loadThresholdConfiguration();
    } catch (error) {
      return {
        source: basename(DEFAULT_RECONCILIATION_THRESHOLD_PATH),
        sha256: null,
        config: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  const envelope = Object.hasOwn(value, "config") ? { ...value } : { source: "inline", config: value };
  if (!envelope.config) return envelope;
  try {
    validateThresholdConfiguration(envelope.config);
    return {
      source: envelope.source || "inline",
      sha256: envelope.sha256 || stableHash(stableJson(envelope.config)),
      config: envelope.config,
    };
  } catch (error) {
    return {
      source: envelope.source || "inline",
      sha256: envelope.sha256 || null,
      config: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function findingDraft(input, fallbackKind, fallbackMessage, severity = "blocking") {
  const item = input && typeof input === "object" ? input : {};
  const kind = String(item.kind || fallbackKind || "diagnostic");
  const migrationId = typeof item.migrationId === "string" && item.migrationId ? item.migrationId : null;
  const message = String(item.message || fallbackMessage || "Diagnostic recorded.");
  const details = Object.fromEntries(
    Object.entries(item).filter(
      ([key, value]) =>
        SAFE_FINDING_DETAILS.has(key) &&
        (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean"),
    ),
  );
  const identity = Object.fromEntries(
    Object.entries(item).filter(([key]) => !new Set(["message", "sourceHtml", "content", "textSequence"]).has(key)),
  );
  const resolvedSeverity = item.severity === "warning" ? "warning" : severity;
  return {
    kind,
    migrationId,
    message,
    severity: resolvedSeverity,
    blocking: typeof item.blocking === "boolean" ? item.blocking : resolvedSeverity === "blocking",
    details,
    identityHash: stableHash(stableJson({ kind, migrationId, identity, messageSha256: stableHash(message) })),
  };
}

function findingCode(kind) {
  return `M1-${String(kind)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()}`;
}

function finalizeFindings(drafts) {
  const occurrences = new Map();
  return drafts.map((draft) => {
    const slug =
      draft.kind
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "diagnostic";
    const baseId = `m1.${slug}.${draft.identityHash.slice(0, 12)}`;
    const occurrence = (occurrences.get(baseId) || 0) + 1;
    occurrences.set(baseId, occurrence);
    return {
      id: occurrence === 1 ? baseId : `${baseId}.${occurrence}`,
      code: findingCode(draft.kind),
      kind: draft.kind,
      severity: draft.severity,
      blocking: draft.blocking,
      migrationId: draft.migrationId,
      message: draft.message,
      ...(Object.keys(draft.details).length ? { details: draft.details } : {}),
    };
  });
}

function countByKind(findings) {
  return findings.reduce((counts, item) => {
    counts[item.kind] = (counts[item.kind] || 0) + 1;
    return counts;
  }, {});
}

function ratio(numerator, denominator, emptyValue = 1) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator === 0) return emptyValue;
  return Number((numerator / denominator).toFixed(6));
}

function compareThreshold(value, operator, threshold) {
  if (operator === "eq") return value === threshold;
  if (operator === "gte") return value >= threshold;
  if (operator === "lte") return value <= threshold;
  if (operator === "lt") return value < threshold;
  if (operator === "gt") return value > threshold;
  return false;
}

function calculateTotals({ sourceRecords, verification, mediaVerification, expectedIds, actualIds, baseFindings }) {
  const pages = Array.isArray(verification?.pages) ? verification.pages : [];
  const parserValidPages = pages.filter((page) =>
    [page.parserFailures, page.invalidBlocks, page.recoveredBlocks, page.unexpectedFreeformHtml].every(
      (items) => !Array.isArray(items) || items.length === 0,
    ),
  ).length;
  const siteBlocking = baseFindings.some((finding) => finding.blocking && !finding.migrationId);
  const pageBlocking = new Set(
    baseFindings.filter((finding) => finding.blocking && finding.migrationId).map((finding) => finding.migrationId),
  );
  const autoPassingPages = siteBlocking
    ? 0
    : expectedIds.filter((migrationId) => actualIds.includes(migrationId) && !pageBlocking.has(migrationId)).length;
  const text = verification?.textReconciliation ?? null;
  const placeholders = verification?.placeholderReconciliation ?? null;
  const links = verification?.linkReconciliation ?? null;
  const expectedAttachments = Number.isInteger(mediaVerification?.expectedAttachmentCount)
    ? mediaVerification.expectedAttachmentCount
    : null;
  const importedAttachments = Number.isInteger(mediaVerification?.attachmentCount)
    ? mediaVerification.attachmentCount
    : null;
  const expectedMediaPages = Array.isArray(mediaVerification?.expectedMigrationIds)
    ? mediaVerification.expectedMigrationIds.length
    : null;
  const reconciledMediaPages = Array.isArray(mediaVerification?.pages)
    ? mediaVerification.pages.filter((page) => Array.isArray(page.mediaUrls) && page.mediaUrls.length > 0).length
    : null;
  const unapprovedMediaReferences = baseFindings.filter(
    (finding) => finding.kind === "source-media-alias-remains",
  ).length;

  return {
    page: {
      expected: expectedIds.length,
      imported: actualIds.length,
      missing: expectedIds.filter((id) => !actualIds.includes(id)).length,
      unexpected: actualIds.filter((id) => !expectedIds.includes(id)).length,
      autoPassing: autoPassingPages,
      autoPassingRate: ratio(autoPassingPages, expectedIds.length),
    },
    block: {
      expected: sourceRecords.reduce((count, record) => count + (Number(record.blockCount) || 0), 0),
      imported: pages.reduce((count, page) => count + (Array.isArray(page.blocks) ? page.blocks.length : 0), 0),
      parserValidPages,
      parserValidPageRate: ratio(parserValidPages, expectedIds.length),
      parserFailures: pages.reduce(
        (count, page) => count + (Array.isArray(page.parserFailures) ? page.parserFailures.length : 0),
        0,
      ),
      invalid: pages.reduce(
        (count, page) => count + (Array.isArray(page.invalidBlocks) ? page.invalidBlocks.length : 0),
        0,
      ),
      recovered: pages.reduce(
        (count, page) => count + (Array.isArray(page.recoveredBlocks) ? page.recoveredBlocks.length : 0),
        0,
      ),
    },
    text: {
      expectedTokens: text?.expectedTokenCount ?? null,
      actualTokens: text?.actualTokenCount ?? null,
      matchedTokens: text?.matchedTokenCount ?? null,
      recall: text?.recall ?? null,
      orderPreserved: text?.allOrderPreserved ?? null,
    },
    media: {
      expectedAttachments,
      importedAttachments,
      expectedPages: expectedMediaPages,
      reconciledPages: reconciledMediaPages,
      sourceImageAccountability: ratio(reconciledMediaPages, expectedMediaPages),
      supportedImageLocalRate: ratio(importedAttachments, expectedAttachments),
      unapprovedSourceHostReferences: unapprovedMediaReferences,
    },
    placeholder: {
      expected: placeholders?.expectedPlaceholderCount ?? null,
      actual: placeholders?.actualPlaceholderCount ?? null,
      exactPages: placeholders?.exactPageCount ?? null,
      reconciliationRate: ratio(placeholders?.exactPageCount, placeholders?.expectedPageCount),
    },
    link: {
      expected: links?.expectedLinkCount ?? null,
      actual: links?.actualLinkCount ?? null,
      expectedInternal: links?.expectedInternalLinkCount ?? null,
      actualInternal: links?.actualInternalLinkCount ?? null,
      brokenInternal: links?.brokenInternalLinkCount ?? null,
      brokenInternalRate: ratio(links?.brokenInternalLinkCount, links?.actualInternalLinkCount, 0),
      exactPages: links?.exactPageCount ?? null,
    },
    failure: null,
  };
}

function evaluateThresholds({ envelope, totals, mediaVerification }) {
  if (!envelope.config) return { evaluations: [], findings: [] };
  const metrics = {
    meaningfulTextRecall: totals.text.recall,
    sourceImageAccountability: totals.media.sourceImageAccountability,
    supportedImageLocalRate: totals.media.supportedImageLocalRate,
    silentLossDefects: totals.failure?.baseBlocking ?? null,
    placeholderReconciliation: totals.placeholder.reconciliationRate,
    parserValidPageRate: totals.block.parserValidPageRate,
    unapprovedSourceHostMediaReferences: totals.media.unapprovedSourceHostReferences,
    brokenInternalLinkRate: totals.link.brokenInternalRate,
    autoPassingPageRate: totals.page.autoPassingRate,
  };
  const evaluations = [];
  const findings = [];
  for (const [metric, threshold] of Object.entries(envelope.config.thresholds)) {
    if (threshold.scope === "external") {
      evaluations.push({
        metric,
        label: threshold.label,
        value: null,
        operator: threshold.operator,
        threshold: threshold.value,
        unit: threshold.unit,
        blocking: threshold.blocking,
        status: "external",
        pass: null,
        ownerIssue: threshold.ownerIssue ?? null,
      });
      continue;
    }
    if (threshold.appliesWhen === "media" && mediaVerification === null) {
      evaluations.push({
        metric,
        label: threshold.label,
        value: null,
        operator: threshold.operator,
        threshold: threshold.value,
        unit: threshold.unit,
        blocking: threshold.blocking,
        status: "not-applicable",
        pass: null,
        ownerIssue: null,
      });
      continue;
    }
    const value = metrics[metric];
    const hasValue = Number.isFinite(value);
    const pass = hasValue ? compareThreshold(value, threshold.operator, threshold.value) : false;
    const status = hasValue ? (pass ? "pass" : "fail") : "missing";
    evaluations.push({
      metric,
      label: threshold.label,
      value: hasValue ? value : null,
      operator: threshold.operator,
      threshold: threshold.value,
      unit: threshold.unit,
      blocking: threshold.blocking,
      status,
      pass,
      ownerIssue: null,
    });
    if (!pass && threshold.blocking)
      findings.push(
        findingDraft(
          {
            kind: hasValue ? "blocking-threshold-failed" : "blocking-threshold-evidence-missing",
            metric,
            actual: hasValue ? value : null,
            operator: threshold.operator,
            threshold: threshold.value,
            message: hasValue
              ? `${threshold.label} is ${value}; required ${threshold.operator} ${threshold.value}.`
              : `${threshold.label} has no report evidence; required ${threshold.operator} ${threshold.value}.`,
          },
          "blocking-threshold-failed",
          "A blocking threshold failed.",
        ),
      );
  }
  return { evaluations, findings };
}

/**
 * Build the durable M1 scorecard. This deliberately contains structural
 * destination evidence and hashes, never imported post content or secrets.
 */
export function buildReconciliationReport({
  run,
  sourceRecords = [],
  sourceEvidenceManifest = [],
  verification = null,
  mediaVerification = null,
  homepageStatus = null,
  restApiStatus = null,
  failure = null,
  thresholdConfiguration = null,
}) {
  const envelope = thresholdEnvelope(thresholdConfiguration);
  const verificationFailures = Array.isArray(verification?.failures)
    ? verification.failures.map((item) => findingDraft(item, "verification-failure", "Verification failed."))
    : [];
  const mediaFailures = Array.isArray(mediaVerification?.failures)
    ? mediaVerification.failures.map((item) =>
        findingDraft(item, "media-verification-failure", "Media verification failed."),
      )
    : [];
  const harnessFailures = failure
    ? [findingDraft({ kind: "harness-failure", message: failure }, "harness-failure", String(failure))]
    : [];
  const configurationFailures = envelope.error
    ? [
        findingDraft(
          {
            kind: "invalid-threshold-configuration",
            message: `Threshold configuration ${envelope.source || "(unknown)"} is invalid: ${envelope.error}`,
          },
          "invalid-threshold-configuration",
          "Threshold configuration is invalid.",
        ),
      ]
    : [];
  const baseFindings = [...verificationFailures, ...mediaFailures, ...harnessFailures, ...configurationFailures];
  const expectedIds = sourceRecords
    .map((record) => record.migrationId)
    .filter(Boolean)
    .sort();
  const actualIds = Array.isArray(verification?.actualMigrationIds) ? [...verification.actualMigrationIds].sort() : [];
  const pages = Array.isArray(verification?.pages) ? verification.pages : [];
  const sourceManifest = sourceEvidenceManifest.map((record) => {
    const metadata = { ...record };
    delete metadata.sourceHtml;
    return metadata;
  });
  const sourceHtmlHashes = sourceRecords.map((record) => stableHash(record.sourceHtml));
  const totals = calculateTotals({
    sourceRecords,
    verification,
    mediaVerification,
    expectedIds,
    actualIds,
    baseFindings,
  });
  totals.failure = {
    base: baseFindings.length,
    baseBlocking: baseFindings.filter((item) => item.blocking).length,
    total: null,
    blocking: null,
    warning: null,
    byKind: null,
  };
  const gate = evaluateThresholds({ envelope, totals, mediaVerification });
  const findings = finalizeFindings([...baseFindings, ...gate.findings]);
  totals.failure = {
    base: baseFindings.length,
    baseBlocking: baseFindings.filter((item) => item.blocking).length,
    total: findings.length,
    blocking: findings.filter((item) => item.blocking).length,
    warning: findings.filter((item) => !item.blocking).length,
    byKind: countByKind(findings),
  };

  return assertReconciliationReportSchema({
    schemaVersion: RECONCILIATION_SCHEMA_VERSION,
    schema: "integration/wordpress-harness/schemas/reconciliation-report.schema.json",
    pass:
      findings.every((item) => !item.blocking) &&
      verification?.pass === true &&
      (mediaVerification === null || mediaVerification.pass === true),
    gate: {
      configuration: envelope.config
        ? {
            schemaVersion: envelope.config.schemaVersion,
            profile: envelope.config.profile,
            source: envelope.source,
            sha256: envelope.sha256,
            prdSource: envelope.config.source,
          }
        : { schemaVersion: null, profile: null, source: envelope.source || null, sha256: envelope.sha256 || null },
      evaluations: gate.evaluations,
    },
    run: { ...run },
    source: {
      pageCount: sourceRecords.length,
      migrationIds: expectedIds,
      htmlAudit: {
        recordCount: sourceManifest.length,
        records: sourceManifest,
        aggregateSha256: stableHash(sourceHtmlHashes.join("\n")),
      },
    },
    destination: {
      homepageStatus,
      restApiStatus,
      pageCount: pages.length,
      migrationIds: actualIds,
      textReconciliation: verification?.textReconciliation ?? null,
      placeholderReconciliation: verification?.placeholderReconciliation ?? null,
      linkReconciliation: verification?.linkReconciliation ?? null,
      pages,
      media: mediaVerification,
    },
    totals,
    counts: {
      expectedPages: expectedIds.length,
      importedPages: actualIds.length,
      missingPages: expectedIds.filter((id) => !actualIds.includes(id)).length,
      unexpectedPages: actualIds.filter((id) => !expectedIds.includes(id)).length,
      findings: findings.length,
      findingsByKind: countByKind(findings),
    },
    findings,
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function displayValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return stableJson(value);
  return String(value);
}

export function renderReconciliationReportHtml(report) {
  const totalRows = Object.entries(report?.totals || {}).flatMap(([category, metrics]) =>
    Object.entries(metrics || {}).map(
      ([metric, value]) =>
        `<tr><th scope="row">${escapeHtml(category)}.${escapeHtml(metric)}</th><td>${escapeHtml(displayValue(value))}</td></tr>`,
    ),
  );
  const gateRows = (report?.gate?.evaluations || []).map(
    (item) =>
      `<tr><th scope="row">${escapeHtml(item.label)}</th><td>${escapeHtml(displayValue(item.value))}</td>` +
      `<td>${escapeHtml(item.operator)} ${escapeHtml(item.threshold)}</td><td>${escapeHtml(item.status)}</td></tr>`,
  );
  const findingRows = (report?.findings || []).map(
    (item) =>
      `<tr><td><code>${escapeHtml(item.id)}</code></td><td>${escapeHtml(item.severity)}</td>` +
      `<td>${escapeHtml(item.migrationId || "site")}</td><td>${escapeHtml(item.message)}</td></tr>`,
  );
  const status = report?.pass ? "PASS" : "FAIL";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blockify reconciliation ${escapeHtml(status)}</title>
  <style>
    body { color: #1f2937; font: 16px/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 80rem; padding: 0 1rem; }
    table { border-collapse: collapse; margin: 1rem 0 2rem; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: .5rem; text-align: left; vertical-align: top; }
    thead th { background: #f3f4f6; } code { overflow-wrap: anywhere; }
    .pass { color: #166534; } .fail { color: #991b1b; }
  </style>
</head>
<body>
  <h1>Blockify post-import reconciliation</h1>
  <p class="${report?.pass ? "pass" : "fail"}"><strong>${escapeHtml(status)}</strong> — schema ${escapeHtml(report?.schemaVersion)}</p>
  <p>Run <code>${escapeHtml(report?.run?.runId || "unknown")}</code>; threshold profile <code>${escapeHtml(report?.gate?.configuration?.profile || "unavailable")}</code>.</p>
  <h2>Totals</h2>
  <table><tbody>${totalRows.join("")}</tbody></table>
  <h2>Blocking gate evaluations</h2>
  <table><thead><tr><th>Metric</th><th>Actual</th><th>Required</th><th>Status</th></tr></thead><tbody>${gateRows.join("")}</tbody></table>
  <h2>Findings (${escapeHtml(report?.findings?.length ?? 0)})</h2>
  <table><thead><tr><th>Stable ID</th><th>Severity</th><th>Scope</th><th>Diagnostic</th></tr></thead><tbody>${findingRows.join("")}</tbody></table>
</body>
</html>
`;
}
