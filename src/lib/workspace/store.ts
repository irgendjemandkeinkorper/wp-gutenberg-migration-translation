/**
 * Node 22 workspace persistence for the E2 workspace store.
 *
 * The E1 manifest remains the portable contract. This module adds the
 * filesystem/SQLite implementation around it; it intentionally has no
 * browser or localStorage dependency.
 */

import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdir, open as openFile, readFile, readdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  JsonPrimitive,
  WORKSPACE_ENTITY_KINDS,
  WorkspaceEntity,
  WorkspaceEntityKind,
  WorkspaceManifest,
  parseWorkspaceManifest,
  serializeWorkspaceManifest,
} from "./index";

const MANIFEST_FILE = "manifest.json";
const DATABASE_FILE = "workspace.sqlite";
const BLOB_DIRECTORY = "blobs";
const SHA256_HEX = /^[0-9a-f]{64}$/;
const MAX_INDEXED_TEXT_LENGTH = 512;

export type StoreFaultPoint = "manifest-before-rename";

export type StoreFaultInjector = (point: StoreFaultPoint) => void;

export interface WorkspaceStoreOptions {
  /** Used only when opening a new root that has no persisted manifest. */
  manifest?: WorkspaceManifest;
  /** Test-only hook for proving recovery around the atomic manifest rename. */
  faultInjector?: StoreFaultInjector;
}

export interface BlobPutResult {
  hash: string;
  size: number;
  created: boolean;
  relativePath: string;
}

export interface BlobInfo {
  hash: string;
  size: number;
  verified: boolean;
  relativePath: string;
  createdAt: string;
}

export interface EntityQueryOptions {
  filters?: Record<string, JsonPrimitive>;
  identity?: string;
  contentHash?: string;
  limit?: number;
  offset?: number;
}

export interface EntityQueryResult {
  entities: WorkspaceEntity[];
  total: number;
  limit: number;
  offset: number;
}

export type WorkspaceStoreErrorCode =
  | "missing-manifest"
  | "invalid-manifest"
  | "blob-missing"
  | "blob-corrupt"
  | "blob-hash-mismatch"
  | "invalid-blob-hash"
  | "interrupted-write";

export class WorkspaceStoreError extends Error {
  readonly code: WorkspaceStoreErrorCode;

  constructor(code: WorkspaceStoreErrorCode, message: string) {
    super(message);
    this.name = "WorkspaceStoreError";
    this.code = code;
  }
}

interface EntityRow {
  serialized_json: string;
}

interface BlobRow {
  hash: string;
  size: number;
  verified: number;
  relative_path: string;
  created_at: string;
}

interface ManifestRow {
  serialized_json: string;
}

interface FieldValue {
  field: string;
  valueJson: string;
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function blobRelativePath(hash: string): string {
  return `${BLOB_DIRECTORY}/${hash.slice(0, 2)}/${hash}`;
}

function jsonValue(value: JsonPrimitive): string {
  return JSON.stringify(value);
}

function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value));
}

function collectIndexedFields(value: unknown, prefix = "", depth = 0, fields: FieldValue[] = []): FieldValue[] {
  if (depth > 4 || value === null || typeof value !== "object") return fields;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isJsonPrimitive(item) && prefix) {
        const serialized = jsonValue(item);
        if (serialized.length <= MAX_INDEXED_TEXT_LENGTH) fields.push({ field: `${prefix}[]`, valueJson: serialized });
      }
    }
    return fields;
  }
  for (const [key, child] of Object.entries(value)) {
    const field = prefix ? `${prefix}.${key}` : key;
    if (isJsonPrimitive(child)) {
      const serialized = jsonValue(child);
      if (serialized.length <= MAX_INDEXED_TEXT_LENGTH) fields.push({ field, valueJson: serialized });
    } else {
      collectIndexedFields(child, field, depth + 1, fields);
    }
  }
  return fields;
}

function normalizePageSize(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 0) throw new RangeError("Workspace query limits must be non-negative integers.");
  return Math.min(value, 10_000);
}

function normalizeOffset(value: number | undefined): number {
  if (value === undefined) return 0;
  if (!Number.isInteger(value) || value < 0) throw new RangeError("Workspace query offsets must be non-negative integers.");
  return value;
}

