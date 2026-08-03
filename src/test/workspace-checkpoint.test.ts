import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CheckpointError, CheckpointStore } from "../lib/workspace/checkpoint";

describe("workspace checkpoints", () => {
  it("recovers an interrupted 100-page run without duplicating committed outputs", async () => {
    const directory = await mkdtemp(join(tmpdir(), "blockify-checkpoint-"));
    try {
      const identities = Array.from({ length: 100 }, (_, index) => `page-${String(index).padStart(3, "0")}`);
      const first = new CheckpointStore({ directory, runId: "run-100", stage: "conversion", now: () => "2026-08-03T00:00:00.000Z" });
      await first.initialize(identities);
      for (const identity of identities.slice(0, 50)) {
        await first.markRunning(identity);
        await first.commit(identity, [`delivery:${identity}`]);
      }
      await first.markRunning(identities[50]);

      const recoveredStore = new CheckpointStore({ directory, runId: "run-100", stage: "conversion", now: () => "2026-08-03T00:01:00.000Z" });
      const recovered = await recoveredStore.recover();
      expect(recovered.items.filter((item) => item.status === "committed")).toHaveLength(50);
      expect(recovered.items[50].status).toBe("pending");
      expect(recovered.auditEvents.at(-1)?.type).toBe("recovered");
      expect(recoveredStore.resumableIdentities).toContain(identities[50]);

      await recoveredStore.markRunning(identities[50]);
      await recoveredStore.commit(identities[50], [`delivery:${identities[50]}`, `delivery:${identities[50]}`]);
      await recoveredStore.commit(identities[50], [`duplicate-ignored`]);
      const final = recoveredStore.getSnapshot();
      expect(final.items[50].status).toBe("committed");
      expect(final.items[50].outputEntityIds).toEqual([`delivery:${identities[50]}`]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("pauses only at safe boundaries and records resume audit events", async () => {
    const directory = await mkdtemp(join(tmpdir(), "blockify-checkpoint-"));
    try {
      const store = new CheckpointStore({ directory, runId: "run-pause", stage: "delivery" });
      await store.initialize(["page-1"]);
      await store.markRunning("page-1");
      await expect(store.pause()).rejects.toMatchObject({ code: "unsafe-transition" });
      await store.commit("page-1", ["delivery:page-1"]);
      await store.pause("operator pause");
      expect(store.getSnapshot().status).toBe("paused");
      await store.resume();
      expect(store.getSnapshot().auditEvents.at(-1)?.type).toBe("resumed");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects a corrupt checkpoint before resuming work", async () => {
    const directory = await mkdtemp(join(tmpdir(), "blockify-checkpoint-"));
    try {
      const store = new CheckpointStore({ directory, runId: "run-corrupt", stage: "qa" });
      await store.initialize(["page-1"]);
      const path = join(directory, "run-corrupt.checkpoint.json");
      const raw = await readFile(path, "utf8");
      await writeFile(path, raw.replace("page-1", "tampered"));
      await expect(new CheckpointStore({ directory, runId: "run-corrupt", stage: "qa" }).recover()).rejects.toBeInstanceOf(CheckpointError);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
