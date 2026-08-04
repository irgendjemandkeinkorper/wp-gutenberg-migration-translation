import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { AcquisitionRecord, ArchivedPageSnapshot } from "./contract";

export const SOURCE_PACKAGE_SCHEMA_VERSION = "1.0.0" as const;

export interface SourcePackageFile {
  path: string;
  kind: "decoded-html" | "raw-bytes" | "acquisition-record";
  sha256: string;
  byteLength: number;
  recordId: string;
}

export interface SourceEvidencePackage {
  schemaVersion: typeof SOURCE_PACKAGE_SCHEMA_VERSION;
  createdAt: string;
  files: SourcePackageFile[];
  urlIndex: Array<{ requestedUrl: string; finalUrl: string | null; recordId: string; status: number | null }>;
  records: AcquisitionRecord[];
}

export interface BuildSourcePackageOptions {
  snapshots: readonly ArchivedPageSnapshot[];
  rawBytesByRecordId?: ReadonlyMap<string, Uint8Array>;
  createdAt?: string;
}

export interface MaterializedSourcePackage {
  manifest: SourceEvidencePackage;
  files: Record<string, Uint8Array | string>;
}

export function buildSourceEvidencePackage(options: BuildSourcePackageOptions): MaterializedSourcePackage {
  const files: Record<string, Uint8Array | string> = {};
  const fileEntries: SourcePackageFile[] = [];
  const records = options.snapshots.map((snapshot) => redactRecord(snapshot.record));
  const urlIndex = options.snapshots
    .map((snapshot) => ({
      requestedUrl: snapshot.record.requestedUrl,
      finalUrl: snapshot.record.finalUrl,
      recordId: snapshot.record.recordId,
      status: snapshot.record.status,
    }))
    .sort(
      (left, right) =>
        left.requestedUrl.localeCompare(right.requestedUrl) || left.recordId.localeCompare(right.recordId),
    );
  for (const snapshot of options.snapshots) {
    const recordId = safeSegment(snapshot.record.recordId);
    const htmlPath = `html/${recordId}.html`;
    files[htmlPath] = snapshot.decodedHtml;
    fileEntries.push(
      fileEntry(htmlPath, "decoded-html", snapshot.record.recordId, Buffer.from(snapshot.decodedHtml, "utf8")),
    );
    const recordPath = `acquisition/${recordId}.json`;
    const recordJson = JSON.stringify(redactRecord(snapshot.record), null, 2);
    files[recordPath] = recordJson;
    fileEntries.push(
      fileEntry(recordPath, "acquisition-record", snapshot.record.recordId, Buffer.from(recordJson, "utf8")),
    );
    const raw = options.rawBytesByRecordId?.get(snapshot.record.recordId);
    if (raw) {
      const rawPath = `raw/${recordId}.bin`;
      files[rawPath] = new Uint8Array(raw);
      fileEntries.push(fileEntry(rawPath, "raw-bytes", snapshot.record.recordId, raw));
    }
  }
  const manifest: SourceEvidencePackage = {
    schemaVersion: SOURCE_PACKAGE_SCHEMA_VERSION,
    createdAt: options.createdAt ?? new Date(0).toISOString(),
    files: fileEntries.sort((left, right) => left.path.localeCompare(right.path)),
    urlIndex,
    records,
  };
  return { manifest, files };
}

export async function writeSourceEvidencePackage(
  directory: string,
  packageData: MaterializedSourcePackage,
): Promise<void> {
  await mkdir(directory, { recursive: true });
  for (const [path, data] of Object.entries(packageData.files)) {
    assertSafeRelativePath(path);
    const target = join(directory, path);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, data);
  }
  const manifestPath = join(directory, "manifest.json");
  const temporary = `${manifestPath}.tmp`;
  await writeFile(temporary, JSON.stringify(packageData.manifest, null, 2), { mode: 0o600 });
  await rename(temporary, manifestPath);
}

export async function readSourceEvidencePackage(directory: string): Promise<MaterializedSourcePackage> {
  const manifestPath = join(directory, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as SourceEvidencePackage;
  if (manifest.schemaVersion !== SOURCE_PACKAGE_SCHEMA_VERSION)
    throw new Error(`Unsupported source package schema ${manifest.schemaVersion}.`);
  const files: Record<string, Uint8Array | string> = {};
  for (const entry of manifest.files) {
    assertSafeRelativePath(entry.path);
    const bytes = new Uint8Array(await readFile(join(directory, entry.path)));
    if (sha256(bytes) !== entry.sha256 || bytes.byteLength !== entry.byteLength)
      throw new Error(`Source package hash mismatch for ${entry.path}.`);
    files[entry.path] =
      entry.kind === "decoded-html" || entry.kind === "acquisition-record"
        ? Buffer.from(bytes).toString("utf8")
        : bytes;
  }
  return { manifest, files };
}

export function snapshotsFromSourceEvidencePackage(packageData: MaterializedSourcePackage): ArchivedPageSnapshot[] {
  return packageData.manifest.records
    .filter((record) => record.recordKind === "page-snapshot" && record.content && record.finalUrl)
    .map((record) => {
      const htmlPath = packageData.manifest.files.find(
        (file) => file.recordId === record.recordId && file.kind === "decoded-html",
      )?.path;
      const html = htmlPath ? packageData.files[htmlPath] : undefined;
      if (typeof html !== "string") throw new Error(`Missing decoded HTML for ${record.recordId}.`);
      return { record: record as ArchivedPageSnapshot["record"], decodedHtml: html };
    });
}

function redactRecord(record: AcquisitionRecord): AcquisitionRecord {
  const copy = structuredClone(record);
  copy.retrieval.responseHeaders = Object.fromEntries(
    Object.entries(copy.retrieval.responseHeaders).filter(
      ([key]) => !/authorization|cookie|set-cookie|proxy-authorization/i.test(key),
    ),
  );
  return copy;
}

function fileEntry(
  path: string,
  kind: SourcePackageFile["kind"],
  recordId: string,
  data: Uint8Array,
): SourcePackageFile {
  return { path, kind, recordId, sha256: sha256(data), byteLength: data.byteLength };
}

function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function safeSegment(value: string): string {
  const segment = value.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!segment || segment === "." || segment === "..") throw new Error("Unsafe source package record ID.");
  return segment;
}

function assertSafeRelativePath(path: string): void {
  if (
    !path ||
    path.includes("\0") ||
    path.split(/[\\/]/).some((segment) => segment === "..") ||
    relative(".", path).startsWith(`..${sep}`)
  ) {
    throw new Error(`Unsafe source package path ${path}.`);
  }
}
