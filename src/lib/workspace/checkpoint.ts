import { createHash } from "node:crypto";
import { mkdir, open, readFile, rename } from "node:fs/promises";
import { join } from "node:path";

export type CheckpointItemStatus = "pending" | "in-progress" | "committed" | "failed";
export type CheckpointRunStatus = "running" | "paused" | "complete";

export interface CheckpointItem {
  identity: string;
  status: CheckpointItemStatus;
  attempts: number;
  outputEntityIds: string[];
  updatedAt: string;
  error?: string;
}

export interface CheckpointAuditEvent {
  type: "initialized" | "committed" | "failed" | "paused" | "resumed" | "recovered";
  at: string;
  message: string;
  data?: Record<string, string | number>;
}

export interface CheckpointSnapshot {
  schemaVersion: "1.0.0";
  runId: string;
  stage: string;
  status: CheckpointRunStatus;
  createdAt: string;
  updatedAt: string;
  items: CheckpointItem[];
  auditEvents: CheckpointAuditEvent[];
  integrityHash: string;
}

export interface CheckpointStoreOptions {
  directory: string;
  runId: string;
  stage: string;
  now?: () => string;
}

export class CheckpointError extends Error {
  readonly code: "invalid" | "not-found" | "unsafe-transition";

  constructor(code: CheckpointError["code"], message: string) {
    super(message);
    this.name = "CheckpointError";
    this.code = code;
  }
}

/** Durable, atomic checkpoints for page-batch stages. */
export class CheckpointStore {
  private readonly path: string;
  private readonly now: () => string;
  private readonly options: CheckpointStoreOptions;
  private snapshot: CheckpointSnapshot | null = null;

