/**
 * Portable migration-workspace contract.
 *
 * This module deliberately contains only serializable manifest types and
 * deterministic planning helpers. Persistence, locking, blobs, and SQLite
 * belong to E2 and are intentionally outside this boundary.
 */

export const WORKSPACE_MANIFEST_KIND = "blockify.migration-workspace" as const;
export const WORKSPACE_SCHEMA_VERSION = "1.0.0" as const;
export const WORKSPACE_READER_VERSION = "1.0.0" as const;

export const WORKSPACE_ENTITY_KINDS = [
  "workspace",
  "source_site",
  "page_snapshot",
  "asset",
  "semantic_document",
  "template_profile",
  "conversion_run",
  "delivery_record",
  "qa_finding",
  "exception",
] as const;

export type WorkspaceEntityKind = (typeof WORKSPACE_ENTITY_KINDS)[number];

export const WORKSPACE_STAGE_NAMES = [
  "acquisition",
  "extraction",
  "media",
  "profile",
  "placement",
  "conversion",
  "delivery",
  "reconciliation",
  "qa",
] as const;

export type WorkspaceStageName = (typeof WORKSPACE_STAGE_NAMES)[number];
export type WorkspaceStatus = "pending" | "running" | "complete" | "failed";
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface ProducerVersion {
  name: string;
  version: string;
}

export interface Provenance {
  source: string;
  method: string;
  sourceEntityIds: string[];
  evidence: string[];
}

export interface ArtifactTimestamps {
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactMetadata {
  schemaVersion: string;
  contentHash: string;
  provenance: Provenance;
  timestamps: ArtifactTimestamps;
  producer: ProducerVersion;
  dependencyHashes: Record<string, string>;
}

export interface WorkspaceEntity extends ArtifactMetadata {
  id: string;
  kind: WorkspaceEntityKind;
  /** Stable logical identity; never use an array position as identity. */
  identity: string;
  data: JsonValue;
}

export type WorkspaceEntityCollections = {
  [K in WorkspaceEntityKind]: WorkspaceEntity[];
};

export interface StageDefinition {
  name: WorkspaceStageName;
  dependsOn: readonly WorkspaceStageName[];
  inputEntityKinds: readonly WorkspaceEntityKind[];
  outputEntityKinds: readonly WorkspaceEntityKind[];
  invalidationRules: readonly InvalidationRuleCode[];
}

export type InvalidationRuleCode =
  | "input-hash-changed"
  | "input-producer-version-changed"
  | "implementation-version-changed"
  | "dependency-invalidated"
  | "schema-version-changed"
  | "missing-or-incomplete";

export interface StageRecord extends ArtifactMetadata {
  id: string;
  stage: WorkspaceStageName;
  status: WorkspaceStatus;
  inputHashes: Record<string, string>;
  dependencyStageFingerprints: Record<string, string>;
  outputEntityIds: string[];
  fingerprint: string;
}

export type StageRecords = {
  [K in WorkspaceStageName]: StageRecord | null;
};

export interface WorkspaceCompatibility {
  reader: "forward-compatible";
  minimumReaderVersion: string;
  unknownFields: "ignore";
}

export interface WorkspaceManifest extends ArtifactMetadata {
  kind: typeof WORKSPACE_MANIFEST_KIND;
  manifestId: string;
  workspaceId: string;
  compatibility: WorkspaceCompatibility;
  entities: WorkspaceEntityCollections;
  stages: StageRecords;
}

export interface CreateEntityOptions {
  kind: WorkspaceEntityKind;
  identity: string;
  data?: JsonValue;
  contentHash?: string;
  schemaVersion?: string;
  provenance?: Partial<Provenance>;
  timestamps?: ArtifactTimestamps;
  producer: ProducerVersion;
  dependencyHashes?: Record<string, string>;
  id?: string;
}

export interface CreateManifestOptions {
  workspaceId: string;
  producer: ProducerVersion;
  now?: string;
  createdAt?: string;
  entities?: Partial<WorkspaceEntityCollections>;
  stages?: Partial<StageRecords>;
  compatibility?: Partial<WorkspaceCompatibility>;
}

export interface CreateStageRecordOptions {
  stage: WorkspaceStageName;
  producer: ProducerVersion;
  inputHashes?: Record<string, string>;
  dependencyStageFingerprints?: Record<string, string>;
  outputEntityIds?: string[];
  status?: WorkspaceStatus;
  now?: string;
  provenance?: Partial<Provenance>;
  timestamps?: ArtifactTimestamps;
  dependencyHashes?: Record<string, string>;
}

export interface ManifestIssue {
  path: string;
  code: "missing" | "invalid" | "unsupported" | "duplicate" | "mismatch";
  message: string;
}

export interface ManifestValidationResult {
  valid: boolean;
  issues: ManifestIssue[];
}

export type WorkspaceManifestErrorCode =
  "invalid-json" | "corrupt-manifest" | "unsupported-schema" | "incompatible-reader";

export class WorkspaceManifestError extends Error {
  readonly code: WorkspaceManifestErrorCode;
  readonly issues: readonly ManifestIssue[];

