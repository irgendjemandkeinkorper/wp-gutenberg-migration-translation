import { describe, expect, it } from "vitest";
import {
  confirmTargetedRerun,
  PageQaValidationError,
  previewTargetedRerun,
  recordPageQaRevision,
  validatePageQaRecord,
  type PageQaRecord,
} from "../lib/qa/workbench";
import { operationAuthorizations, pageQaRecordFixture } from "./fixtures/page-qa-fixture";

const REQUESTED_AT = "2026-08-03T12:10:00.000Z";
const CONFIRMED_AT = "2026-08-03T12:11:00.000Z";

describe("page QA workbench contract", () => {
  it("accepts bounded evidence and rejects raw source or cross-page reconciliation mismatches actionably", () => {
    const record = pageQaRecordFixture();
    expect(validatePageQaRecord(record)).toEqual([]);

    const invalid = structuredClone(record) as PageQaRecord & {
      current: PageQaRecord["current"] & { source: PageQaRecord["current"]["source"] & { sourceHtml?: string } };
    };
    invalid.current.source.sourceHtml = "<main>raw source must stay in the archive</main>";
    invalid.current.findings[0].pageId = "page:another";
    invalid.current.blockMappings[1].findingIds = ["finding:missing"];

    const diagnostics = validatePageQaRecord(invalid);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "current.source.sourceHtml", code: "invalid" }),
        expect.objectContaining({ path: "current.findings[0].pageId", code: "mismatch" }),
        expect.objectContaining({ path: "current.blockMappings[1].findingIds", code: "mismatch" }),
      ]),
    );
  });

  it("previews dependency invalidation without mutating evidence or starting work", () => {
    const record = pageQaRecordFixture();
    const before = structuredClone(record);
    const preview = previewTargetedRerun(record, {
      requestedBy: "qa-operator",
      requestedAt: REQUESTED_AT,
      changedEntities: [{ kind: "page_snapshot", id: record.current.source.snapshotId }],
      operations: ["recompute"],
    });

    expect(preview.canConfirm).toBe(true);
    expect(preview.plan.scopes.map((scope) => scope.stage)).toEqual(
      expect.arrayContaining(["extraction", "media", "placement", "conversion", "delivery", "reconciliation", "qa"]),
    );
    expect(preview.plan.scopes.map((scope) => scope.stage)).not.toContain("acquisition");
    expect(record).toEqual(before);
    expect(record.audit).toEqual([]);
  });

  it("refuses recrawl and publish until externally issued grants are supplied", () => {
    const record = pageQaRecordFixture();
    const preview = previewTargetedRerun(record, {
      requestedBy: "qa-operator",
      requestedAt: REQUESTED_AT,
      changedEntities: [{ kind: "page_snapshot", id: record.current.source.snapshotId }],
      operations: ["recompute", "recrawl", "publish"],
    });

    expect(preview.canConfirm).toBe(false);
    expect(preview.requiredAuthorizations).toEqual(["recrawl", "publish"]);
    expect(preview.diagnostics.filter((diagnostic) => diagnostic.code === "unauthorized")).toHaveLength(2);
    expect(() => confirmTargetedRerun(record, preview, "qa-operator", CONFIRMED_AT)).toThrow(PageQaValidationError);
    expect(() =>
      confirmTargetedRerun(
        record,
        { ...preview, canConfirm: true, diagnostics: [], requiredAuthorizations: [] },
        "qa-operator",
        CONFIRMED_AT,
      ),
    ).toThrow(PageQaValidationError);
    expect(record.audit).toEqual([]);
  });

  it("emits an audited command and retains the prior revision when changed results arrive", () => {
    const record = pageQaRecordFixture();
    const preview = previewTargetedRerun(record, {
      requestedBy: "qa-operator",
      requestedAt: REQUESTED_AT,
      changedEntities: [{ kind: "page_snapshot", id: record.current.source.snapshotId }],
      operations: ["recompute", "recrawl", "publish"],
      authorizations: operationAuthorizations(),
    });
    expect(preview.canConfirm).toBe(true);

    const confirmed = confirmTargetedRerun(record, preview, "qa-operator", CONFIRMED_AT);
    expect(confirmed.command.operations).toEqual(["recompute", "recrawl", "publish"]);
    expect(confirmed.command.authorizationGrantIds).toEqual(["grant:publish:42", "grant:recrawl:42"]);
    expect(confirmed.record.audit.map((event) => event.type)).toEqual(["rerun-previewed", "rerun-confirmed"]);
    expect(record.audit).toEqual([]);

    const revised = recordPageQaRevision(
      confirmed.record,
      {
        ...record.current,
        revisionId: "revision:2",
        destination: {
          ...record.current.destination,
          status: "verified",
          preview: {
            sha256: "c".repeat(64),
            excerpt: "<!-- wp:paragraph --><p>Verified result</p><!-- /wp:paragraph -->",
          },
        },
      },
      confirmed.command,
      "2026-08-03T12:20:00.000Z",
    );

    expect(revised.current.revisionId).toBe("revision:2");
    expect(revised.history).toHaveLength(1);
    expect(revised.history[0]).toEqual(record.current);
    expect(revised.audit.map((event) => event.type)).toEqual([
      "rerun-previewed",
      "rerun-confirmed",
      "revision-recorded",
    ]);
    expect(validatePageQaRecord(revised)).toEqual([]);
  });
});
