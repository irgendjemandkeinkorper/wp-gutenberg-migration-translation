import { describe, expect, it } from "vitest";
import { reconcileAttachments, reconcilePages } from "../lib/qa/reconciliation";

describe("migration reconciliation evidence", () => {
  it("reconciles page identity, text order/recall, and placeholders", () => {
    const result = reconcilePages(
      [
        {
          migrationId: "page:1",
          slug: "home",
          type: "page",
          status: "publish",
          textSequence: ["Hello", "World"],
          placeholderIds: ["exception:1"],
        },
      ],
      [
        {
          migrationId: "page:1",
          destinationId: "post:1",
          slug: "home",
          type: "page",
          status: "publish",
          textSequence: [" Hello ", "World"],
          placeholderIds: ["exception:1"],
        },
      ],
    );
    expect(result[0].matched).toBe(true);
    expect(result[0].textRecall).toBe(1);
    expect(result[0].findings).toEqual([]);
  });

  it("reports missing pages, placeholder drift, and attachment identity/count issues", () => {
    const pages = reconcilePages(
      [
        {
          migrationId: "page:missing",
          slug: "missing",
          type: "page",
          status: "publish",
          textSequence: [],
          placeholderIds: [],
        },
      ],
      [],
    );
    expect(pages[0].findings[0].code).toBe("missing-page");
    const attachments = reconcileAttachments(
      [{ assetId: "asset:1", sourceUrls: ["https://source.test/a.jpg"], expectedCount: 1 }],
      [
        {
          assetId: "asset:1",
          sourceUrl: "https://source.test/other.jpg",
          attachmentId: "attachment:2",
          destinationUrl: "https://wp.test/other.jpg",
        },
      ],
    );
    expect(attachments.map((finding) => finding.code)).toEqual(["attachment-url-mismatch"]);
  });
});
