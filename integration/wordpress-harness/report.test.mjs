import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import {
  RECONCILIATION_SCHEMA_VERSION,
  ReportSchemaError,
  assertReconciliationReportSchema,
  buildReconciliationReport,
  loadThresholdConfiguration,
  renderReconciliationReportHtml,
} from "./report.mjs";

const harnessDir = dirname(fileURLToPath(import.meta.url));
const reportSchema = JSON.parse(readFileSync(join(harnessDir, "schemas", "reconciliation-report.schema.json"), "utf8"));
const validateReportSchema = new Ajv2020({ allErrors: true, allowUnionTypes: true, strict: true }).compile(
  reportSchema,
);

function expectSchemaValid(report) {
  expect(validateReportSchema(report), JSON.stringify(validateReportSchema.errors, null, 2)).toBe(true);
}

function passingEvidence() {
  return {
    sourceRecords: [
      {
        migrationId: "page-1",
        sourceHtml: "<main><p>Sanitized fixture pointer only.</p></main>",
        blockCount: 1,
      },
    ],
    verification: {
      pass: true,
      actualMigrationIds: ["page-1"],
      textReconciliation: {
        expectedTokenCount: 4,
        actualTokenCount: 4,
        matchedTokenCount: 4,
        recall: 1,
        allOrderPreserved: true,
      },
      placeholderReconciliation: {
        expectedPageCount: 1,
        exactPageCount: 1,
        expectedPlaceholderCount: 0,
        actualPlaceholderCount: 0,
      },
      linkReconciliation: {
        expectedPageCount: 1,
        exactPageCount: 1,
        expectedLinkCount: 1,
        actualLinkCount: 1,
        expectedInternalLinkCount: 1,
        actualInternalLinkCount: 1,
        brokenInternalLinkCount: 0,
      },
      pages: [
        {
          migrationId: "page-1",
          blocks: [{ name: "core/paragraph", path: "root.1" }],
          parserFailures: [],
          invalidBlocks: [],
          recoveredBlocks: [],
          unexpectedFreeformHtml: [],
        },
      ],
      failures: [],
    },
  };
}

describe("M1 reconciliation scorecard contract", () => {
  it("loads the versioned PRD pilot thresholds from configuration", () => {
    const envelope = loadThresholdConfiguration();
    expect(envelope.config.profile).toBe("prd-pilot-v1");
    expect(envelope.config.thresholds.meaningfulTextRecall).toMatchObject({ operator: "gte", value: 0.995 });
    expect(envelope.config.thresholds.supportedImageLocalRate).toMatchObject({ operator: "gte", value: 0.99 });
    expect(envelope.config.thresholds.brokenInternalLinkRate).toMatchObject({ operator: "lt", value: 0.005 });
    expect(envelope.config.thresholds.autoPassingPageRate).toMatchObject({ operator: "gte", value: 0.85 });
  });

  it("emits complete totals and a sanitized human-readable HTML companion", () => {
    const report = buildReconciliationReport({
      run: { runId: "report-contract", fixture: "synthetic" },
      ...passingEvidence(),
    });
    expectSchemaValid(report);
    expect(report).toMatchObject({ schemaVersion: RECONCILIATION_SCHEMA_VERSION, pass: true, findings: [] });
    expect(Object.keys(report.totals)).toEqual(["page", "block", "text", "media", "placeholder", "link", "failure"]);
    expect(report.totals.link).toMatchObject({ expected: 1, actual: 1, brokenInternal: 0, brokenInternalRate: 0 });
    expect(report.gate.evaluations.find((item) => item.metric === "meaningfulTextRecall")).toMatchObject({
      status: "pass",
      value: 1,
    });
    expect(report.gate.evaluations.find((item) => item.metric === "supportedImageLocalRate")).toMatchObject({
      status: "not-applicable",
      pass: null,
    });

    const html = renderReconciliationReportHtml(report);
    expect(html).toContain("Blockify post-import reconciliation");
    expect(html).toContain("page.autoPassingRate");
    expect(html).toContain("prd-pilot-v1");
    expect(html).not.toContain("Sanitized fixture pointer only.");
  });

  it("assigns deterministic stable IDs and escapes failure diagnostics in HTML", () => {
    const evidence = passingEvidence();
    evidence.verification.pass = false;
    evidence.verification.failures = [
      {
        kind: "missing-imported-page",
        migrationId: "page-1",
        message: "Missing <script>alert(1)</script> page.",
      },
    ];
    const first = buildReconciliationReport({ run: { runId: "first" }, ...evidence });
    const second = buildReconciliationReport({ run: { runId: "second" }, ...evidence });
    expectSchemaValid(first);
    expectSchemaValid(second);
    expect(first.pass).toBe(false);
    expect(first.findings.map((item) => item.id)).toEqual(second.findings.map((item) => item.id));
    expect(first.findings[0]).toMatchObject({
      code: "M1-MISSING-IMPORTED-PAGE",
      blocking: true,
      migrationId: "page-1",
    });
    expect(first.findings[0].id).toMatch(/^m1\.missing-imported-page\.[a-f0-9]{12}$/);
    const html = renderReconciliationReportHtml(first);
    expect(html).toContain("Missing &lt;script&gt;alert(1)&lt;/script&gt; page.");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("fails closed when a configuration threshold is not met or the contract is invalid", () => {
    const envelope = loadThresholdConfiguration();
    const stricter = structuredClone(envelope.config);
    stricter.thresholds.meaningfulTextRecall = {
      ...stricter.thresholds.meaningfulTextRecall,
      operator: "eq",
      value: 0.5,
    };
    const thresholdFailure = buildReconciliationReport({
      run: { runId: "threshold-failure" },
      ...passingEvidence(),
      thresholdConfiguration: stricter,
    });
    expectSchemaValid(thresholdFailure);
    expect(thresholdFailure.pass).toBe(false);
    expect(thresholdFailure.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "blocking-threshold-failed",
          details: expect.objectContaining({ metric: "meaningfulTextRecall" }),
        }),
      ]),
    );

    const invalid = structuredClone(envelope.config);
    delete invalid.thresholds.brokenInternalLinkRate;
    const invalidReport = buildReconciliationReport({
      run: { runId: "invalid-config" },
      ...passingEvidence(),
      thresholdConfiguration: invalid,
    });
    expectSchemaValid(invalidReport);
    expect(invalidReport.pass).toBe(false);
    expect(invalidReport.findings.map((item) => item.kind)).toContain("invalid-threshold-configuration");
  });

  it("fails closed when an emitted report drifts from the published schema", () => {
    const report = buildReconciliationReport({
      run: { runId: "schema-drift" },
      ...passingEvidence(),
    });
    delete report.schemaVersion;
    expect(() => assertReconciliationReportSchema(report)).toThrow(ReportSchemaError);
  });

  it("ships a schema artifact for downstream QA tools", () => {
    expect(reportSchema.$id).toContain(`reconciliation-report-${RECONCILIATION_SCHEMA_VERSION}.json`);
    expect(reportSchema.properties.schemaVersion.const).toBe(RECONCILIATION_SCHEMA_VERSION);
    expect(reportSchema.$defs.finding.required).toEqual(
      expect.arrayContaining(["id", "code", "kind", "severity", "blocking", "message"]),
    );
  });
});
