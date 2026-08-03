import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parseWorkspaceManifest, serializeWorkspaceManifest, type WorkspaceManifest } from "./index";
import { WorkspaceStore } from "./store";

export const WORKSPACE_PACKAGE_SCHEMA_VERSION = "1.0.0" as const;

export interface WorkspacePackageFile {
  path: string;
  kind: "workspace-manifest" | "blob" | "redacted-log";
  sha256: string;
  byteLength: number;
}

export interface WorkspacePackageManifest {
  schemaVersion: typeof WORKSPACE_PACKAGE_SCHEMA_VERSION;
  createdAt: string;
  workspaceManifest: WorkspaceManifest;
  files: WorkspacePackageFile[];
}

export interface WorkspacePackageData {
  manifest: WorkspacePackageManifest;
  files: Record<string, Uint8Array | string>;
}

export interface BuildWorkspacePackageOptions {
  createdAt?: string;
  logs?: readonly string[];
}

export async function buildWorkspacePackage(store: WorkspaceStore, options: BuildWorkspacePackageOptions = {}): Promise<WorkspacePackageData> {
  const files: Record<string, Uint8Array | string> = {};
  const entries: WorkspacePackageFile[] = [];
  const workspaceManifest = store.getManifest();
  const manifestJson = serializeWorkspaceManifest(workspaceManifest);
  files["workspace/manifest.json"] = manifestJson;
  entries.push(fileEntry("workspace/manifest.json", "workspace-manifest", Buffer.from(manifestJson, "utf8")));
  for (const blob of store.listBlobs()) {
    const bytes = await store.getBlob(blob.hash);
    const path = `blobs/${blob.hash}.bin`;
    files[path] = bytes;
    entries.push(fileEntry(path, "blob", bytes));
  }
  for (const [index, log] of (options.logs ?? []).map(redactLog).entries()) {
    const path = `logs/${String(index).padStart(4, "0")}.log`;
    files[path] = log;
    entries.push(fileEntry(path, "redacted-log", Buffer.from(log, "utf8")));
  }
  return {
    manifest: { schemaVersion: WORKSPACE_PACKAGE_SCHEMA_VERSION, createdAt: options.createdAt ?? new Date(0).toISOString(), workspaceManifest, files: entries.sort((left, right) => left.path.localeCompare(right.path)) },
    files,
  };
}

export async function writeWorkspacePackage(directory: string, packageData: WorkspacePackageData): Promise<void> {
  await mkdir(directory, { recursive: true });
  for (const [path, data] of Object.entries(packageData.files)) {
    assertSafePath(path);
    const target = join(directory, path);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, data);
  }
  const manifestPath = join(directory, "manifest.json");
  const temporary = `${manifestPath}.tmp`;
  await writeFile(temporary, JSON.stringify(packageData.manifest, null, 2), { mode: 0o600 });
  await rename(temporary, manifestPath);
}

export async function readWorkspacePackage(directory: string): Promise<WorkspacePackageData> {
  const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")) as WorkspacePackageManifest;
  if (manifest.schemaVersion !== WORKSPACE_PACKAGE_SCHEMA_VERSION) throw new Error(`Unsupported workspace package schema ${manifest.schemaVersion}.`);
  parseWorkspaceManifest(serializeWorkspaceManifest(manifest.workspaceManifest));
  const files: Record<string, Uint8Array | string> = {};
  for (const entry of manifest.files) {
    assertSafePath(entry.path);
    const bytes = new Uint8Array(await readFile(join(directory, entry.path)));
    if (sha256(bytes) !== entry.sha256 || bytes.byteLength !== entry.byteLength) throw new Error(`Workspace package hash mismatch for ${entry.path}.`);
    files[entry.path] = entry.kind === "workspace-manifest" || entry.kind === "redacted-log" ? Buffer.from(bytes).toString("utf8") : bytes;
  }
  return { manifest, files };
}

export async function importWorkspacePackage(packageData: WorkspacePackageData, rootDirectory: string): Promise<WorkspaceStore> {
  const store = await WorkspaceStore.open(rootDirectory, { manifest: packageData.manifest.workspaceManifest });
  try {
    for (const entry of packageData.manifest.files.filter((file) => file.kind === "blob")) {
      const data = packageData.files[entry.path];
      if (!(data instanceof Uint8Array)) throw new Error(`Blob package entry ${entry.path} is not binary.`);
      await store.putBlob(data, entry.path.slice("blobs/".length, -".bin".length));
    }
    return store;
  } catch (error) {
    store.close();
    throw error;
  }
}

export function upgradeWorkspacePackage(input: unknown): WorkspacePackageManifest {
  if (!input || typeof input !== "object") throw new Error("Workspace package is not an object.");
  const value = input as Record<string, unknown>;
  if (value.schemaVersion === WORKSPACE_PACKAGE_SCHEMA_VERSION) return input as WorkspacePackageManifest;
  if (value.schemaVersion === "0.1.0" && value.workspaceManifest && Array.isArray(value.files)) {
    return { ...(input as Omit<WorkspacePackageManifest, "schemaVersion">), schemaVersion: WORKSPACE_PACKAGE_SCHEMA_VERSION };
  }
  throw new Error(`Unsupported workspace package schema ${String(value.schemaVersion)}.`);
}

function fileEntry(path: string, kind: WorkspacePackageFile["kind"], data: Uint8Array): WorkspacePackageFile {
  return { path, kind, sha256: sha256(data), byteLength: data.byteLength };
}

function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function redactLog(log: string): string {
  return log.replace(/(authorization|cookie|api[-_]?key|token|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]");
}

function assertSafePath(path: string): void {
  if (!path || path.includes("\0") || path.split(/[\\/]/).some((segment) => segment === "..") || relative(".", path).startsWith(`..${sep}`)) throw new Error(`Unsafe workspace package path ${path}.`);
}
