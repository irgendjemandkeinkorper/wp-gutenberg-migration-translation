import { describe, expect, it } from "vitest";
import { assertReleaseReady, createException, transitionException } from "../lib/exceptions/lifecycle";

const base = () =>
  createException({
    id: "exception-1",
    placeholderId: "placeholder-1",
    sourceNodeId: "node-1",
    evidence: ["html:evidence-1"],
    severity: "blocking",
    remediation: "Replace unsupported widget.",
    owner: "migration-team",
    createdAt: "2026-08-03T00:00:00.000Z",
  });

describe("migration exception lifecycle", () => {
  it("enforces one-to-one placeholder resolution metadata", () => {
    const inProgress = transitionException(base(), "in-progress", "2026-08-03T00:01:00.000Z");
    const resolved = transitionException(inProgress, "resolved", "2026-08-03T00:02:00.000Z", {
      actor: "operator",
      at: "2026-08-03T00:02:00.000Z",
      method: "replaced-widget",
      destinationArtifactId: "post:42",
    });
    expect(resolved.resolution?.destinationArtifactId).toBe("post:42");
    expect(() => assertReleaseReady([resolved])).not.toThrow();
  });

  it("blocks release for unresolved blocking exceptions and rejects invalid transitions", () => {
    expect(() => assertReleaseReady([base()])).toThrow(/Release blocked/);
    expect(() => transitionException(base(), "resolved", "2026-08-03T00:01:00.000Z")).toThrow(
      /Invalid exception transition/,
    );
    const inProgress = transitionException(base(), "in-progress", "2026-08-03T00:01:00.000Z");
    expect(() => transitionException(inProgress, "resolved", "2026-08-03T00:01:00.000Z", undefined)).toThrow(/require/);
  });
});