  constructor(options: CheckpointStoreOptions) {
    this.options = options;
    this.path = join(options.directory, `${options.runId}.checkpoint.json`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async initialize(identities: readonly string[]): Promise<CheckpointSnapshot> {
    const unique = new Set(identities);
    if (unique.size !== identities.length || identities.some((identity) => !identity.trim())) {
      throw new CheckpointError("invalid", "Checkpoint identities must be non-empty and unique.");
    }
    const now = this.now();
    this.snapshot = this.seal({
      schemaVersion: "1.0.0",
      runId: this.options.runId,
      stage: this.options.stage,
      status: "running",
      createdAt: now,
      updatedAt: now,
      items: identities.map((identity) => ({ identity, status: "pending", attempts: 0, outputEntityIds: [], updatedAt: now })),
      auditEvents: [{ type: "initialized", at: now, message: `Initialized ${identities.length} checkpoint items.` }],
      integrityHash: "",
    });
    await this.persist();
    return this.getSnapshot();
  }

  async load(): Promise<CheckpointSnapshot> {
    let raw: string;
    try {
      raw = await readFile(this.path, "utf8");
    } catch {
      throw new CheckpointError("not-found", `Checkpoint ${this.path} does not exist.`);
    }
    let parsed: CheckpointSnapshot;
    try {
      parsed = JSON.parse(raw) as CheckpointSnapshot;
    } catch {
      throw new CheckpointError("invalid", "Checkpoint JSON is invalid.");
    }
    if (!parsed || parsed.runId !== this.options.runId || parsed.stage !== this.options.stage || parsed.integrityHash !== this.hash(parsed)) {
      throw new CheckpointError("invalid", "Checkpoint integrity or identity verification failed.");
    }
    this.snapshot = parsed;
    return this.getSnapshot();
  }

  async markRunning(identity: string): Promise<CheckpointSnapshot> {
    const snapshot = await this.ensureLoaded();
    const item = itemFor(snapshot, identity);
    if (item.status === "committed") throw new CheckpointError("unsafe-transition", `Committed item ${identity} cannot run again.`);
    item.status = "in-progress";
    item.attempts += 1;
    item.error = undefined;
    item.updatedAt = this.now();
    snapshot.status = "running";
    snapshot.updatedAt = item.updatedAt;
    await this.persist();
    return this.getSnapshot();
  }

  async commit(identity: string, outputEntityIds: readonly string[]): Promise<CheckpointSnapshot> {
    const snapshot = await this.ensureLoaded();
    const item = itemFor(snapshot, identity);
    if (item.status === "committed") return this.getSnapshot();
    const now = this.now();
    item.status = "committed";
    item.outputEntityIds = [...new Set(outputEntityIds)];
    item.updatedAt = now;
    snapshot.updatedAt = now;
    snapshot.auditEvents.push({ type: "committed", at: now, message: `Committed ${identity}.`, data: { outputCount: item.outputEntityIds.length } });
    if (snapshot.items.every((candidate) => candidate.status === "committed")) snapshot.status = "complete";
    await this.persist();
    return this.getSnapshot();
  }

  async fail(identity: string, error: string): Promise<CheckpointSnapshot> {
    const snapshot = await this.ensureLoaded();
    const item = itemFor(snapshot, identity);
    if (item.status === "committed") throw new CheckpointError("unsafe-transition", `Committed item ${identity} cannot fail.`);
    const now = this.now();
    item.status = "failed";
    item.error = error;
    item.updatedAt = now;
    snapshot.updatedAt = now;
    snapshot.auditEvents.push({ type: "failed", at: now, message: `Failed ${identity}.` });
    await this.persist();
    return this.getSnapshot();
  }

  async pause(reason = "Operator requested a safe pause."): Promise<CheckpointSnapshot> {
    const snapshot = await this.ensureLoaded();
    if (snapshot.items.some((item) => item.status === "in-progress")) {
      throw new CheckpointError("unsafe-transition", "Checkpoint cannot pause while an item is in progress.");
    }
    const now = this.now();
    snapshot.status = "paused";
    snapshot.updatedAt = now;
    snapshot.auditEvents.push({ type: "paused", at: now, message: reason });
    await this.persist();
    return this.getSnapshot();
  }

  async resume(): Promise<CheckpointSnapshot> {
    const snapshot = await this.ensureLoaded();
    const now = this.now();
    snapshot.status = "running";
    snapshot.updatedAt = now;
    snapshot.auditEvents.push({ type: "resumed", at: now, message: "Resumed from a safe checkpoint boundary." });
    await this.persist();
    return this.getSnapshot();
  }

  async recover(): Promise<CheckpointSnapshot> {
    await this.load();
    const snapshot = this.snapshot as CheckpointSnapshot;
    const interrupted = snapshot.items.filter((item) => item.status === "in-progress");
    if (!interrupted.length) return this.getSnapshot();
    const now = this.now();
    for (const item of interrupted) {
      item.status = "pending";
      item.updatedAt = now;
    }
    snapshot.status = "running";
    snapshot.updatedAt = now;
    snapshot.auditEvents.push({ type: "recovered", at: now, message: `Recovered ${interrupted.length} in-progress item(s) as pending.`, data: { count: interrupted.length } });
    await this.persist();
    return this.getSnapshot();
  }

  get resumableIdentities(): string[] {
    return (this.snapshot?.items ?? []).filter((item) => item.status === "pending" || item.status === "failed").map((item) => item.identity);
  }

  getSnapshot(): CheckpointSnapshot {
    if (!this.snapshot) throw new CheckpointError("not-found", "Checkpoint has not been initialized or loaded.");
    return structuredClone(this.snapshot);
  }

  private async ensureLoaded(): Promise<CheckpointSnapshot> {
    if (this.snapshot) return this.snapshot;
    return this.load();
  }

  private async persist(): Promise<void> {
    if (!this.snapshot) throw new CheckpointError("not-found", "Checkpoint has not been initialized.");
    this.snapshot = this.seal(this.snapshot);
    await mkdir(this.options.directory, { recursive: true });
    const temp = `${this.path}.${process.pid}.${Date.now()}.tmp`;
    const serialized = JSON.stringify(this.seal(this.snapshot), null, 2);
    const handle = await open(temp, "w", 0o600);
    try {
      await handle.writeFile(serialized, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temp, this.path);
  }

  private seal(snapshot: CheckpointSnapshot): CheckpointSnapshot {
    const sealed = { ...snapshot, items: snapshot.items.map((item) => ({ ...item, outputEntityIds: [...item.outputEntityIds] })), integrityHash: "" };
    return { ...sealed, integrityHash: this.hash(sealed) };
  }

  private hash(snapshot: CheckpointSnapshot): string {
    const copy = { ...snapshot, integrityHash: "" };
    return createHash("sha256").update(JSON.stringify(copy)).digest("hex");
  }
}

function itemFor(snapshot: CheckpointSnapshot, identity: string): CheckpointItem {
  const item = snapshot.items.find((candidate) => candidate.identity === identity);
  if (!item) throw new CheckpointError("not-found", `Checkpoint item ${identity} does not exist.`);
  return item;
}