async function syncDirectory(directory: string): Promise<void> {
  try {
    const handle = await openFile(directory, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch {
    // Directory fsync is not available on every supported filesystem. The
    // file itself is always fsynced before rename, and SQLite is FULL sync.
  }
}

async function atomicWriteFile(
  filePath: string,
  content: string,
  faultInjector?: StoreFaultInjector,
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  let handle: Awaited<ReturnType<typeof openFile>> | undefined;
  try {
    handle = await openFile(temporaryPath, "wx");
    await handle.writeFile(content, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    faultInjector?.("manifest-before-rename");
    await rename(temporaryPath, filePath);
    await syncDirectory(dirname(filePath));
  } catch (error) {
    if (handle !== undefined) await handle.close().catch(() => undefined);
    if (error instanceof WorkspaceStoreError) throw error;
    throw error;
  }
}

function beginTransaction(database: DatabaseSync): void {
  database.exec("BEGIN IMMEDIATE");
}

function rollback(database: DatabaseSync): void {
  try {
    database.exec("ROLLBACK");
  } catch {
    // Preserve the original transaction error.
  }
}

function databaseSchema(database: DatabaseSync): void {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    CREATE TABLE IF NOT EXISTS store_manifest (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      manifest_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      serialized_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      identity TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      serialized_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (kind, identity)
    );
    CREATE INDEX IF NOT EXISTS idx_entities_kind_identity ON entities(kind, identity, id);
    CREATE INDEX IF NOT EXISTS idx_entities_kind_hash ON entities(kind, content_hash);
    CREATE TABLE IF NOT EXISTS entity_fields (
      entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      field TEXT NOT NULL,
      value_json TEXT NOT NULL,
      PRIMARY KEY (entity_id, field, value_json)
    );
    CREATE INDEX IF NOT EXISTS idx_entity_fields_lookup ON entity_fields(kind, field, value_json, entity_id);
    CREATE TABLE IF NOT EXISTS blobs (
      hash TEXT PRIMARY KEY,
      size INTEGER NOT NULL,
      verified INTEGER NOT NULL CHECK (verified IN (0, 1)),
      relative_path TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function assertWorkspaceEntity(entity: WorkspaceEntity): void {
  if (!WORKSPACE_ENTITY_KINDS.includes(entity.kind)) throw new TypeError(`Unknown workspace entity kind: ${entity.kind}`);
  if (!entity.id || !entity.identity || !entity.contentHash) throw new TypeError("Workspace entities require id, identity, and contentHash.");
}

function entityCollectionsWithReplacements(
  manifest: WorkspaceManifest,
  replacements: readonly WorkspaceEntity[],
): WorkspaceManifest {
  const replacementIds = new Set(replacements.map((entity) => entity.id));
  const entities = { ...manifest.entities };
  for (const kind of WORKSPACE_ENTITY_KINDS) {
    entities[kind] = manifest.entities[kind].filter((entity) => !replacementIds.has(entity.id));
  }
  for (const entity of replacements) entities[entity.kind] = [...entities[entity.kind], entity];
  return { ...manifest, entities };
}

export class WorkspaceStore {
  readonly rootDir: string;
  readonly databasePath: string;
  readonly manifestPath: string;
  private readonly database: DatabaseSync;
  private readonly faultInjector?: StoreFaultInjector;

  private constructor(rootDir: string, database: DatabaseSync, faultInjector?: StoreFaultInjector) {
    this.rootDir = rootDir;
    this.databasePath = join(rootDir, DATABASE_FILE);
    this.manifestPath = join(rootDir, MANIFEST_FILE);
    this.database = database;
    this.faultInjector = faultInjector;
  }

  static async open(rootDir: string, options: WorkspaceStoreOptions = {}): Promise<WorkspaceStore> {
    await mkdir(join(rootDir, BLOB_DIRECTORY), { recursive: true });
    const databasePath = join(rootDir, DATABASE_FILE);
    const database = new DatabaseSync(databasePath);
    databaseSchema(database);
    const store = new WorkspaceStore(rootDir, database, options.faultInjector);
    try {
      const existing = database.prepare("SELECT serialized_json FROM store_manifest WHERE id = 1").get() as ManifestRow | undefined;
      if (existing === undefined) {
        const initial = options.manifest ?? (await recoverManifestFile(store.manifestPath));
        if (initial === undefined) throw new WorkspaceStoreError("missing-manifest", `No workspace manifest exists at ${rootDir}.`);
        await store.commitManifest(initial, false);
      } else {
        const parsed = parseStoredManifest(existing.serialized_json);
        await store.repairManifestSnapshot(parsed);
      }
      await store.recoverOrphanBlobs();
      return store;
    } catch (error) {
      database.close();
      throw error;
    }
  }

  close(): void {
    this.database.close();
  }

  getManifest(): WorkspaceManifest {
    const row = this.database.prepare("SELECT serialized_json FROM store_manifest WHERE id = 1").get() as ManifestRow | undefined;
    if (row === undefined) throw new WorkspaceStoreError("missing-manifest", "Workspace manifest row is missing.");
    return parseStoredManifest(row.serialized_json);
  }

  async saveManifest(manifest: WorkspaceManifest): Promise<void> {
    const parsed = parseStoredManifest(serializeWorkspaceManifest(manifest));
    await this.commitManifest(parsed);
  }

  async putEntity(entity: WorkspaceEntity): Promise<void> {
    await this.putEntities([entity]);
  }

  async putEntities(entities: readonly WorkspaceEntity[]): Promise<void> {
    for (const entity of entities) assertWorkspaceEntity(entity);
    const next = entityCollectionsWithReplacements(this.getManifest(), entities);
    await this.commitManifest(parseStoredManifest(serializeWorkspaceManifest(next)));
  }

  async putBlob(data: Uint8Array, expectedHash?: string): Promise<BlobPutResult> {
    const bytes = new Uint8Array(data);
    const hash = sha256(bytes);
    if (expectedHash !== undefined && expectedHash !== hash) {
      throw new WorkspaceStoreError("blob-hash-mismatch", `Expected blob ${expectedHash}, received ${hash}.`);
    }
    const relativePath = blobRelativePath(hash);
    const absolutePath = join(this.rootDir, relativePath);
    const existing = this.database.prepare("SELECT hash, size, verified, relative_path, created_at FROM blobs WHERE hash = ?").get(hash) as BlobRow | undefined;
    if (existing !== undefined) {
      await this.verifyBlobFile(existing);
      return { hash, size: existing.size, created: false, relativePath: existing.relative_path };
    }
    await atomicWriteBytes(absolutePath, bytes);
    const now = new Date().toISOString();
    try {
      beginTransaction(this.database);
      this.database.prepare("INSERT OR IGNORE INTO blobs(hash, size, verified, relative_path, created_at) VALUES (?, ?, 1, ?, ?)").run(hash, bytes.byteLength, relativePath, now);
      this.database.exec("COMMIT");
    } catch (error) {
      rollback(this.database);
      throw error;
    }
    return { hash, size: bytes.byteLength, created: true, relativePath };
  }

  async getBlob(hash: string): Promise<Uint8Array> {
    const row = this.getBlobInfo(hash);
    await this.verifyBlobFile(row);
    return new Uint8Array(await readFile(join(this.rootDir, row.relativePath)));
  }

  getBlobInfo(hash: string): BlobInfo {
    if (!SHA256_HEX.test(hash)) throw new WorkspaceStoreError("invalid-blob-hash", `Invalid SHA-256 blob hash: ${hash}.`);
    const row = this.database.prepare("SELECT hash, size, verified, relative_path, created_at FROM blobs WHERE hash = ?").get(hash) as BlobRow | undefined;
    if (row === undefined) throw new WorkspaceStoreError("blob-missing", `Blob ${hash} is not registered.`);
    return { hash: row.hash, size: row.size, verified: row.verified === 1, relativePath: row.relative_path, createdAt: row.created_at };
  }

  blobPath(hash: string): string {
    return join(this.rootDir, blobRelativePath(hash));
  }

  async listPages(options: EntityQueryOptions = {}): Promise<EntityQueryResult> {
    return this.queryEntities("page_snapshot", options);
  }

  async listAssets(options: EntityQueryOptions = {}): Promise<EntityQueryResult> {
    return this.queryEntities("asset", options);
  }

  async listFindings(options: EntityQueryOptions = {}): Promise<EntityQueryResult> {
    return this.queryEntities("qa_finding", options);
  }

  async queryEntities(kind: WorkspaceEntityKind, options: EntityQueryOptions = {}): Promise<EntityQueryResult> {
    const { where, params } = entityWhere(kind, options);
    const limit = normalizePageSize(options.limit, 100);
    const offset = normalizeOffset(options.offset);
    const totalRow = this.database.prepare(`SELECT COUNT(*) AS total FROM entities e WHERE ${where}`).get(...params) as { total: number | bigint };
    const rows = this.database.prepare(`SELECT e.serialized_json FROM entities e WHERE ${where} ORDER BY e.identity COLLATE NOCASE ASC, e.id ASC LIMIT ? OFFSET ?`).all(...params, limit, offset) as unknown as EntityRow[];
    return {
      entities: rows.map((row) => JSON.parse(row.serialized_json) as WorkspaceEntity),
      total: Number(totalRow.total),
      limit,
      offset,
    };
  }

  async explainQuery(kind: WorkspaceEntityKind, options: EntityQueryOptions = {}): Promise<string[]> {
    const { where, params } = entityWhere(kind, options);
    const rows = this.database.prepare(`EXPLAIN QUERY PLAN SELECT e.id FROM entities e WHERE ${where}`).all(...params) as Array<{ detail: string }>;
    return rows.map((row) => row.detail);
  }

  private async commitManifest(manifest: WorkspaceManifest, useFaultInjector = true): Promise<void> {
    const serialized = serializeWorkspaceManifest(manifest);
    const parsed = parseStoredManifest(serialized);
    const timestamp = parsed.timestamps.updatedAt;
    try {
      beginTransaction(this.database);
      this.database.prepare(`
        INSERT INTO store_manifest(id, manifest_id, workspace_id, content_hash, serialized_json, updated_at)
        VALUES (1, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET manifest_id=excluded.manifest_id, workspace_id=excluded.workspace_id,
          content_hash=excluded.content_hash, serialized_json=excluded.serialized_json, updated_at=excluded.updated_at
      `).run(parsed.manifestId, parsed.workspaceId, parsed.contentHash, serialized, timestamp);
      this.database.exec("DELETE FROM entity_fields");
      this.database.exec("DELETE FROM entities");
      const entityStatement = this.database.prepare("INSERT INTO entities(id, kind, identity, content_hash, serialized_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
      const fieldStatement = this.database.prepare("INSERT OR IGNORE INTO entity_fields(entity_id, kind, field, value_json) VALUES (?, ?, ?, ?)");
      for (const kind of WORKSPACE_ENTITY_KINDS) {
        for (const entity of parsed.entities[kind]) {
          const entitySerialized = JSON.stringify(entity);
          entityStatement.run(entity.id, entity.kind, entity.identity, entity.contentHash, entitySerialized, entity.timestamps.updatedAt);
          for (const field of collectIndexedFields(entity.data)) fieldStatement.run(entity.id, entity.kind, field.field, field.valueJson);
        }
      }
      this.database.exec("COMMIT");
    } catch (error) {
      rollback(this.database);
      throw error;
    }
    try {
      await atomicWriteFile(this.manifestPath, serialized, useFaultInjector ? this.faultInjector : undefined);
    } catch (error) {
      if (error instanceof WorkspaceStoreError) throw error;
      throw new WorkspaceStoreError("interrupted-write", `Manifest snapshot could not be committed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async repairManifestSnapshot(manifest: WorkspaceManifest): Promise<void> {
    const serialized = serializeWorkspaceManifest(manifest);
    let current: string | undefined;
    try {
      current = await readFile(this.manifestPath, "utf8");
    } catch {
      // The SQLite record is the recovery source when the snapshot is absent.
    }
    if (current !== serialized) await atomicWriteFile(this.manifestPath, serialized);
    try {
      const files = await readdir(dirname(this.manifestPath));
      await Promise.all(
        files
          .filter((name) => name.startsWith(`${MANIFEST_FILE}.tmp-`))
          .map((name) => rm(join(dirname(this.manifestPath), name), { force: true })),
      );
    } catch {
      // Snapshot recovery already succeeded; stale temporary cleanup is best effort.
    }
  }

  private async verifyBlobFile(row: BlobRow | BlobInfo): Promise<void> {
    let bytes: Uint8Array;
    const relativePath = "relative_path" in row ? row.relative_path : row.relativePath;
    try {
      bytes = new Uint8Array(await readFile(join(this.rootDir, relativePath)));
    } catch (error) {
      throw new WorkspaceStoreError("blob-missing", `Blob ${row.hash} is missing: ${error instanceof Error ? error.message : String(error)}.`);
    }
    if (bytes.byteLength !== row.size || sha256(bytes) !== row.hash) {
      this.database.prepare("UPDATE blobs SET verified = 0 WHERE hash = ?").run(row.hash);
      throw new WorkspaceStoreError("blob-corrupt", `Verified blob ${row.hash} failed size or SHA-256 verification.`);
    }
  }

  private async recoverOrphanBlobs(): Promise<void> {
    const firstLevel = await readdir(join(this.rootDir, BLOB_DIRECTORY), { withFileTypes: true });
    for (const entry of firstLevel) {
      if (!entry.isDirectory() || !/^[0-9a-f]{2}$/.test(entry.name)) continue;
      const directory = join(this.rootDir, BLOB_DIRECTORY, entry.name);
      const files = await readdir(directory, { withFileTypes: true });
      for (const file of files) {
        if (!file.isFile() || !SHA256_HEX.test(file.name) || file.name.slice(0, 2) !== entry.name) continue;
        const hash = file.name;
        const registered = this.database.prepare("SELECT hash FROM blobs WHERE hash = ?").get(hash) as { hash: string } | undefined;
        if (registered !== undefined) continue;
        const bytes = new Uint8Array(await readFile(join(directory, file.name)));
        if (sha256(bytes) !== hash) continue;
        this.database.prepare("INSERT OR IGNORE INTO blobs(hash, size, verified, relative_path, created_at) VALUES (?, ?, 1, ?, ?)").run(hash, bytes.byteLength, blobRelativePath(hash), new Date().toISOString());
      }
    }
  }
}

function parseStoredManifest(serialized: string): WorkspaceManifest {
  try {
    return parseWorkspaceManifest(serialized);
  } catch (error) {
    throw new WorkspaceStoreError("invalid-manifest", `Persisted workspace manifest is invalid: ${error instanceof Error ? error.message : String(error)}.`);
  }
}

async function recoverManifestFile(manifestPath: string): Promise<WorkspaceManifest | undefined> {
  const candidates: string[] = [];
  try {
    candidates.push(await readFile(manifestPath, "utf8"));
  } catch {
    // Try recoverable temporary snapshots below.
  }
  try {
    const files = await readdir(dirname(manifestPath));
    for (const file of files.filter((name) => name.startsWith(`${MANIFEST_FILE}.tmp-`)).sort().reverse()) {
      try {
        candidates.push(await readFile(join(dirname(manifestPath), file), "utf8"));
      } catch {
        // A concurrently removed temporary file is harmless.
      }
    }
  } catch {
    return undefined;
  }
  for (const candidate of candidates) {
    try {
      return parseWorkspaceManifest(candidate);
    } catch {
      // Continue to the next complete candidate.
    }
  }
  return undefined;
}

async function atomicWriteBytes(filePath: string, data: Uint8Array): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  const handle = await openFile(temporaryPath, "wx");
  try {
    await handle.writeFile(data);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporaryPath, filePath);
  await syncDirectory(dirname(filePath));
}

function entityWhere(kind: WorkspaceEntityKind, options: EntityQueryOptions): { where: string; params: Array<string | number> } {
  const clauses = ["e.kind = ?"];
  const params: Array<string | number> = [kind];
  if (options.identity !== undefined) {
    clauses.push("e.identity = ?");
    params.push(options.identity);
  }
  if (options.contentHash !== undefined) {
    clauses.push("e.content_hash = ?");
    params.push(options.contentHash);
  }
  for (const [field, value] of Object.entries(options.filters ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
    clauses.push("EXISTS (SELECT 1 FROM entity_fields f WHERE f.entity_id = e.id AND f.kind = e.kind AND f.field = ? AND f.value_json = ?)");
    params.push(field, jsonValue(value));
  }
  return { where: clauses.join(" AND "), params };
}
