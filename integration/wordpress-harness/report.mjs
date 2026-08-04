import { createHash } from "node:crypto";

export const RECONCILIATION_SCHEMA_VERSION = "1.1.0";

function stableHash(value) {
  return createHash("sha256")
    .update(String(value ?? ""))
    .digest("hex");
}

function finding(kind, message, migrationId = null) {
  return { kind, migrationId, message: String(message || "Diagnostic recorded.") };
}

function countByKind(findings) {
  return findings.reduce((counts, item) => {
    counts[item.kind] = (counts[item.kind] || 0) + 1;
    return counts;
  }, {});
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
}) {
  const verificationFailures = Array.isArray(verification?.failures)
    ? verification.failures.map((item) =>
        finding(item.kind || "verification-failure", item.message, item.migrationId || null),
      )
    : [];
  const mediaFailures = Array.isArray(mediaVerification?.failures)
    ? mediaVerification.failures.map((item) =>
        finding(item.kind || "media-verification-failure", item.message, item.migrationId || null),
      )
    : [];
  const harnessFailures = failure ? [finding("harness-failure", failure)] : [];
  const findings = [...verificationFailures, ...mediaFailures, ...harnessFailures];
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

  return {
    schemaVersion: RECONCILIATION_SCHEMA_VERSION,
    pass:
      findings.length === 0 && verification?.pass === true && (mediaVerification === null || mediaVerification.pass),
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
      pages,
      media: mediaVerification,
    },
    counts: {
      expectedPages: expectedIds.length,
      importedPages: actualIds.length,
      missingPages: expectedIds.filter((id) => !actualIds.includes(id)).length,
      unexpectedPages: actualIds.filter((id) => !expectedIds.includes(id)).length,
      findings: findings.length,
      findingsByKind: countByKind(findings),
    },
    findings,
  };
}
