export interface ExpectedPageRecord {
  migrationId: string;
  slug: string;
  type: string;
  status: string;
  textSequence: string[];
  placeholderIds: string[];
}

export interface ImportedPageRecord extends ExpectedPageRecord {
  destinationId: string;
}

export interface ReconciliationFinding {
  code:
    | "missing-page"
    | "page-metadata-mismatch"
    | "text-recall-low"
    | "text-order-mismatch"
    | "placeholder-mismatch"
    | "missing-attachment"
    | "attachment-url-mismatch"
    | "attachment-count-mismatch";
  migrationId: string;
  message: string;
}

export interface PageReconciliation {
  migrationId: string;
  matched: boolean;
  textRecall: number;
  orderPreserved: boolean;
  placeholderIds: { expected: string[]; actual: string[] };
  findings: ReconciliationFinding[];
}

export interface AttachmentExpectation {
  assetId: string;
  sourceUrls: string[];
  expectedCount: number;
}

export interface ImportedAttachment {
  assetId: string;
  sourceUrl: string;
  attachmentId: string;
  destinationUrl: string;
}

export function reconcilePages(
  expected: readonly ExpectedPageRecord[],
  imported: readonly ImportedPageRecord[],
): PageReconciliation[] {
  return expected.map((source) => {
    const findings: ReconciliationFinding[] = [];
    const target = imported.find((page) => page.migrationId === source.migrationId);
    if (!target) {
      findings.push({
        code: "missing-page",
        migrationId: source.migrationId,
        message: `No imported page matched ${source.migrationId}.`,
      });
      return {
        migrationId: source.migrationId,
        matched: false,
        textRecall: 0,
        orderPreserved: false,
        placeholderIds: { expected: [...source.placeholderIds], actual: [] },
        findings,
      };
    }
    if (target.slug !== source.slug || target.type !== source.type || target.status !== source.status)
      findings.push({
        code: "page-metadata-mismatch",
        migrationId: source.migrationId,
        message: "Imported slug, type, or status differs from the expected page record.",
      });
    const expectedText = source.textSequence.map(normalizeMeaningfulText).filter(Boolean);
    const actualText = target.textSequence.map(normalizeMeaningfulText).filter(Boolean);
    const matches = expectedText.filter((text) => actualText.includes(text));
    const textRecall = expectedText.length ? matches.length / expectedText.length : 1;
    const orderPreserved = isSubsequence(expectedText, actualText);
    if (textRecall < 1)
      findings.push({
        code: "text-recall-low",
        migrationId: source.migrationId,
        message: `Meaningful text recall is ${textRecall.toFixed(3)}.`,
      });
    if (!orderPreserved)
      findings.push({
        code: "text-order-mismatch",
        migrationId: source.migrationId,
        message: "Expected meaningful text order was not preserved.",
      });
    const expectedPlaceholders = [...source.placeholderIds].sort();
    const actualPlaceholders = [...target.placeholderIds].sort();
    if (JSON.stringify(expectedPlaceholders) !== JSON.stringify(actualPlaceholders))
      findings.push({
        code: "placeholder-mismatch",
        migrationId: source.migrationId,
        message: "Placeholder IDs do not reconcile one-to-one.",
      });
    return {
      migrationId: source.migrationId,
      matched: true,
      textRecall,
      orderPreserved,
      placeholderIds: { expected: expectedPlaceholders, actual: actualPlaceholders },
      findings,
    };
  });
}

export function reconcileAttachments(
  expected: readonly AttachmentExpectation[],
  imported: readonly ImportedAttachment[],
): ReconciliationFinding[] {
  const findings: ReconciliationFinding[] = [];
  for (const source of expected) {
    const assets = imported.filter((asset) => asset.assetId === source.assetId);
    if (!assets.length) {
      findings.push({
        code: "missing-attachment",
        migrationId: source.assetId,
        message: `No imported attachment matched ${source.assetId}.`,
      });
      continue;
    }
    if (assets.length !== source.expectedCount)
      findings.push({
        code: "attachment-count-mismatch",
        migrationId: source.assetId,
        message: `Expected ${source.expectedCount} attachment record(s), found ${assets.length}.`,
      });
    for (const asset of assets)
      if (!source.sourceUrls.includes(asset.sourceUrl))
        findings.push({
          code: "attachment-url-mismatch",
          migrationId: source.assetId,
          message: `Imported source URL ${asset.sourceUrl} was not observed for ${source.assetId}.`,
        });
  }
  return findings;
}

export function normalizeMeaningfulText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\u200B\uFEFF]/g, "");
}

function isSubsequence(expected: readonly string[], actual: readonly string[]): boolean {
  let cursor = 0;
  for (const value of expected) {
    const index = actual.indexOf(value, cursor);
    if (index < 0) return false;
    cursor = index + 1;
  }
  return true;
}
