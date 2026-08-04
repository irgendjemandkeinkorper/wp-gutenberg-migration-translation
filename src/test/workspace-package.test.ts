// @vitest-environment node

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createWorkspaceManifest } from "../lib/workspace";
import {
  buildWorkspacePackage,
  importWorkspacePackage,
  readWorkspacePackage,
  upgradeWorkspacePackage,
  writeWorkspacePackage,
} from "../lib/workspace/package";
import { WorkspaceStore } from "../lib/workspace/store";

describe("portable workspace package", () => {
  it("exports/imports manifest and verified blobs for offline reopening", async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), "blockify-workspace-source-"));
    const packageRoot = await mkdtemp(join(tmpdir(), "blockify-workspace-package-"));
    const targetRoot = await mkdtemp(join(tmpdir(), "blockify-workspace-target-"));
    try {
      const manifest = createWorkspaceManifest({
        workspaceId: "workspace-1",
        producer: { name: "test", version: "1.0.0" },
      });
      const source = await WorkspaceStore.open(sourceRoot, { manifest });
      const blob = await source.putBlob(new TextEncoder().encode("offline evidence"));
      const packageData = await buildWorkspacePackage(source, { logs: ["authorization: top-secret\nfinished"] });
      expect(packageData.files["logs/0000.log"]).toBe("authorization=[REDACTED]\nfinished");
      await writeWorkspacePackage(packageRoot, packageData);
      const importedData = await readWorkspacePackage(packageRoot);
      const target = await importWorkspacePackage(importedData, targetRoot);
      expect(new TextDecoder().decode(await target.getBlob(blob.hash))).toBe("offline evidence");
      source.close();
      target.close();
    } finally {
      await rm(sourceRoot, { recursive: true, force: true });
      await rm(packageRoot, { recursive: true, force: true });
      await rm(targetRoot, { recursive: true, force: true });
    }
  });

  it("rejects traversal/corruption and upgrades a prior package wrapper", async () => {
    const root = await mkdtemp(join(tmpdir(), "blockify-workspace-package-"));
    try {
      const manifest = createWorkspaceManifest({
        workspaceId: "workspace-2",
        producer: { name: "test", version: "1.0.0" },
      });
      const sourceRoot = await mkdtemp(join(tmpdir(), "blockify-workspace-source-"));
      const source = await WorkspaceStore.open(sourceRoot, { manifest });
      const data = await buildWorkspacePackage(source);
      await writeWorkspacePackage(root, data);
      const manifestPath = join(root, "manifest.json");
      const raw = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
      raw.schemaVersion = "0.1.0";
      expect(upgradeWorkspacePackage(raw).schemaVersion).toBe("1.0.0");
      raw.schemaVersion = "1.0.0";
      raw.files = [{ path: "../escape", kind: "blob", sha256: "x", byteLength: 1 }];
      await writeFile(manifestPath, JSON.stringify(raw));
      await expect(readWorkspacePackage(root)).rejects.toThrow(/Unsafe workspace package path/);
      source.close();
      await rm(sourceRoot, { recursive: true, force: true });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
