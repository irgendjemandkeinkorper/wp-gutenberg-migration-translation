import { describe, expect, it } from "vitest";
import {
  WORKSPACE_ENTITY_KINDS,
  WORKSPACE_STAGE_NAMES,
  WORKSPACE_STAGE_GRAPH,
  WorkspaceManifestError,
  createEntityRecord,
  createStageRecord,
  createWorkspaceManifest,
  parseWorkspaceManifest,
  planInvalidation,
  serializeWorkspaceManifest,
  stableEntityId,
  topologicalStageOrder,
  validateWorkspaceManifest,
} from "../lib/workspace";

const producer = { name: "workspace-test", version: "1.2.3" };
const timestamps = {
  createdAt: "2026-08-03T00:00:00.000Z",
  updatedAt: "2026-08-03T00:00:01.000Z",
};

function manifest() {
  const page = createEntityRecord({
    kind: "page_snapshot",
    identity: "https://example.test/about",
    data: { requestedUrl: "https://example.test/about", htmlHash: "html-v1" },
    contentHash: "page-v1",
    producer,
    timestamps,
    provenance: { source: "fixture", method: "crawler" },
  });
  const extraction = createStageRecord({
    stage: "extraction",
    producer: { name: "extractor", version: "1.0.0" },
    inputHashes: { [page.id]: page.contentHash },
    dependencyStageFingerprints: { acquisition: "acquisition-fingerprint" },
    outputEntityIds: ["semantic_document:document-1"],
    now: timestamps.updatedAt,
  });
  return createWorkspaceManifest({
    workspaceId: "fixture-workspace",
    producer,
    now: timestamps.createdAt,
    entities: { page_snapshot: [page] },
    stages: { extraction },
  });
}

describe("migration workspace manifest contract", () => {
  it("covers every PRD logical entity and derives stable IDs from logical identity", () => {
    const current = manifest();
    expect(Object.keys(current.entities).sort()).toEqual([...WORKSPACE_ENTITY_KINDS].sort());
    expect(current.entities.workspace).toHaveLength(1);
    expect(current.entities.page_snapshot[0].id).toBe(stableEntityId("page_snapshot", "https://example.test/about"));
    expect(current.entities.page_snapshot[0]).toMatchObject({
      schemaVersion: "1.0.0",
      contentHash: "page-v1",
      provenance: { source: "fixture", method: "crawler" },
      timestamps,
      producer,
      dependencyHashes: {},
    });
    expect(current.contentHash).toMatch(/^[0-9a-f]{16}$/);
    expect(validateWorkspaceManifest(current)).toEqual({ valid: true, issues: [] });
  });

  it("round-trips deterministically and preserves IDs across export/import/reruns", () => {
    const current = manifest();
    const exported = serializeWorkspaceManifest(current);
    const imported = parseWorkspaceManifest(exported);
    const rerun = createEntityRecord({
      kind: "page_snapshot",
      identity: "https://example.test/about",
      data: { htmlHash: "html-v1", requestedUrl: "https://example.test/about" },
      contentHash: "page-v1",
      producer,
      timestamps,
    });

    expect(serializeWorkspaceManifest(imported)).toBe(exported);
    expect(imported.manifestId).toBe(current.manifestId);
    expect(imported.entities.page_snapshot[0].id).toBe(rerun.id);
    expect(imported.entities.page_snapshot[0].id).toBe(current.entities.page_snapshot[0].id);
  });

  it("ignores additive unknown fields under the forward-compatible policy", () => {
    const raw = JSON.parse(serializeWorkspaceManifest(manifest())) as Record<string, unknown>;
    (raw as { futureField?: unknown }).futureField = { preservedByWriter: true };
    const page = (raw.entities as { page_snapshot: Array<Record<string, unknown>> }).page_snapshot[0];
    page.futureEntityField = "ignored-by-reader";

    const parsed = parseWorkspaceManifest(JSON.stringify(raw));
    expect(parsed.workspaceId).toBe("fixture-workspace");
    expect(parsed.entities.page_snapshot[0].id).toBe(stableEntityId("page_snapshot", "https://example.test/about"));
  });

  it("fails closed for malformed JSON and corrupt content", () => {
    expect(() => parseWorkspaceManifest("{")).toThrowError(WorkspaceManifestError);
    try {
      parseWorkspaceManifest("{");
    } catch (error) {
      expect(error).toMatchObject({ code: "invalid-json" });
    }

    const raw = JSON.parse(serializeWorkspaceManifest(manifest())) as {
      entities: { page_snapshot: Array<{ contentHash: string }> };
    };
    raw.entities.page_snapshot[0].contentHash = "tampered";
    try {
      parseWorkspaceManifest(JSON.stringify(raw));
      throw new Error("expected corrupt manifest error");
    } catch (error) {
      expect(error).toMatchObject({ code: "corrupt-manifest" });
    }
    expect(validateWorkspaceManifest(raw).valid).toBe(false);
  });

  it("rejects a future major schema without attempting partial recovery", () => {
    const raw = JSON.parse(serializeWorkspaceManifest(manifest())) as Record<string, unknown>;
    raw.schemaVersion = "2.0.0";
    expect(() => parseWorkspaceManifest(JSON.stringify(raw))).toThrowError(WorkspaceManifestError);
    try {
      parseWorkspaceManifest(JSON.stringify(raw));
    } catch (error) {
      expect(error).toMatchObject({ code: "unsupported-schema" });
    }
  });
});

