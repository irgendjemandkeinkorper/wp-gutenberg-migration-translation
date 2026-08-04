import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MIGRATION_ID_META_KEY,
  WORDPRESS_VERIFICATION_EVAL,
  VerificationError,
  analyzeBlockMarkup,
  assertVerificationPass,
  extractMigrationIdsFromWxr,
  extractSourceEvidenceFromWxr,
  verifyImportedPages,
} from "./verification.mjs";
import { buildReconciliationReport } from "./report.mjs";

const harnessDir = dirname(fileURLToPath(import.meta.url));
const repoDir = join(harnessDir, "../..");
const fixture = (name) => readFileSync(join(harnessDir, "fixtures", name), "utf8");
const content = (xml) => xml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i)?.[1] || "";

describe("post-import Gutenberg verifier", () => {
  it("extracts source HTML as auditable records without putting content in the scorecard", () => {
    const records = extractSourceEvidenceFromWxr(fixture("known-good.wxr.xml"));
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      migrationId: "a2-good-page-9001",
      sourcePostId: "9001",
      slug: "blockify-harness-fixture-page",
      type: "page",
      status: "publish",
    });
    expect(records[0].sourceHtml).toContain("Blockify deterministic import fixture.");
  });

  it("builds a durable passing scorecard with source evidence pointers and no raw HTML", () => {
    const sourceRecords = extractSourceEvidenceFromWxr(fixture("known-good.wxr.xml"));
    const verification = verifyImportedPages({
      expectedMigrationIds: ["a2-good-page-9001"],
      pages: [{ migrationId: "a2-good-page-9001", postId: 1, status: "publish", blocks: [], parserFailures: [] }],
    });
    const report = buildReconciliationReport({
      run: { runId: "fixture", fixture: "known-good", fixtureSha256: "fixture-hash" },
      sourceRecords,
      sourceEvidenceManifest: [
        { migrationId: "a2-good-page-9001", path: "source-html/source-0001.html", bytes: 42, sha256: "source-hash" },
      ],
      verification,
      homepageStatus: 200,
      restApiStatus: 200,
    });
    expect(report.pass).toBe(true);
    expect(report.source.htmlAudit.records[0]).not.toHaveProperty("sourceHtml");
    expect(JSON.stringify(report)).not.toContain("Blockify deterministic import fixture.");
    expect(report.counts).toMatchObject({ expectedPages: 1, importedPages: 1, findings: 0 });
  });

  it("retains specific failure findings in a failed scorecard", () => {
    const report = buildReconciliationReport({
      run: { runId: "fixture", fixture: "known-bad" },
      sourceRecords: [],
      verification: {
        pass: false,
        actualMigrationIds: [],
        failures: [{ kind: "missing-imported-page", migrationId: "page-1", message: "Missing page." }],
      },
      failure: "WXR import failed",
    });
    expect(report.pass).toBe(false);
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "missing-imported-page", migrationId: "page-1" }),
        expect.objectContaining({ kind: "harness-failure", message: "WXR import failed" }),
      ]),
    );
  });

  it("extracts stable migration IDs from WXR metadata", () => {
    expect(extractMigrationIdsFromWxr(fixture("known-good.wxr.xml"))).toEqual(["a2-good-page-9001"]);
    expect(extractMigrationIdsFromWxr(fixture("known-malformed.wxr.xml"))).toEqual(["a2-malformed-page-9002"]);
    expect(MIGRATION_ID_META_KEY).toBe("_blockify_migration_id");
  });

  it("reports names and nesting paths for valid nested Gutenberg markup", () => {
    const report = analyzeBlockMarkup(content(fixture("known-good.wxr.xml")));
    expect(report.parserFailures).toEqual([]);
    expect(report.unexpectedFreeformHtml).toEqual([]);
    expect(report.blocks).toEqual([
      { name: "core/group", path: "root.1" },
      { name: "core/paragraph", path: "root.1.1" },
    ]);
  });

  it("detects malformed delimiters and unexpected freeform HTML without WordPress", () => {
    const report = analyzeBlockMarkup(content(fixture("known-malformed.wxr.xml")));
    expect(report.parserFailures.map((failure) => failure.kind)).toEqual(
      expect.arrayContaining(["mismatched-closing-block"]),
    );
    expect(report.unexpectedFreeformHtml).toHaveLength(1);
    expect(report.unexpectedFreeformHtml[0]).toMatchObject({ path: "root", tags: ["div"] });
  });

  it("passes a complete WordPress inspection with stable page identity and block paths", () => {
    const report = verifyImportedPages({
      expectedMigrationIds: ["a2-good-page-9001"],
      pages: [
        {
          migrationId: "a2-good-page-9001",
          postId: 9001,
          slug: "blockify-harness-fixture-page",
          status: "publish",
          blocks: [
            {
              name: "core/group",
              path: "root.1",
              registered: true,
              children: [{ name: "core/paragraph", path: "root.1.1", registered: true, children: [] }],
            },
          ],
          parserFailures: [],
        },
      ],
    });

    expect(report.pass).toBe(true);
    expect(report.actualMigrationIds).toEqual(["a2-good-page-9001"]);
    expect(report.pages[0].blockNames).toEqual(["core/group", "core/paragraph"]);
    expect(report.pages[0].blocks.map((block) => block.path)).toEqual(["root.1", "root.1.1"]);
  });

  it("fails explicitly on parser, invalid, recovered, and freeform diagnostics", () => {
    const report = verifyImportedPages({
      expectedMigrationIds: ["a2-malformed-page-9002"],
      pages: [
        {
          migrationId: "a2-malformed-page-9002",
          postId: 9002,
          status: "publish",
          blocks: [
            {
              name: "plugin/missing",
              path: "root.1",
              registered: false,
              recovered: true,
              freeformHtml: { length: 12, sha256: "fixture-hash", tags: ["div"] },
              children: [],
            },
          ],
          parserFailures: [{ kind: "unclosed-block", path: "root.1", message: "Block was not closed." }],
        },
      ],
    });

    expect(report.pass).toBe(false);
    expect(report.failures.map((failure) => failure.kind)).toEqual(
      expect.arrayContaining(["parser-failure", "invalid-block", "recovered-block", "unexpected-freeform-html"]),
    );
    expect(() => assertVerificationPass(report)).toThrow(VerificationError);
  });

  it("fails when WordPress omits or invents a migration page", () => {
    const report = verifyImportedPages({
      expectedMigrationIds: ["expected-page"],
      pages: [{ migrationId: "unexpected-page", postId: 1, status: "publish", blocks: [] }],
    });
    expect(report.pass).toBe(false);
    expect(report.failures.map((failure) => failure.kind)).toEqual(
      expect.arrayContaining(["missing-imported-page", "unexpected-imported-page"]),
    );
  });

  it("keeps the harness dry-run deterministic without Docker", () => {
    const run = join(harnessDir, "run.mjs");
    const good = execFileSync(process.execPath, [run, "--fixture", "known-good", "--dry-run"], {
      cwd: repoDir,
      encoding: "utf8",
    });
    const malformed = execFileSync(process.execPath, [run, "--fixture", "known-malformed", "--dry-run"], {
      cwd: repoDir,
      encoding: "utf8",
    });
    expect(good).toContain("DRY RUN PASS: known-good");
    expect(malformed).toContain("DRY RUN PASS: known-malformed");
  });

  it("keeps the WordPress probe on the parser and registry seam", () => {
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("parse_blocks");
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("WP_Block_Type_Registry");
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("_blockify_migration_id");
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("sha256");
  });
});
