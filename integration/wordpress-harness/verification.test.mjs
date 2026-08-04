import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MIGRATION_ID_META_KEY,
  WORDPRESS_MEDIA_VERIFICATION_EVAL,
  WORDPRESS_VERIFICATION_EVAL,
  VerificationError,
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
    expect(records[0].textSequence).toEqual(["Blockify", "deterministic", "import", "fixture"]);
    const punctuationAndWhitespace = fixture("known-good.wxr.xml").replace(
      "<p>Blockify deterministic import fixture.</p>",
      "<p>\n Blockify&nbsp;\t deterministic&mdash;import&#8230;fixture. \u200B</p>",
    );
    expect(extractSourceEvidenceFromWxr(punctuationAndWhitespace)[0].textSequence).toEqual([
      "Blockify",
      "deterministic",
      "import",
      "fixture",
    ]);
  });

  it("compares imported Blockify postmeta to generated fixture hashes and counts", () => {
    const sourceRecords = extractSourceEvidenceFromWxr(fixture("known-media.wxr.xml"));
    expect(sourceRecords).toHaveLength(2);
    expect(sourceRecords[0]).toMatchObject({
      sourceHtmlOrigin: "postmeta",
      postMeta: { placeholderManifestValid: true, placeholderCount: 1 },
    });
    expect(sourceRecords[0].sourceHtml).toContain("<iframe");
    expect(sourceRecords[0].sourceHtml).not.toContain("<!-- wp:");

    const pages = sourceRecords.map((record) => ({
      migrationId: record.migrationId,
      postId: Number(record.sourcePostId),
      slug: record.slug,
      status: record.status,
      postType: record.type,
      postMeta: record.postMeta,
      blocks: [],
      parserFailures: [],
      textSequence: record.textSequence,
      placeholderIds: record.placeholderIds,
    }));
    const passing = verifyImportedPages({
      pages,
      expectedMigrationIds: sourceRecords.map((record) => record.migrationId),
      expectedSourceRecords: sourceRecords,
    });
    expect(passing.pass).toBe(true);
    expect(passing.textReconciliation).toMatchObject({
      expectedPageCount: 2,
      reconciledPageCount: 2,
      exactPageCount: 2,
      expectedTokenCount: 23,
      actualTokenCount: 23,
      matchedTokenCount: 23,
      recall: 1,
      allOrderPreserved: true,
    });
    expect(passing.placeholderReconciliation).toMatchObject({
      expectedPageCount: 2,
      reconciledPageCount: 2,
      exactPageCount: 2,
      expectedPlaceholderCount: 1,
      actualPlaceholderCount: 1,
    });
    expect(passing.pages[0].textReconciliation).toMatchObject({
      recall: 1,
      exactSequence: true,
      missingTokenCount: 0,
      duplicatedTokenCount: 0,
      unexpectedTokenCount: 0,
    });
    expect(passing.pages[0].placeholderReconciliation).toMatchObject({
      expectedIds: ["1"],
      actualIds: ["1"],
      exactMatch: true,
    });
    expect(passing.pages[0]).not.toHaveProperty("_textSequence");
    expect(JSON.stringify(passing)).not.toContain("Generated fixture A preserves");
    const scorecard = buildReconciliationReport({
      run: { runId: "fixture", fixture: "known-media", fixtureSha256: "fixture-hash" },
      sourceRecords,
      verification: passing,
      homepageStatus: 200,
      restApiStatus: 200,
    });
    expect(scorecard.schemaVersion).toBe("1.1.0");
    expect(scorecard.destination.textReconciliation).toEqual(passing.textReconciliation);
    expect(scorecard.destination.placeholderReconciliation).toEqual(passing.placeholderReconciliation);
    expect(JSON.stringify(scorecard)).not.toContain("Generated fixture A preserves");

    const failing = verifyImportedPages({
      pages: [{ ...pages[0], postMeta: { ...pages[0].postMeta, sourceHtmlSha256: "0".repeat(64) } }, pages[1]],
      expectedMigrationIds: sourceRecords.map((record) => record.migrationId),
      expectedSourceRecords: sourceRecords,
    });
    expect(failing.pass).toBe(false);
    expect(failing.failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "post-meta-mismatch",
          migrationId: sourceRecords[0].migrationId,
          metadataKey: "sourceHtmlSha256",
        }),
      ]),
    );
  });

  it("blocks missing, duplicated, and reordered text plus duplicate placeholders", () => {
    const sourceRecords = extractSourceEvidenceFromWxr(fixture("known-media.wxr.xml"));
    const pages = sourceRecords.map((record) => ({
      migrationId: record.migrationId,
      postId: Number(record.sourcePostId),
      slug: record.slug,
      status: record.status,
      postType: record.type,
      postMeta: record.postMeta,
      blocks: [],
      parserFailures: [],
      textSequence: [...record.textSequence],
      placeholderIds: [...record.placeholderIds],
    }));
    const verify = (firstPage) =>
      verifyImportedPages({
        pages: [firstPage, pages[1]],
        expectedMigrationIds: sourceRecords.map((record) => record.migrationId),
        expectedSourceRecords: sourceRecords,
      });

    const missing = verify({ ...pages[0], textSequence: pages[0].textSequence.slice(1) });
    expect(missing.failures.map((failure) => failure.kind)).toContain("text-recall-loss");
    expect(missing.pages[0].textReconciliation.recall).toBeLessThan(1);

    const duplicated = verify({
      ...pages[0],
      textSequence: [...pages[0].textSequence, pages[0].textSequence[0]],
    });
    expect(duplicated.failures.map((failure) => failure.kind)).toContain("text-duplication");

    const reorderedTokens = [...pages[0].textSequence];
    [reorderedTokens[0], reorderedTokens[1]] = [reorderedTokens[1], reorderedTokens[0]];
    const reordered = verify({ ...pages[0], textSequence: reorderedTokens });
    expect(reordered.failures.map((failure) => failure.kind)).toContain("text-order-mismatch");
    expect(reordered.pages[0].textReconciliation.orderPreserved).toBe(false);

    const duplicatePlaceholder = verify({ ...pages[0], placeholderIds: ["1", "1"] });
    expect(duplicatePlaceholder.failures.map((failure) => failure.kind)).toContain("placeholder-mismatch");
    expect(duplicatePlaceholder.pages[0].placeholderReconciliation).toMatchObject({
      duplicateDestinationIds: ["1"],
      exactMatch: false,
    });
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
    expect(extractMigrationIdsFromWxr(fixture("known-media.wxr.xml"))).toEqual([
      "a1-generated-page-9101",
      "a1-generated-page-9102",
    ]);
    expect(fixture("known-media.wxr.xml")).toContain("_blockify_migration_placeholders");
    expect(fixture("known-media.wxr.xml")).toContain("MIGRATION PLACEHOLDER 1: iframe");
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

  it("proves two imported pages share one reconciled WordPress attachment", () => {
    const destinationUrl = "http://destination.test/wp-content/uploads/2025/01/blockify-fixture.png";
    const report = verifyImportedMedia({
      expectedMigrationIds: ["a4-media-page-9101", "a4-media-page-9102"],
      expectedAttachmentCount: 1,
      forbiddenSourceUrls: [
        "http://wordpress/blockify-fixture.png",
        "http://wordpress/blockify-fixture.png?fit=crop&width=600",
      ],
      inspection: {
        attachments: [
          {
            attachmentId: 73,
            destinationUrl,
            parentId: 51,
            mime: "image/png",
            sourceFileSha256: "a".repeat(64),
            width: 1,
            height: 1,
          },
        ],
        pages: [
          {
            migrationId: "a4-media-page-9101",
            postId: 51,
            contentSha256: "b".repeat(64),
            mediaUrls: [destinationUrl],
          },
          {
            migrationId: "a4-media-page-9102",
            postId: 52,
            contentSha256: "c".repeat(64),
            mediaUrls: [destinationUrl],
          },
        ],
      },
    });

    expect(report.pass).toBe(true);
    expect(report.attachmentCount).toBe(1);
    expect(report.destinationUrls).toEqual([destinationUrl]);
    expect(report.failures).toEqual([]);
  });

  it("fails media reconciliation when aliases remain or page/attachment evidence is incomplete", () => {
    const sourceAlias = "http://wordpress/blockify-fixture.png?fit=crop&width=600";
    const report = verifyImportedMedia({
      expectedMigrationIds: ["a4-media-page-9101", "a4-media-page-9102"],
      expectedAttachmentCount: 1,
      forbiddenSourceUrls: [sourceAlias],
      inspection: {
        attachments: [],
        pages: [
          {
            migrationId: "a4-media-page-9101",
            postId: 51,
            contentSha256: "b".repeat(64),
            mediaUrls: [sourceAlias],
          },
        ],
      },
    });

    expect(report.pass).toBe(false);
    expect(report.failures.map((failure) => failure.kind)).toEqual(
      expect.arrayContaining(["attachment-count-mismatch", "source-media-alias-remains", "missing-media-page"]),
    );
    expect(() => assertMediaVerificationPass(report)).toThrow(VerificationError);
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
    const media = execFileSync(process.execPath, [run, "--fixture", "known-media", "--dry-run"], {
      cwd: repoDir,
      encoding: "utf8",
    });
    expect(good).toContain("DRY RUN PASS: known-good");
    expect(malformed).toContain("DRY RUN PASS: known-malformed");
    expect(media).toContain("DRY RUN PASS: known-media");
  });

  it("limits the Docker-local media exception to the exact disposable fixture URL", () => {
    const compose = readFileSync(join(harnessDir, "docker-compose.yml"), "utf8");
    const allowlist = readFileSync(join(harnessDir, "mu-plugins", "blockify-fixture-media.php"), "utf8");

    expect(compose.match(/\.\/mu-plugins:\/var\/www\/html\/wp-content\/mu-plugins:ro/g)).toHaveLength(2);
    expect(allowlist).toContain("http_request_host_is_external");
    expect(allowlist).toContain("http://wordpress/blockify-fixture.png");
    expect(allowlist).toContain("'wordpress' === $host");
    expect(allowlist).not.toContain("return true;");
  });

  it("keeps the WordPress probe on the parser and registry seam", () => {
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("parse_blocks");
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("WP_Block_Type_Registry");
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("_blockify_migration_id");
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("'meta_query'");
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("'compare' => 'EXISTS'");
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("sha256");
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("_blockify_source_html");
    expect(WORDPRESS_VERIFICATION_EVAL).toContain("placeholderManifestValid");
    expect(WORDPRESS_MEDIA_VERIFICATION_EVAL).toContain("wp_get_attachment_url");
    expect(WORDPRESS_MEDIA_VERIFICATION_EVAL).toContain("hash_file");
    expect(WORDPRESS_MEDIA_VERIFICATION_EVAL).toContain("mediaUrls");
  });
});