  constructor(code: WorkspaceManifestErrorCode, message: string, issues: ManifestIssue[] = []) {
    super(message);
    this.name = "WorkspaceManifestError";
    this.code = code;
    this.issues = issues;
  }
}

export interface ChangedEntity {
  kind: WorkspaceEntityKind;
  id?: string;
  previousHash?: string;
  currentHash?: string;
  previousProducerVersion?: string;
  currentProducerVersion?: string;
}

export interface ChangedStageProducer {
  stage: WorkspaceStageName;
  previousVersion?: string;
  currentVersion?: string;
}

export interface InvalidationRequest {
  changedEntities?: readonly ChangedEntity[];
  changedStageProducers?: readonly ChangedStageProducer[];
  schemaVersionChanged?: boolean;
  forceStages?: readonly WorkspaceStageName[];
}

export type InvalidationReasonCode =
  | "input-hash-changed"
  | "input-producer-version-changed"
  | "implementation-version-changed"
  | "dependency-invalidated"
  | "schema-version-changed"
  | "forced";

export interface StageInvalidation {
  stage: WorkspaceStageName;
  invalidated: boolean;
  reasons: InvalidationReasonCode[];
}

export interface InvalidationPlan {
  stages: StageInvalidation[];
}

const STAGE_DEFINITIONS: { [K in WorkspaceStageName]: StageDefinition } = {
  acquisition: {
    name: "acquisition",
    dependsOn: [],
    inputEntityKinds: ["workspace", "source_site"],
    outputEntityKinds: ["page_snapshot"],
    invalidationRules: [
      "input-hash-changed",
      "input-producer-version-changed",
      "implementation-version-changed",
      "schema-version-changed",
      "missing-or-incomplete",
    ],
  },
  extraction: {
    name: "extraction",
    dependsOn: ["acquisition"],
    inputEntityKinds: ["page_snapshot"],
    outputEntityKinds: ["semantic_document"],
    invalidationRules: [
      "input-hash-changed",
      "input-producer-version-changed",
      "implementation-version-changed",
      "dependency-invalidated",
      "schema-version-changed",
      "missing-or-incomplete",
    ],
  },
  media: {
    name: "media",
    dependsOn: ["acquisition"],
    inputEntityKinds: ["page_snapshot", "asset"],
    outputEntityKinds: ["asset"],
    invalidationRules: [
      "input-hash-changed",
      "input-producer-version-changed",
      "implementation-version-changed",
      "dependency-invalidated",
      "schema-version-changed",
      "missing-or-incomplete",
    ],
  },
  profile: {
    name: "profile",
    dependsOn: [],
    inputEntityKinds: ["template_profile"],
    outputEntityKinds: ["template_profile"],
    invalidationRules: [
      "input-hash-changed",
      "input-producer-version-changed",
      "implementation-version-changed",
      "schema-version-changed",
      "missing-or-incomplete",
    ],
  },
  placement: {
    name: "placement",
    dependsOn: ["extraction", "media", "profile"],
    inputEntityKinds: ["semantic_document", "asset", "template_profile"],
    outputEntityKinds: [],
    invalidationRules: [
      "input-hash-changed",
      "input-producer-version-changed",
      "implementation-version-changed",
      "dependency-invalidated",
      "schema-version-changed",
      "missing-or-incomplete",
    ],
  },
  conversion: {
    name: "conversion",
    dependsOn: ["placement", "extraction", "media", "profile"],
    inputEntityKinds: ["semantic_document", "asset", "template_profile"],
    outputEntityKinds: ["conversion_run"],
    invalidationRules: [
      "input-hash-changed",
      "input-producer-version-changed",
      "implementation-version-changed",
      "dependency-invalidated",
      "schema-version-changed",
      "missing-or-incomplete",
    ],
  },
  delivery: {
    name: "delivery",
    dependsOn: ["conversion"],
    inputEntityKinds: ["conversion_run", "asset"],
    outputEntityKinds: ["delivery_record"],
    invalidationRules: [
      "input-hash-changed",
      "input-producer-version-changed",
      "implementation-version-changed",
      "dependency-invalidated",
      "schema-version-changed",
      "missing-or-incomplete",
    ],
  },
  reconciliation: {
    name: "reconciliation",
    dependsOn: ["delivery"],
    inputEntityKinds: ["delivery_record"],
    outputEntityKinds: [],
    invalidationRules: [
      "input-hash-changed",
      "input-producer-version-changed",
      "implementation-version-changed",
      "dependency-invalidated",
      "schema-version-changed",
      "missing-or-incomplete",
    ],
  },
  qa: {
    name: "qa",
    dependsOn: ["extraction", "profile", "conversion", "delivery", "reconciliation"],
    inputEntityKinds: ["semantic_document", "template_profile", "conversion_run", "delivery_record", "exception"],
    outputEntityKinds: ["qa_finding"],
    invalidationRules: [
      "input-hash-changed",
      "input-producer-version-changed",
      "implementation-version-changed",
      "dependency-invalidated",
      "schema-version-changed",
      "missing-or-incomplete",
    ],
  },
};

export const WORKSPACE_STAGE_GRAPH: Readonly<{ [K in WorkspaceStageName]: StageDefinition }> = STAGE_DEFINITIONS;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function canonicalize(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Only finite numbers can be canonicalized.");
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  throw new Error("Only JSON-compatible values can be canonicalized.");
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

/** A deterministic, portable hash for IDs and fingerprints; not a cryptographic hash. */
export function stableHash(value: unknown): string {
  const input = typeof value === "string" ? value : stableStringify(value);
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function stableEntityId(kind: WorkspaceEntityKind, identity: string): string {
  if (!nonEmptyString(identity)) throw new Error("Entity identity must be non-empty.");
  return `${kind}:${stableHash(`${kind}\u0000${identity}`)}`;
}

export function stableStageId(stage: WorkspaceStageName): string {
  return `stage:${stage}:${stableHash(stage)}`;
}

function defaultProvenance(source: string, method: string): Provenance {
  return { source, method, sourceEntityIds: [], evidence: [] };
}

function completeProvenance(source: string, method: string, provenance: Partial<Provenance> | undefined): Provenance {
  return {
    source: provenance?.source ?? source,
    method: provenance?.method ?? method,
    sourceEntityIds: [...(provenance?.sourceEntityIds ?? [])],
    evidence: [...(provenance?.evidence ?? [])],
  };
}

export function createEntityRecord(options: CreateEntityOptions): WorkspaceEntity {
  const identity = options.identity.trim();
  if (!nonEmptyString(identity)) throw new Error("Entity identity must be non-empty.");
  const id = stableEntityId(options.kind, identity);
  if (options.id !== undefined && options.id !== id) {
    throw new Error(`Entity ID ${options.id} does not match stable identity ${id}.`);
  }
  const data = options.data ?? {};
  const now = options.timestamps?.createdAt ?? new Date(0).toISOString();
  const timestamps = options.timestamps ?? { createdAt: now, updatedAt: now };
  const producer = { ...options.producer };
  return {
    id,
    kind: options.kind,
    identity,
    schemaVersion: options.schemaVersion ?? WORKSPACE_SCHEMA_VERSION,
    contentHash: options.contentHash ?? stableHash({ kind: options.kind, identity, data }),
    provenance: completeProvenance(options.kind, "workspace-contract", options.provenance),
    timestamps,
    producer,
    dependencyHashes: { ...(options.dependencyHashes ?? {}) },
    data,
  };
}

function emptyEntityCollections(): WorkspaceEntityCollections {
  return {
    workspace: [],
    source_site: [],
    page_snapshot: [],
    asset: [],
    semantic_document: [],
    template_profile: [],
    conversion_run: [],
    delivery_record: [],
    qa_finding: [],
    exception: [],
  };
}

function emptyStageRecords(): StageRecords {
  return {
    acquisition: null,
    extraction: null,
    media: null,
    profile: null,
    placement: null,
    conversion: null,
    delivery: null,
    reconciliation: null,
    qa: null,
  };
}

function sortedEntities(entities: WorkspaceEntityCollections): WorkspaceEntityCollections {
  const result = emptyEntityCollections();
  for (const kind of WORKSPACE_ENTITY_KINDS) {
    result[kind] = [...entities[kind]].sort((left, right) => left.id.localeCompare(right.id));
  }
  return result;
}

function manifestWithoutContentHash(manifest: WorkspaceManifest): Omit<WorkspaceManifest, "contentHash"> {
  const entities = emptyEntityCollections();
  for (const kind of WORKSPACE_ENTITY_KINDS) {
    entities[kind] = manifest.entities[kind].map((entity) => ({
      id: entity.id,
      kind: entity.kind,
      identity: entity.identity,
      schemaVersion: entity.schemaVersion,
      contentHash: entity.contentHash,
      provenance: entity.provenance,
      timestamps: entity.timestamps,
      producer: entity.producer,
      dependencyHashes: entity.dependencyHashes,
      data: entity.data,
    }));
  }
  const stages = emptyStageRecords();
  for (const stage of WORKSPACE_STAGE_NAMES) {
    const record = manifest.stages[stage];
    stages[stage] =
      record === null
        ? null
        : {
            id: record.id,
            stage: record.stage,
            status: record.status,
            schemaVersion: record.schemaVersion,
            contentHash: record.contentHash,
            provenance: record.provenance,
            timestamps: record.timestamps,
            producer: record.producer,
            dependencyHashes: record.dependencyHashes,
            inputHashes: record.inputHashes,
            dependencyStageFingerprints: record.dependencyStageFingerprints,
            outputEntityIds: record.outputEntityIds,
            fingerprint: record.fingerprint,
          };
  }
  return {
    kind: manifest.kind,
    manifestId: manifest.manifestId,
    workspaceId: manifest.workspaceId,
    schemaVersion: manifest.schemaVersion,
    provenance: manifest.provenance,
    timestamps: manifest.timestamps,
    producer: manifest.producer,
    dependencyHashes: manifest.dependencyHashes,
    compatibility: manifest.compatibility,
    entities,
    stages,
  };
}

export function computeManifestContentHash(manifest: WorkspaceManifest): string {
  return stableHash(manifestWithoutContentHash(manifest));
}

function sealManifest(manifest: WorkspaceManifest): WorkspaceManifest {
  const sealed: WorkspaceManifest = {
    ...manifest,
    entities: sortedEntities(manifest.entities),
    stages: { ...emptyStageRecords(), ...manifest.stages },
    contentHash: "",
  };
  return { ...sealed, contentHash: computeManifestContentHash(sealed) };
}

export function createWorkspaceManifest(options: CreateManifestOptions): WorkspaceManifest {
  const identity = options.workspaceId.trim();
  if (!nonEmptyString(identity)) throw new Error("Workspace ID must be non-empty.");
  const now = options.now ?? new Date(0).toISOString();
  const createdAt = options.createdAt ?? now;
  const compatibility: WorkspaceCompatibility = {
    reader: "forward-compatible",
    minimumReaderVersion: options.compatibility?.minimumReaderVersion ?? WORKSPACE_READER_VERSION,
    unknownFields: "ignore",
  };
  const entities = emptyEntityCollections();
  for (const kind of WORKSPACE_ENTITY_KINDS) {
    entities[kind] = [...(options.entities?.[kind] ?? [])];
  }
  const workspaceEntity = entities.workspace.find((entity) => entity.identity === identity);
  if (workspaceEntity === undefined) {
    entities.workspace.push(
      createEntityRecord({
        kind: "workspace",
        identity,
        data: { workspaceId: identity },
        provenance: { source: identity, method: "manifest" },
        producer: options.producer,
        timestamps: { createdAt, updatedAt: now },
      }),
    );
  } else if (workspaceEntity.id !== stableEntityId("workspace", identity)) {
    throw new Error("Workspace entity ID does not match workspace identity.");
  }
  const manifest: WorkspaceManifest = {
    kind: WORKSPACE_MANIFEST_KIND,
    manifestId: stableEntityId("workspace", identity),
    workspaceId: identity,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    contentHash: "",
    provenance: defaultProvenance(identity, "manifest"),
    timestamps: { createdAt, updatedAt: now },
    producer: { ...options.producer },
    dependencyHashes: {},
    compatibility,
    entities,
    stages: { ...emptyStageRecords(), ...options.stages },
  };
  return sealManifest(manifest);
}

export function computeStageFingerprint(
  stage: WorkspaceStageName,
  producer: ProducerVersion,
  inputHashes: Record<string, string> = {},
  dependencyStageFingerprints: Record<string, string> = {},
): string {
  return stableHash({
    stage,
    producer,
    inputHashes,
    dependencyStageFingerprints,
  });
}

function stageRecordWithoutContentHash(record: StageRecord): Omit<StageRecord, "contentHash"> {
  return {
    id: record.id,
    stage: record.stage,
    status: record.status,
    schemaVersion: record.schemaVersion,
    provenance: record.provenance,
    timestamps: record.timestamps,
    producer: record.producer,
    dependencyHashes: record.dependencyHashes,
    inputHashes: record.inputHashes,
    dependencyStageFingerprints: record.dependencyStageFingerprints,
    outputEntityIds: record.outputEntityIds,
    fingerprint: record.fingerprint,
  };
}

export function createStageRecord(options: CreateStageRecordOptions): StageRecord {
  const definition = STAGE_DEFINITIONS[options.stage];
  const dependencyStageFingerprints = { ...(options.dependencyStageFingerprints ?? {}) };
  const dependencyNames = new Set(definition.dependsOn);
  for (const dependency of Object.keys(dependencyStageFingerprints)) {
    if (!dependencyNames.has(dependency as WorkspaceStageName)) {
      throw new Error(`${options.stage} cannot depend on undeclared stage ${dependency}.`);
    }
  }
  const inputHashes = { ...(options.inputHashes ?? {}) };
  const fingerprint = computeStageFingerprint(
    options.stage,
    options.producer,
    inputHashes,
    dependencyStageFingerprints,
  );
  const now = options.now ?? new Date(0).toISOString();
  const record: StageRecord = {
    id: stableStageId(options.stage),
    stage: options.stage,
    status: options.status ?? "complete",
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    contentHash: "",
    provenance: completeProvenance(options.stage, "stage-run", options.provenance),
    timestamps: options.timestamps ?? { createdAt: now, updatedAt: now },
    producer: { ...options.producer },
    dependencyHashes: { ...(options.dependencyHashes ?? {}) },
    inputHashes,
    dependencyStageFingerprints,
    outputEntityIds: [...(options.outputEntityIds ?? [])],
    fingerprint,
  };
  return {
    ...record,
    contentHash: stableHash(stageRecordWithoutContentHash(record)),
  };
}

export function getStageDefinition(stage: WorkspaceStageName): StageDefinition {
  return STAGE_DEFINITIONS[stage];
}

export function topologicalStageOrder(): WorkspaceStageName[] {
  const visited = new Set<WorkspaceStageName>();
  const active = new Set<WorkspaceStageName>();
  const result: WorkspaceStageName[] = [];
  const visit = (stage: WorkspaceStageName): void => {
    if (visited.has(stage)) return;
    if (active.has(stage)) throw new Error(`Workspace stage graph contains a cycle at ${stage}.`);
    active.add(stage);
    for (const dependency of STAGE_DEFINITIONS[stage].dependsOn) visit(dependency);
    active.delete(stage);
    visited.add(stage);
    result.push(stage);
  };
  for (const stage of WORKSPACE_STAGE_NAMES) visit(stage);
  return result;
}

function addReason(
  reasons: Map<WorkspaceStageName, Set<InvalidationReasonCode>>,
  stage: WorkspaceStageName,
  reason: InvalidationReasonCode,
): void {
  const stageReasons = reasons.get(stage) ?? new Set<InvalidationReasonCode>();
  stageReasons.add(reason);
  reasons.set(stage, stageReasons);
}

export function planInvalidation(request: InvalidationRequest = {}): InvalidationPlan {
  const reasons = new Map<WorkspaceStageName, Set<InvalidationReasonCode>>();
  const changedEntities = request.changedEntities ?? [];
  const valuesDiffer = (previous: string | undefined, current: string | undefined): boolean =>
    previous !== undefined || current !== undefined ? previous !== current : false;
  for (const change of changedEntities) {
    const hashChanged = valuesDiffer(change.previousHash, change.currentHash);
    const producerChanged = valuesDiffer(change.previousProducerVersion, change.currentProducerVersion);
    for (const stage of WORKSPACE_STAGE_NAMES) {
      if (!STAGE_DEFINITIONS[stage].inputEntityKinds.includes(change.kind)) continue;
      if (hashChanged) addReason(reasons, stage, "input-hash-changed");
      if (producerChanged) addReason(reasons, stage, "input-producer-version-changed");
    }
  }
  for (const change of request.changedStageProducers ?? []) {
    if (
      change.previousVersion !== undefined &&
      change.currentVersion !== undefined &&
      change.previousVersion !== change.currentVersion
    ) {
      addReason(reasons, change.stage, "implementation-version-changed");
    }
  }
  for (const stage of request.forceStages ?? []) addReason(reasons, stage, "forced");
  if (request.schemaVersionChanged === true) {
    for (const stage of WORKSPACE_STAGE_NAMES) addReason(reasons, stage, "schema-version-changed");
  }

  const order = topologicalStageOrder();
  for (const stage of order) {
    if (STAGE_DEFINITIONS[stage].dependsOn.some((dependency) => reasons.has(dependency))) {
      addReason(reasons, stage, "dependency-invalidated");
    }
  }
  return {
    stages: order.map((stage) => ({
      stage,
      invalidated: reasons.has(stage),
      reasons: [...(reasons.get(stage) ?? [])].sort(),
    })),
  };
}

function parseVersion(value: unknown): { major: number; minor: number; patch: number } | null {
  if (typeof value !== "string") return null;
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value);
  if (match === null) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function schemaCompatibilityIssue(version: unknown, path: string): ManifestIssue | null {
  const parsed = parseVersion(version);
  if (parsed === null) {
    return { path, code: "invalid", message: "Expected a semantic version." };
  }
  const current = parseVersion(WORKSPACE_SCHEMA_VERSION);
  if (current === null || parsed.major !== current.major || parsed.minor > current.minor) {
    return {
      path,
      code: "unsupported",
      message: `Schema ${String(version)} is not readable by ${WORKSPACE_READER_VERSION}.`,
    };
  }
  return null;
}

function validateProducer(value: unknown, path: string, issues: ManifestIssue[]): void {
  if (!isRecord(value) || !nonEmptyString(value.name) || !nonEmptyString(value.version)) {
    issues.push({ path, code: "invalid", message: "Producer must have non-empty name and version." });
  }
}

function validateTimestamps(value: unknown, path: string, issues: ManifestIssue[]): void {
  if (!isRecord(value)) {
    issues.push({ path, code: "invalid", message: "Timestamps must be an object." });
    return;
  }
  for (const key of ["createdAt", "updatedAt"]) {
    if (!nonEmptyString(value[key]) || Number.isNaN(Date.parse(value[key]))) {
      issues.push({ path: `${path}.${key}`, code: "invalid", message: "Expected an ISO timestamp." });
    }
  }
}

function validateProvenance(value: unknown, path: string, issues: ManifestIssue[]): void {
  if (!isRecord(value) || !nonEmptyString(value.source) || !nonEmptyString(value.method)) {
    issues.push({ path, code: "invalid", message: "Provenance requires source and method." });
    return;
  }
  for (const key of ["sourceEntityIds", "evidence"]) {
    if (!Array.isArray(value[key]) || value[key].some((item) => !nonEmptyString(item))) {
      issues.push({ path: `${path}.${key}`, code: "invalid", message: "Expected an array of strings." });
    }
  }
}

function validateArtifactMetadata(value: Record<string, unknown>, path: string, issues: ManifestIssue[]): void {
  for (const key of ["contentHash", "schemaVersion"]) {
    if (!nonEmptyString(value[key])) {
      issues.push({ path: `${path}.${key}`, code: "missing", message: "Required non-empty string is missing." });
    }
  }
  const schemaIssue = schemaCompatibilityIssue(value.schemaVersion, `${path}.schemaVersion`);
  if (schemaIssue !== null) issues.push(schemaIssue);
  validateProducer(value.producer, `${path}.producer`, issues);
  validateTimestamps(value.timestamps, `${path}.timestamps`, issues);
  validateProvenance(value.provenance, `${path}.provenance`, issues);
  if (!isRecord(value.dependencyHashes)) {
    issues.push({ path: `${path}.dependencyHashes`, code: "invalid", message: "Expected a hash map." });
  } else if (Object.values(value.dependencyHashes).some((hash) => !nonEmptyString(hash))) {
    issues.push({ path: `${path}.dependencyHashes`, code: "invalid", message: "Dependency hashes must be strings." });
  }
}

function validateEntities(value: unknown, issues: ManifestIssue[]): value is WorkspaceEntityCollections {
  if (!isRecord(value)) {
    issues.push({ path: "entities", code: "missing", message: "Entity collections are required." });
    return false;
  }
  const seenIds = new Set<string>();
  for (const kind of WORKSPACE_ENTITY_KINDS) {
    const collection = value[kind];
    if (!Array.isArray(collection)) {
      issues.push({ path: `entities.${kind}`, code: "missing", message: "Entity collection is required." });
      continue;
    }
    for (const [index, rawEntity] of collection.entries()) {
      const path = `entities.${kind}[${index}]`;
      if (!isRecord(rawEntity)) {
        issues.push({ path, code: "invalid", message: "Entity must be an object." });
        continue;
      }
      validateArtifactMetadata(rawEntity, path, issues);
      if (rawEntity.kind !== kind) {
        issues.push({ path: `${path}.kind`, code: "mismatch", message: `Expected entity kind ${kind}.` });
      }
      if (!nonEmptyString(rawEntity.identity) || !nonEmptyString(rawEntity.id)) {
        issues.push({ path, code: "invalid", message: "Entity identity and ID are required." });
      } else {
        const expectedId = stableEntityId(kind, rawEntity.identity);
        if (rawEntity.id !== expectedId) {
          issues.push({ path: `${path}.id`, code: "mismatch", message: `Expected stable ID ${expectedId}.` });
        }
        if (seenIds.has(rawEntity.id)) {
          issues.push({ path: `${path}.id`, code: "duplicate", message: "Entity ID is duplicated." });
        }
        seenIds.add(rawEntity.id);
      }
      if (!Object.prototype.hasOwnProperty.call(rawEntity, "data")) {
        issues.push({ path: `${path}.data`, code: "missing", message: "Entity data is required." });
      }
    }
  }
  return true;
}

function validateStages(value: unknown, issues: ManifestIssue[]): value is StageRecords {
  if (!isRecord(value)) {
    issues.push({ path: "stages", code: "missing", message: "Stage records are required." });
    return false;
  }
  for (const stage of WORKSPACE_STAGE_NAMES) {
    const rawRecord = value[stage];
    if (rawRecord === null) continue;
    const path = `stages.${stage}`;
    if (!isRecord(rawRecord)) {
      issues.push({ path, code: "invalid", message: "Stage record must be an object or null." });
      continue;
    }
    validateArtifactMetadata(rawRecord, path, issues);
    if (rawRecord.stage !== stage || rawRecord.id !== stableStageId(stage)) {
      issues.push({ path, code: "mismatch", message: "Stage ID or name does not match the graph." });
    }
    if (!["pending", "running", "complete", "failed"].includes(String(rawRecord.status))) {
      issues.push({ path: `${path}.status`, code: "invalid", message: "Unknown stage status." });
    }
    if (!isRecord(rawRecord.inputHashes) || !isRecord(rawRecord.dependencyStageFingerprints)) {
      issues.push({ path, code: "invalid", message: "Stage input and dependency hashes are required maps." });
    } else {
      if (Object.values(rawRecord.inputHashes).some((hash) => !nonEmptyString(hash))) {
        issues.push({ path: `${path}.inputHashes`, code: "invalid", message: "Input hashes must be strings." });
      }
      if (Object.values(rawRecord.dependencyStageFingerprints).some((hash) => !nonEmptyString(hash))) {
        issues.push({
          path: `${path}.dependencyStageFingerprints`,
          code: "invalid",
          message: "Stage fingerprints must be strings.",
        });
      }
      const allowedDependencies = new Set(STAGE_DEFINITIONS[stage].dependsOn);
      for (const dependency of Object.keys(rawRecord.dependencyStageFingerprints)) {
        if (!allowedDependencies.has(dependency as WorkspaceStageName)) {
          issues.push({
            path: `${path}.dependencyStageFingerprints.${dependency}`,
            code: "mismatch",
            message: "Stage dependency is not declared in the graph.",
          });
        }
      }
      const expectedFingerprint = computeStageFingerprint(
        stage,
        rawRecord.producer as ProducerVersion,
        rawRecord.inputHashes as Record<string, string>,
        rawRecord.dependencyStageFingerprints as Record<string, string>,
      );
      if (rawRecord.fingerprint !== expectedFingerprint) {
        issues.push({
          path: `${path}.fingerprint`,
          code: "mismatch",
          message: "Stage fingerprint is not reproducible.",
        });
      }
    }
    if (!Array.isArray(rawRecord.outputEntityIds) || rawRecord.outputEntityIds.some((id) => !nonEmptyString(id))) {
      issues.push({ path: `${path}.outputEntityIds`, code: "invalid", message: "Expected an array of IDs." });
    }
    if (rawRecord.contentHash === stableHash(stageRecordWithoutContentHash(rawRecord as unknown as StageRecord))) {
      continue;
    }
    issues.push({ path: `${path}.contentHash`, code: "mismatch", message: "Stage content hash is not reproducible." });
  }
  return true;
}

export function validateWorkspaceManifest(value: unknown): ManifestValidationResult {
  const issues: ManifestIssue[] = [];
  if (!isRecord(value)) {
    return { valid: false, issues: [{ path: "manifest", code: "invalid", message: "Manifest must be an object." }] };
  }
  if (value.kind !== WORKSPACE_MANIFEST_KIND) {
    issues.push({ path: "kind", code: "mismatch", message: `Expected ${WORKSPACE_MANIFEST_KIND}.` });
  }
  const schemaIssue = schemaCompatibilityIssue(value.schemaVersion, "schemaVersion");
  if (schemaIssue !== null) issues.push(schemaIssue);
  for (const key of ["manifestId", "workspaceId", "contentHash"]) {
    if (!nonEmptyString(value[key]))
      issues.push({ path: key, code: "missing", message: "Required non-empty string is missing." });
  }
  if (nonEmptyString(value.workspaceId) && value.manifestId !== stableEntityId("workspace", value.workspaceId)) {
    issues.push({ path: "manifestId", code: "mismatch", message: "Manifest ID must be stable for workspace ID." });
  }
  validateArtifactMetadata(value, "manifest", issues);
  if (!isRecord(value.compatibility)) {
    issues.push({ path: "compatibility", code: "missing", message: "Compatibility policy is required." });
  } else {
    if (value.compatibility.reader !== "forward-compatible" || value.compatibility.unknownFields !== "ignore") {
      issues.push({ path: "compatibility", code: "invalid", message: "Unsupported compatibility policy." });
    }
    const minimumReader = schemaCompatibilityIssue(
      value.compatibility.minimumReaderVersion,
      "compatibility.minimumReaderVersion",
    );
    if (minimumReader !== null) issues.push(minimumReader);
  }
  validateEntities(value.entities, issues);
  validateStages(value.stages, issues);
  if (nonEmptyString(value.contentHash)) {
    try {
      const manifest = value as unknown as WorkspaceManifest;
      if (value.contentHash !== computeManifestContentHash(manifest)) {
        issues.push({ path: "contentHash", code: "mismatch", message: "Manifest content hash is not reproducible." });
      }
    } catch (error) {
      issues.push({
        path: "contentHash",
        code: "invalid",
        message: error instanceof Error ? error.message : "Manifest cannot be hashed.",
      });
    }
  }
  return { valid: issues.length === 0, issues };
}

export function assertValidWorkspaceManifest(value: unknown): asserts value is WorkspaceManifest {
  const result = validateWorkspaceManifest(value);
  if (!result.valid) {
    const unsupported = result.issues.find((issue) => issue.code === "unsupported");
    const code: WorkspaceManifestErrorCode = unsupported ? "unsupported-schema" : "corrupt-manifest";
    throw new WorkspaceManifestError(code, "Workspace manifest validation failed.", result.issues);
  }
}

export function serializeWorkspaceManifest(manifest: WorkspaceManifest): string {
  const sealed = sealManifest(manifest);
  assertValidWorkspaceManifest(sealed);
  return stableStringify(sealed);
}

export interface ParseManifestOptions {
  readerVersion?: string;
}

export function parseWorkspaceManifest(serialized: string, options: ParseManifestOptions = {}): WorkspaceManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new WorkspaceManifestError(
      "invalid-json",
      `Workspace manifest is not valid JSON: ${error instanceof Error ? error.message : "parse failed"}.`,
    );
  }
  const readerVersion = options.readerVersion ?? WORKSPACE_READER_VERSION;
  const readerCompatibility = schemaCompatibilityIssue(readerVersion, "readerVersion");
  if (readerCompatibility !== null || (parseVersion(readerVersion)?.major ?? 0) !== 1) {
    throw new WorkspaceManifestError("incompatible-reader", `Reader ${readerVersion} cannot read workspace manifests.`);
  }
  assertValidWorkspaceManifest(parsed);
  return parsed;
}

export * from "./checkpoint";
export * from "./retry";
export * from "./package";
