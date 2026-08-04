import { describe, expect, it } from "vitest";
import { buildRiskQueue, scoreRiskFinding } from "../lib/qa/risk";

describe("migration risk scoring and QA queue", () => {
  it("scores blocking unresolved low-confidence findings above informational findings", () => {
    const blocking = scoreRiskFinding({
      id: "b",
      code: "invalid-block",
      severity: "blocking",
      status: "open",
      confidence: 0.4,
      sourceEvidenceCount: 0,
      message: "Invalid block",
    });
    const info = scoreRiskFinding({
      id: "i",
      code: "note",
      severity: "info",
      status: "resolved",
      confidence: 1,
      sourceEvidenceCount: 1,
      message: "Note",
    });
    expect(blocking.score).toBeGreaterThan(info.score);
    expect(blocking.factors).toEqual(["unresolved", "low-confidence", "missing-source-evidence", "blocking-severity"]);
  });

  it("filters and deterministically ranks the QA queue", () => {
    const queue = buildRiskQueue(
      [
        {
          id: "page-2",
          pageId: "page:2",
          code: "missing-media",
          severity: "warning",
          status: "open",
          message: "Missing media",
        },
        {
          id: "page-1",
          pageId: "page:1",
          code: "invalid-block",
          severity: "blocking",
          status: "open",
          message: "Invalid block",
        },
        { id: "page-3", pageId: "page:3", code: "note", severity: "info", status: "resolved", message: "Note" },
      ],
      { minimumScore: 60, statuses: ["open"] },
    );
    expect(queue.map((finding) => finding.id)).toEqual(["page-1"]);
  });
});
