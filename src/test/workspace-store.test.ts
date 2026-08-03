// @vitest-environment node

import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createEntityRecord,
  createWorkspaceManifest,
  serializeWorkspaceManifest,
  type WorkspaceEntity,
  type WorkspaceManifest,
} from "../lib/workspace";
import { WorkspaceStore } from "../lib/workspace/store";

const roots: string[] = [];
const producer = { name: "workspace-store-test", version: "1.0.0" };
const timestamps = {
  createdAt: "2026-08-03T00:00:00.000Z",
  updatedAt: "2026-08-03T00:00:00.000Z",
};

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "blockify-workspace-store-"));
  roots.push(root);
  return root;
}

function baseManifest(entities?: Partial<WorkspaceManifest["entities"]>): WorkspaceManifest {
  return createWorkspaceManifest({
    workspaceId: "store-fixture",
    producer,
    now: timestamps.createdAt,
    entities,
  });
}

function page(index: number, site = "site-0"): WorkspaceEntity {
  return createEntityRecord({
    kind: "page_snapshot",
    identity: `https://fixture.test/page/${index}`,
    data: { site, requestedUrl: `https://fixture.test/page/${index}`, title: `Page ${index}` },
    producer,
    timestamps,
  });
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("filesystem and SQLite workspace recovery", () => {
  it("recovers a committed SQLite manifest after interruption before atomic snapshot rename", async () => {
    const root = await temporaryRoot();
    const initial = await WorkspaceStore.open(root, { manifest: baseManifest() });
    initial.close();

    const interrupted = await WorkspaceStore.open(root, {
      faultInjector: () => {
        throw new Error("simulated interruption");
      },
    });
    await expect(interrupted.putEntity(page(1))).rejects.toMatchObject({ code: "interrupted-write" });
    interrupted.close();

    const recovered = await WorkspaceStore.open(root);
    expect(recovered.getManifest().entities.page_snapshot.map((entity) => entity.identity)).toEqual([
      "https://fixture.test/page/1",
    ]);
    expect(await readFile(join(root, "manifest.json"), "utf8")).toBe(serializeWorkspaceManifest(recovered.getManifest()));
    expect((await readdir(root)).filter((name) => name.startsWith("manifest.json.tmp-")).length).toBe(0);
    recovered.close();
  });
});

describe("verified content-addressed blobs", () => {
  it("deduplicates equal bytes and rejects a corrupted registered blob", async () => {
    const root = await temporaryRoot();
    const store = await WorkspaceStore.open(root, { manifest: baseManifest() });
    const bytes = new TextEncoder().encode("same content");

    const first = await store.putBlob(bytes);
    const second = await store.putBlob(new Uint8Array(bytes));
    expect(first).toMatchObject({ created: true, size: bytes.byteLength });
    expect(second).toMatchObject({ created: false, hash: first.hash, relativePath: first.relativePath });
    expect((await readdir(dirname(store.blobPath(first.hash)))).filter((name) => name === first.hash)).toHaveLength(1);

    await writeFile(store.blobPath(first.hash), "tampered");
    await expect(store.getBlob(first.hash)).rejects.toMatchObject({ code: "blob-corrupt" });
    await expect(store.putBlob(bytes)).rejects.toMatchObject({ code: "blob-corrupt" });
    store.close();
  });
});

describe("indexed workspace entity queries", () => {
  it("queries large page, asset, and finding fixtures without materializing all entities", async () => {
    const pages = Array.from({ length: 1_200 }, (_, index) => page(index, `site-${index % 12}`));
    const assets = Array.from({ length: 900 }, (_, index) =>
      createEntityRecord({
        kind: "asset",
        identity: `https://fixture.test/assets/${index}.jpg`,
        data: { mimeType: index % 2 === 0 ? "image/jpeg" : "image/png", ownerSite: `site-${index % 12}` },
        producer,
        timestamps,
      }),
    );
    const findings = Array.from({ length: 600 }, (_, index) =>
      createEntityRecord({
        kind: "qa_finding",
        identity: `finding-${index}`,
        data: { severity: index % 3 === 0 ? "high" : "low", status: index % 2 === 0 ? "open" : "closed" },
        producer,
        timestamps,
      }),
    );
    const root = await temporaryRoot();
    const store = await WorkspaceStore.open(root, { manifest: baseManifest({ page_snapshot: pages, asset: assets, qa_finding: findings }) });

    const sitePages = await store.listPages({ filters: { site: "site-7" }, limit: 7, offset: 3 });
    expect(sitePages.total).toBe(100);
    expect(sitePages.entities).toHaveLength(7);
    expect(sitePages.entities.every((entity) => (entity.data as { site: string }).site === "site-7")).toBe(true);

    const jpegAssets = await store.listAssets({ filters: { mimeType: "image/jpeg" }, limit: 5 });
    expect(jpegAssets.total).toBe(450);
    expect(jpegAssets.entities).toHaveLength(5);

    const highFindings = await store.listFindings({ filters: { severity: "high", status: "open" }, limit: 11 });
    expect(highFindings.total).toBe(100);
    expect(highFindings.entities).toHaveLength(11);
    expect((await store.explainQuery("qa_finding", { filters: { severity: "high" } })).some((detail) => detail.includes("idx_entity_fields_lookup"))).toBe(true);
    store.close();
  });
});
