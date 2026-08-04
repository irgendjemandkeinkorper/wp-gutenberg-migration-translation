import { describe, expect, it } from "vitest";
import { planSelectiveRetry } from "../lib/workspace/retry";

describe("selective workspace retry", () => {
  it("reruns profile-dependent stages without reacquiring source pages", () => {
    const plan = planSelectiveRetry({
      changedEntities: [{ kind: "template_profile", id: "profile:golfnow", previousHash: "old", currentHash: "new" }],
      now: "2026-08-03T00:00:00.000Z",
    });
    const stages = plan.scopes.map((scope) => scope.stage);
    expect(stages).toContain("profile");
    expect(stages).toContain("placement");
    expect(stages).toContain("conversion");
    expect(stages).toContain("qa");
    expect(stages).not.toContain("acquisition");
    expect(plan.scopes.every((scope) => scope.entityIds.length === 1 && scope.entityIds[0] === "profile:golfnow")).toBe(
      true,
    );
    expect(plan.auditEvent.type).toBe("selective-retry-planned");
  });

  it("limits a source change to the affected page identity", () => {
    const plan = planSelectiveRetry({
      changedEntities: [{ kind: "page_snapshot", id: "page:1", previousHash: "old", currentHash: "new" }],
    });
    expect(plan.scopes.map((scope) => scope.stage)).toContain("extraction");
    expect(plan.scopes.every((scope) => scope.entityIds.length > 0)).toBe(true);
    expect(plan.auditEvent.entityIds).toEqual(["page:1"]);
  });

  it("retries only recorded failures when requested", () => {
    const plan = planSelectiveRetry({
      forceStages: ["conversion"],
      failedItems: [{ stage: "conversion", entityId: "page:7" }],
    });
    expect(plan.scopes).toEqual([
      { stage: "conversion", entityIds: ["page:7"], reason: "failed-item" },
      { stage: "delivery", entityIds: ["page:7"], reason: "dependency-invalidated" },
      { stage: "reconciliation", entityIds: ["page:7"], reason: "dependency-invalidated" },
      { stage: "qa", entityIds: ["page:7"], reason: "dependency-invalidated" },
    ]);
  });
});