describe("migration workspace stage dependency graph", () => {
  it("is acyclic and returns dependencies before dependents", () => {
    const order = topologicalStageOrder();
    expect(order).toHaveLength(WORKSPACE_STAGE_NAMES.length);
    for (const stage of WORKSPACE_STAGE_NAMES) {
      for (const dependency of WORKSPACE_STAGE_GRAPH[stage].dependsOn) {
        expect(order.indexOf(dependency)).toBeLessThan(order.indexOf(stage));
      }
    }
  });

  it("invalidates only the affected branch and all deterministic downstream stages", () => {
    const plan = planInvalidation({
      changedEntities: [
        {
          kind: "page_snapshot",
          id: "page_snapshot:page-1",
          previousHash: "page-v1",
          currentHash: "page-v2",
        },
      ],
    });
    const invalidated = plan.stages.filter((stage) => stage.invalidated).map((stage) => stage.stage);

    expect(invalidated).toEqual(["extraction", "media", "placement", "conversion", "delivery", "reconciliation", "qa"]);
    expect(plan.stages.find((stage) => stage.stage === "profile")).toMatchObject({
      invalidated: false,
      reasons: [],
    });
    expect(plan.stages.find((stage) => stage.stage === "extraction")?.reasons).toEqual(["input-hash-changed"]);
    expect(plan.stages.find((stage) => stage.stage === "delivery")?.reasons).toEqual(["dependency-invalidated"]);
  });

  it("handles implementation-version changes, producer changes, forcing, and no-op plans", () => {
    expect(planInvalidation().stages.every((stage) => !stage.invalidated)).toBe(true);

    const conversion = planInvalidation({
      changedStageProducers: [{ stage: "conversion", previousVersion: "1.0.0", currentVersion: "1.1.0" }],
    });
    expect(conversion.stages.filter((stage) => stage.invalidated).map((stage) => stage.stage)).toEqual([
      "conversion",
      "delivery",
      "reconciliation",
      "qa",
    ]);
    expect(conversion.stages.find((stage) => stage.stage === "conversion")?.reasons).toEqual([
      "implementation-version-changed",
    ]);

    const producerChange = planInvalidation({
      changedEntities: [
        {
          kind: "template_profile",
          previousProducerVersion: "profile-1",
          currentProducerVersion: "profile-2",
        },
      ],
      forceStages: ["acquisition"],
    });
    expect(producerChange.stages.find((stage) => stage.stage === "profile")?.reasons).toEqual([
      "input-producer-version-changed",
    ]);
    expect(producerChange.stages.find((stage) => stage.stage === "acquisition")?.reasons).toEqual(["forced"]);
    expect(producerChange.stages.every((stage) => stage.reasons.every((reason) => reason.length > 0))).toBe(true);
  });
});
