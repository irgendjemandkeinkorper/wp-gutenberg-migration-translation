import type { MigrationException } from "../exceptions/lifecycle";
import type { RiskFinding, RiskFindingInput } from "./risk";
import { scoreRiskFinding } from "./risk";
import type { FailedStageItem, RetryScope, SelectiveRetryPlan } from "../workspace/retry";
import { planSelectiveRetry } from "../workspace/retry";
import {
  getStageDefinition,
  WORKSPACE_ENTITY_KINDS,
  WORKSPACE_STAGE_NAMES,
  type ChangedEntity,
  type WorkspaceEntityKind,
  type WorkspaceStageName,
} from "../workspace";

export const PAGE_QA_SCHEMA_VERSION = "1.0.0" as const;

export interface SafeSourceEvidence {
  sourceSiteId: string;
  snapshotId: string;
  canonicalUrl: string;
  contentSha256: string;
  storageKey: string;
  locator: { kind: "css" | "xpath" | "structural-path"; value: string };
  range: { startOffset: number; endOffset: number };
}

export interface SemanticEvidence {
  documentId: string;
  schemaVersion: string;
  nodeCount: number;
  summary: string;
}

export interface PlacementSlotEvidence {
  slotId: string;
  sourceNodeIds: string[];
  destinationPath: string;
}

export interface PlacementEvidence {
  planId: string;
  profileId: string | null;
  profileVersion: string | null;
  basis: "authoritative" | "synthetic";
  basisLabel: string;
  evidence: string[];
  slots: PlacementSlotEvidence[];
}

export interface BlockMappingEvidence {
  sourceNodeId: string;
  destinationPath: string;
  blockName: string;
  status: "mapped" | "placeholder" | "unmapped";
  findingIds: string[];
  exceptionId: string | null;
}

export interface DestinationEvidence {
  conversionRunId: string;
  deliveryRecordId: string;
  status: "preview" | "imported" | "verified";
  referenceUrl: string | null;
  preview: { sha256: string; excerpt: string } | null;
}

export interface PageQaSnapshot {
  revisionId: string;
  recordedAt: string;
  source: SafeSourceEvidence;
  semantic: SemanticEvidence;
  placement: PlacementEvidence;
  blockMappings: BlockMappingEvidence[];
  destination: DestinationEvidence;
  findings: RiskFinding[];
  exceptions: MigrationException[];
}

export type PageQaAuditEventType = "rerun-previewed" | "rerun-confirmed" | "revision-recorded";

export interface PageQaAuditEvent {
  id: string;
  type: PageQaAuditEventType;
  at: string;
  actor: string;
  message: string;
  priorRevisionId: string;
  nextRevisionId: string | null;
  stageNames: WorkspaceStageName[];
  entityIds: string[];
  operations: RerunOperation[];
  authorizationGrantIds: string[];
}

export interface PageQaRecord {
  schemaVersion: typeof PAGE_QA_SCHEMA_VERSION;
  pageId: string;
  current: PageQaSnapshot;
  history: PageQaSnapshot[];
  audit: PageQaAuditEvent[];
}

export interface PageQaRecordInput extends Omit<PageQaRecord, "schemaVersion" | "current"> {
  current: Omit<PageQaSnapshot, "findings"> & { findings: RiskFindingInput[] };
}

export interface WorkbenchDiagnostic {
  path: string;
  code: "missing" | "invalid" | "duplicate" | "mismatch" | "unauthorized";
  message: string;
}

export class PageQaValidationError extends Error {
  readonly diagnostics: readonly WorkbenchDiagnostic[];

  constructor(message: string, diagnostics: WorkbenchDiagnostic[]) {
    super(message);
    this.name = "PageQaValidationError";
    this.diagnostics = diagnostics;
  }
}

export type RerunOperation = "recompute" | "recrawl" | "publish";
export type SensitiveRerunOperation = Exclude<RerunOperation, "recompute">;

export interface OperationAuthorization {
  grantId: string;
  operation: SensitiveRerunOperation;
  actor: string;
  grantedAt: string;
  reason: string;
}

export interface TargetedRerunRequest {
  changedEntities?: readonly ChangedEntity[];
  forceStages?: readonly WorkspaceStageName[];
  failedItems?: readonly FailedStageItem[];
  operations?: readonly RerunOperation[];
  authorizations?: readonly OperationAuthorization[];
  requestedBy: string;
  requestedAt: string;
}

export interface TargetedRerunPreview {
  previewId: string;
  pageId: string;
  revisionId: string;
  request: TargetedRerunRequest;
  plan: SelectiveRetryPlan;
  requiredAuthorizations: SensitiveRerunOperation[];
  diagnostics: WorkbenchDiagnostic[];
  canConfirm: boolean;
}

export interface TargetedRerunCommand {
  commandId: string;
  pageId: string;
  expectedRevisionId: string;
  requestedBy: string;
  confirmedBy: string;
  confirmedAt: string;
  operations: RerunOperation[];
  scopes: RetryScope[];
  authorizationGrantIds: string[];
}

export function createPageQaRecord(input: PageQaRecordInput): PageQaRecord {
  const record: PageQaRecord = {
    schemaVersion: PAGE_QA_SCHEMA_VERSION,
    pageId: input.pageId,
    current: {
      ...input.current,
      findings: input.current.findings.map(scoreRiskFinding),
    },
    history: [...input.history],
    audit: [...input.audit],
  };
  assertValidPageQaRecord(record);
  return record;
}

export function validatePageQaRecord(input: unknown): WorkbenchDiagnostic[] {
  const diagnostics: WorkbenchDiagnostic[] = [];
  if (!isRecord(input)) return [{ path: "$", code: "invalid", message: "Page QA record must be an object." }];
  if (input.schemaVersion !== PAGE_QA_SCHEMA_VERSION)
    diagnostics.push({ path: "schemaVersion", code: "invalid", message: `Expected ${PAGE_QA_SCHEMA_VERSION}.` });
  requireString(input.pageId, "pageId", diagnostics);
  if (!isRecord(input.current)) {
    diagnostics.push({ path: "current", code: "missing", message: "Current QA snapshot is required." });
    return diagnostics;
  }
  validateSnapshot(input.current, "current", input.pageId, diagnostics);
  const history = Array.isArray(input.history) ? input.history : [];
  if (!Array.isArray(input.history))
    diagnostics.push({ path: "history", code: "invalid", message: "History must be an array." });
  history.forEach((snapshot, index) => validateSnapshot(snapshot, `history[${index}]`, input.pageId, diagnostics));
  const revisions = [input.current, ...history]
    .filter(isRecord)
    .map((snapshot) => snapshot.revisionId)
    .filter((revision): revision is string => typeof revision === "string");
  duplicateValues(revisions).forEach((revision) =>
    diagnostics.push({
      path: "history",
      code: "duplicate",
      message: `Revision ${revision} is retained more than once.`,
    }),
  );
  const audit = Array.isArray(input.audit) ? input.audit : [];
  if (!Array.isArray(input.audit))
    diagnostics.push({ path: "audit", code: "invalid", message: "Audit history must be an array." });
  audit.forEach((event, index) => validateAuditEvent(event, `audit[${index}]`, revisions, diagnostics));
  return diagnostics;
}

export function assertValidPageQaRecord(input: unknown): asserts input is PageQaRecord {
  const diagnostics = validatePageQaRecord(input);
  if (diagnostics.length) throw new PageQaValidationError("Page QA record is invalid.", diagnostics);
}

export function previewTargetedRerun(record: PageQaRecord, request: TargetedRerunRequest): TargetedRerunPreview {
  assertValidPageQaRecord(record);
  const diagnostics: WorkbenchDiagnostic[] = [];
  requireString(request.requestedBy, "request.requestedBy", diagnostics);
  requireTimestamp(request.requestedAt, "request.requestedAt", diagnostics);
  const operations = unique<RerunOperation>(request.operations?.length ? request.operations : (["recompute"] as const));
  const validOperations = new Set<RerunOperation>(["recompute", "recrawl", "publish"]);
  operations.forEach((operation) => {
    if (!validOperations.has(operation))
      diagnostics.push({ path: "request.operations", code: "invalid", message: `Unknown operation ${operation}.` });
  });
  const changedEntities = request.changedEntities ?? [];
  if (!changedEntities.length && !request.forceStages?.length && !request.failedItems?.length)
    diagnostics.push({
      path: "request",
      code: "missing",
      message: "A changed entity, failed item, or forced stage is required for a targeted rerun.",
    });
  const allowed = entityIdentities(record.current);
  changedEntities.forEach((entity, index) => {
    if (!WORKSPACE_ENTITY_KINDS.includes(entity.kind))
      diagnostics.push({
        path: `request.changedEntities[${index}].kind`,
        code: "invalid",
        message: "Unknown entity kind.",
      });
    if (!entity.id || !allowed.get(entity.kind)?.has(entity.id))
      diagnostics.push({
        path: `request.changedEntities[${index}].id`,
        code: "mismatch",
        message: `Entity ${entity.id ?? "(missing)"} does not belong to page ${record.pageId}.`,
      });
  });
  const forceStages = unique([
    ...(request.forceStages ?? []),
    ...changedEntities
      .filter((entity) => !hasChangeSignal(entity))
      .flatMap((entity) =>
        WORKSPACE_STAGE_NAMES.filter((stage) => getStageDefinition(stage).inputEntityKinds.includes(entity.kind)),
      ),
  ]);
  const plan = planSelectiveRetry({
    changedEntities,
    forceStages,
    failedItems: request.failedItems,
    now: request.requestedAt,
  });
  const grants = validAuthorizations(request.authorizations ?? [], diagnostics);
  const requiredAuthorizations = operations.filter(
    (operation): operation is SensitiveRerunOperation =>
      operation !== "recompute" && !grants.some((grant) => grant.operation === operation),
  );
  requiredAuthorizations.forEach((operation) =>
    diagnostics.push({
      path: "request.authorizations",
      code: "unauthorized",
      message: `${operation} requires an external authorization grant before confirmation.`,
    }),
  );
  if (
    operations.includes("recrawl") &&
    !changedEntities.some((entity) => entity.kind === "source_site" || entity.kind === "page_snapshot")
  )
    diagnostics.push({
      path: "request.operations",
      code: "mismatch",
      message: "Recrawl requires the page source site or snapshot to be selected as the changed input.",
    });
  if (operations.includes("publish") && !plan.scopes.some((scope) => scope.stage === "delivery"))
    diagnostics.push({
      path: "request.operations",
      code: "mismatch",
      message: "Publish requires an invalidated delivery stage; no publish-only shortcut is allowed.",
    });
  return {
    previewId: `rerun-preview:${record.pageId}:${record.current.revisionId}:${request.requestedAt}`,
    pageId: record.pageId,
    revisionId: record.current.revisionId,
    request: { ...request, forceStages: forceStages.length ? forceStages : undefined, operations },
    plan,
    requiredAuthorizations,
    diagnostics,
    canConfirm: diagnostics.length === 0,
  };
}

export function confirmTargetedRerun(
  record: PageQaRecord,
  preview: TargetedRerunPreview,
  confirmedBy: string,
  confirmedAt: string,
): { record: PageQaRecord; command: TargetedRerunCommand } {
  assertValidPageQaRecord(record);
  if (preview.pageId !== record.pageId || preview.revisionId !== record.current.revisionId)
    throw new PageQaValidationError("Rerun preview is stale.", [
      { path: "preview.revisionId", code: "mismatch", message: "Preview does not match the current page revision." },
    ]);
  const canonicalPreview = previewTargetedRerun(record, preview.request);
  if (!canonicalPreview.canConfirm)
    throw new PageQaValidationError("Rerun preview cannot be confirmed.", canonicalPreview.diagnostics);
  if (
    preview.previewId !== canonicalPreview.previewId ||
    preview.canConfirm !== canonicalPreview.canConfirm ||
    JSON.stringify(preview.plan) !== JSON.stringify(canonicalPreview.plan) ||
    JSON.stringify(preview.requiredAuthorizations) !== JSON.stringify(canonicalPreview.requiredAuthorizations) ||
    JSON.stringify(preview.diagnostics) !== JSON.stringify(canonicalPreview.diagnostics)
  )
    throw new PageQaValidationError("Rerun preview was modified after it was calculated.", [
      {
        path: "preview",
        code: "mismatch",
        message: "Preview no longer matches the canonical dependency and authorization calculation.",
      },
    ]);
  const diagnostics: WorkbenchDiagnostic[] = [];
  requireString(confirmedBy, "confirmedBy", diagnostics);
  requireTimestamp(confirmedAt, "confirmedAt", diagnostics);
  if (diagnostics.length) throw new PageQaValidationError("Rerun confirmation is invalid.", diagnostics);
  const operations: RerunOperation[] = [...(canonicalPreview.request.operations ?? (["recompute"] as const))];
  const grantIds = (canonicalPreview.request.authorizations ?? [])
    .filter((grant) => operations.includes(grant.operation))
    .map((grant) => grant.grantId)
    .sort();
  const command: TargetedRerunCommand = {
    commandId: `rerun-command:${record.pageId}:${confirmedAt}`,
    pageId: record.pageId,
    expectedRevisionId: record.current.revisionId,
    requestedBy: canonicalPreview.request.requestedBy,
    confirmedBy,
    confirmedAt,
    operations,
    scopes: canonicalPreview.plan.scopes.map((scope) => ({ ...scope, entityIds: [...scope.entityIds] })),
    authorizationGrantIds: grantIds,
  };
  const stageNames = unique(command.scopes.map((scope) => scope.stage));
  const entityIds = unique(command.scopes.flatMap((scope) => scope.entityIds));
  const events: PageQaAuditEvent[] = [
    {
      id: `${canonicalPreview.previewId}:audit`,
      type: "rerun-previewed",
      at: canonicalPreview.request.requestedAt,
      actor: canonicalPreview.request.requestedBy,
      message: `Previewed invalidation of ${stageNames.length} stage(s).`,
      priorRevisionId: record.current.revisionId,
      nextRevisionId: null,
      stageNames,
      entityIds,
      operations,
      authorizationGrantIds: grantIds,
    },
    {
      id: `${command.commandId}:audit`,
      type: "rerun-confirmed",
      at: confirmedAt,
      actor: confirmedBy,
      message: `Confirmed targeted rerun for ${entityIds.length} affected entity/entities.`,
      priorRevisionId: record.current.revisionId,
      nextRevisionId: null,
      stageNames,
      entityIds,
      operations,
      authorizationGrantIds: grantIds,
    },
  ];
  return { record: { ...record, audit: [...record.audit, ...events] }, command };
}

export function recordPageQaRevision(
  record: PageQaRecord,
  next: PageQaSnapshot,
  command: TargetedRerunCommand,
  recordedAt: string,
): PageQaRecord {
  assertValidPageQaRecord(record);
  if (command.pageId !== record.pageId || command.expectedRevisionId !== record.current.revisionId)
    throw new PageQaValidationError("Rerun command is stale.", [
      { path: "command.expectedRevisionId", code: "mismatch", message: "Command does not match current revision." },
    ]);
  const candidate: PageQaRecord = {
    ...record,
    current: { ...next, recordedAt },
    history: [...record.history, record.current],
    audit: [
      ...record.audit,
      {
        id: `${command.commandId}:revision:${next.revisionId}`,
        type: "revision-recorded",
        at: recordedAt,
        actor: command.confirmedBy,
        message: `Recorded QA revision ${next.revisionId} without replacing prior evidence.`,
        priorRevisionId: record.current.revisionId,
        nextRevisionId: next.revisionId,
        stageNames: unique(command.scopes.map((scope) => scope.stage)),
        entityIds: unique(command.scopes.flatMap((scope) => scope.entityIds)),
        operations: [...command.operations],
        authorizationGrantIds: [...command.authorizationGrantIds],
      },
    ],
  };
  assertValidPageQaRecord(candidate);
  return candidate;
}

function validateSnapshot(input: unknown, path: string, pageId: unknown, diagnostics: WorkbenchDiagnostic[]): void {
  if (!isRecord(input)) {
    diagnostics.push({ path, code: "invalid", message: "QA snapshot must be an object." });
    return;
  }
  requireString(input.revisionId, `${path}.revisionId`, diagnostics);
  requireTimestamp(input.recordedAt, `${path}.recordedAt`, diagnostics);
  if (!isRecord(input.source))
    diagnostics.push({ path: `${path}.source`, code: "missing", message: "Safe source evidence is required." });
  else validateSource(input.source, `${path}.source`, diagnostics);
  if (!isRecord(input.semantic))
    diagnostics.push({ path: `${path}.semantic`, code: "missing", message: "Semantic IR evidence is required." });
  else {
    requireString(input.semantic.documentId, `${path}.semantic.documentId`, diagnostics);
    requireString(input.semantic.schemaVersion, `${path}.semantic.schemaVersion`, diagnostics);
    if (!Number.isInteger(input.semantic.nodeCount) || Number(input.semantic.nodeCount) < 1)
      diagnostics.push({
        path: `${path}.semantic.nodeCount`,
        code: "invalid",
        message: "Semantic node count must be positive.",
      });
    requireString(input.semantic.summary, `${path}.semantic.summary`, diagnostics);
  }
  if (!isRecord(input.placement))
    diagnostics.push({ path: `${path}.placement`, code: "missing", message: "Placement evidence is required." });
  else validatePlacement(input.placement, `${path}.placement`, diagnostics);
  const findings = Array.isArray(input.findings) ? input.findings : [];
  if (!Array.isArray(input.findings))
    diagnostics.push({ path: `${path}.findings`, code: "invalid", message: "Findings must be an array." });
  const findingIds = findings.filter(isRecord).map((finding) => String(finding.id ?? ""));
  duplicateValues(findingIds).forEach((id) =>
    diagnostics.push({ path: `${path}.findings`, code: "duplicate", message: `Finding ${id} is duplicated.` }),
  );
  findings.forEach((finding, index) => {
    if (!isRecord(finding))
      return diagnostics.push({
        path: `${path}.findings[${index}]`,
        code: "invalid",
        message: "Finding must be an object.",
      });
    requireString(finding.id, `${path}.findings[${index}].id`, diagnostics);
    requireString(finding.message, `${path}.findings[${index}].message`, diagnostics);
    if (typeof finding.pageId === "string" && finding.pageId !== pageId)
      diagnostics.push({
        path: `${path}.findings[${index}].pageId`,
        code: "mismatch",
        message: "Finding belongs to another page.",
      });
  });
  const exceptions = Array.isArray(input.exceptions) ? input.exceptions : [];
  if (!Array.isArray(input.exceptions))
    diagnostics.push({ path: `${path}.exceptions`, code: "invalid", message: "Exceptions must be an array." });
  const exceptionIds = exceptions.filter(isRecord).map((exception) => String(exception.id ?? ""));
  duplicateValues(exceptionIds).forEach((id) =>
    diagnostics.push({ path: `${path}.exceptions`, code: "duplicate", message: `Exception ${id} is duplicated.` }),
  );
  const placeholderIds = exceptions.filter(isRecord).map((exception) => String(exception.placeholderId ?? ""));
  duplicateValues(placeholderIds).forEach((id) =>
    diagnostics.push({ path: `${path}.exceptions`, code: "duplicate", message: `Placeholder ${id} is duplicated.` }),
  );
  const mappings = Array.isArray(input.blockMappings) ? input.blockMappings : [];
  if (!mappings.length)
    diagnostics.push({
      path: `${path}.blockMappings`,
      code: "missing",
      message: "At least one block mapping is required.",
    });
  mappings.forEach((mapping, index) =>
    validateBlockMapping(mapping, `${path}.blockMappings[${index}]`, findingIds, exceptionIds, diagnostics),
  );
  if (!isRecord(input.destination))
    diagnostics.push({ path: `${path}.destination`, code: "missing", message: "Destination evidence is required." });
  else validateDestination(input.destination, `${path}.destination`, diagnostics);
}

function validateSource(source: Record<string, unknown>, path: string, diagnostics: WorkbenchDiagnostic[]): void {
  for (const field of ["rawHtml", "sourceHtml", "html", "content"])
    if (field in source)
      diagnostics.push({
        path: `${path}.${field}`,
        code: "invalid",
        message: "Raw source content is not allowed in the QA view record.",
      });
  requireString(source.sourceSiteId, `${path}.sourceSiteId`, diagnostics);
  requireString(source.snapshotId, `${path}.snapshotId`, diagnostics);
  requireHttpUrl(source.canonicalUrl, `${path}.canonicalUrl`, diagnostics);
  requireSha256(source.contentSha256, `${path}.contentSha256`, diagnostics);
  requireString(source.storageKey, `${path}.storageKey`, diagnostics);
  if (!isRecord(source.locator))
    diagnostics.push({ path: `${path}.locator`, code: "missing", message: "Source locator is required." });
  else requireString(source.locator.value, `${path}.locator.value`, diagnostics);
  if (!isRecord(source.range))
    diagnostics.push({ path: `${path}.range`, code: "missing", message: "Source range is required." });
  else if (
    !Number.isInteger(source.range.startOffset) ||
    !Number.isInteger(source.range.endOffset) ||
    Number(source.range.startOffset) < 0 ||
    Number(source.range.endOffset) < Number(source.range.startOffset)
  )
    diagnostics.push({
      path: `${path}.range`,
      code: "invalid",
      message: "Source offsets must be ordered non-negative integers.",
    });
}

function validatePlacement(placement: Record<string, unknown>, path: string, diagnostics: WorkbenchDiagnostic[]): void {
  requireString(placement.planId, `${path}.planId`, diagnostics);
  if (placement.basis !== "authoritative" && placement.basis !== "synthetic")
    diagnostics.push({
      path: `${path}.basis`,
      code: "invalid",
      message: "Placement basis must be authoritative or synthetic.",
    });
  requireString(placement.basisLabel, `${path}.basisLabel`, diagnostics);
  if (
    placement.basis === "synthetic" &&
    !String(placement.basisLabel ?? "")
      .toLowerCase()
      .includes("synthetic")
  )
    diagnostics.push({
      path: `${path}.basisLabel`,
      code: "invalid",
      message: "Synthetic placement must be labeled explicitly.",
    });
  if (placement.basis === "authoritative") {
    requireString(placement.profileId, `${path}.profileId`, diagnostics);
    requireString(placement.profileVersion, `${path}.profileVersion`, diagnostics);
  }
  if (!Array.isArray(placement.evidence) || placement.evidence.length === 0)
    diagnostics.push({ path: `${path}.evidence`, code: "missing", message: "Placement basis requires evidence." });
  if (!Array.isArray(placement.slots))
    diagnostics.push({ path: `${path}.slots`, code: "invalid", message: "Placement slots must be an array." });
}

function validateBlockMapping(
  input: unknown,
  path: string,
  findingIds: string[],
  exceptionIds: string[],
  diagnostics: WorkbenchDiagnostic[],
): void {
  if (!isRecord(input)) {
    diagnostics.push({ path, code: "invalid", message: "Block mapping must be an object." });
    return;
  }
  requireString(input.sourceNodeId, `${path}.sourceNodeId`, diagnostics);
  requireString(input.destinationPath, `${path}.destinationPath`, diagnostics);
  requireString(input.blockName, `${path}.blockName`, diagnostics);
  if (!Array.isArray(input.findingIds))
    diagnostics.push({ path: `${path}.findingIds`, code: "invalid", message: "Finding IDs must be an array." });
  else
    input.findingIds.forEach((id) => {
      if (!findingIds.includes(String(id)))
        diagnostics.push({ path: `${path}.findingIds`, code: "mismatch", message: `Unknown finding ${String(id)}.` });
    });
  if (
    (input.status === "unmapped" || input.status === "placeholder") &&
    (!Array.isArray(input.findingIds) || input.findingIds.length === 0)
  )
    diagnostics.push({
      path: `${path}.findingIds`,
      code: "missing",
      message: "Unmapped/placeholder blocks require an actionable finding.",
    });
  if (input.status === "placeholder" && (!input.exceptionId || !exceptionIds.includes(String(input.exceptionId))))
    diagnostics.push({
      path: `${path}.exceptionId`,
      code: "mismatch",
      message: "Placeholder mapping requires a matching exception.",
    });
}

function validateDestination(
  destination: Record<string, unknown>,
  path: string,
  diagnostics: WorkbenchDiagnostic[],
): void {
  requireString(destination.conversionRunId, `${path}.conversionRunId`, diagnostics);
  requireString(destination.deliveryRecordId, `${path}.deliveryRecordId`, diagnostics);
  if (destination.referenceUrl !== null) requireHttpUrl(destination.referenceUrl, `${path}.referenceUrl`, diagnostics);
  if (destination.preview !== null) {
    if (!isRecord(destination.preview))
      diagnostics.push({ path: `${path}.preview`, code: "invalid", message: "Destination preview must be an object." });
    else {
      requireSha256(destination.preview.sha256, `${path}.preview.sha256`, diagnostics);
      if (typeof destination.preview.excerpt !== "string" || destination.preview.excerpt.length > 4_000)
        diagnostics.push({
          path: `${path}.preview.excerpt`,
          code: "invalid",
          message: "Preview excerpt must be a bounded string.",
        });
    }
  }
  if (destination.referenceUrl === null && destination.preview === null)
    diagnostics.push({ path, code: "missing", message: "Destination preview or reference is required." });
}

function validateAuditEvent(
  input: unknown,
  path: string,
  revisions: string[],
  diagnostics: WorkbenchDiagnostic[],
): void {
  if (!isRecord(input)) {
    diagnostics.push({ path, code: "invalid", message: "Audit event must be an object." });
    return;
  }
  requireString(input.id, `${path}.id`, diagnostics);
  requireTimestamp(input.at, `${path}.at`, diagnostics);
  requireString(input.actor, `${path}.actor`, diagnostics);
  if (typeof input.priorRevisionId === "string" && !revisions.includes(input.priorRevisionId))
    diagnostics.push({
      path: `${path}.priorRevisionId`,
      code: "mismatch",
      message: "Audit event references an unknown revision.",
    });
  if (Array.isArray(input.stageNames))
    input.stageNames.forEach((stage) => {
      if (!WORKSPACE_STAGE_NAMES.includes(stage as WorkspaceStageName))
        diagnostics.push({ path: `${path}.stageNames`, code: "invalid", message: `Unknown stage ${String(stage)}.` });
    });
}

function entityIdentities(snapshot: PageQaSnapshot): Map<WorkspaceEntityKind, Set<string>> {
  const entries: Array<[WorkspaceEntityKind, string | null]> = [
    ["source_site", snapshot.source.sourceSiteId],
    ["page_snapshot", snapshot.source.snapshotId],
    ["semantic_document", snapshot.semantic.documentId],
    ["template_profile", snapshot.placement.profileId],
    ["conversion_run", snapshot.destination.conversionRunId],
    ["delivery_record", snapshot.destination.deliveryRecordId],
    ...snapshot.exceptions.map((exception): [WorkspaceEntityKind, string] => ["exception", exception.id]),
  ];
  const map = new Map<WorkspaceEntityKind, Set<string>>();
  for (const [kind, id] of entries) if (id) map.set(kind, new Set([...(map.get(kind) ?? []), id]));
  return map;
}

function validAuthorizations(
  grants: readonly OperationAuthorization[],
  diagnostics: WorkbenchDiagnostic[],
): OperationAuthorization[] {
  const valid: OperationAuthorization[] = [];
  grants.forEach((grant, index) => {
    const before = diagnostics.length;
    requireString(grant.grantId, `request.authorizations[${index}].grantId`, diagnostics);
    requireString(grant.actor, `request.authorizations[${index}].actor`, diagnostics);
    requireTimestamp(grant.grantedAt, `request.authorizations[${index}].grantedAt`, diagnostics);
    requireString(grant.reason, `request.authorizations[${index}].reason`, diagnostics);
    if (grant.operation !== "recrawl" && grant.operation !== "publish")
      diagnostics.push({
        path: `request.authorizations[${index}].operation`,
        code: "invalid",
        message: "Grant operation must be recrawl or publish.",
      });
    if (before === diagnostics.length) valid.push(grant);
  });
  return valid;
}

function requireString(value: unknown, path: string, diagnostics: WorkbenchDiagnostic[]): void {
  if (typeof value !== "string" || !value.trim())
    diagnostics.push({ path, code: "missing", message: "A non-empty string is required." });
}

function requireTimestamp(value: unknown, path: string, diagnostics: WorkbenchDiagnostic[]): void {
  if (typeof value !== "string" || !value.trim() || Number.isNaN(Date.parse(value)))
    diagnostics.push({ path, code: "invalid", message: "A valid timestamp is required." });
}

function requireSha256(value: unknown, path: string, diagnostics: WorkbenchDiagnostic[]): void {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/i.test(value))
    diagnostics.push({ path, code: "invalid", message: "A 64-character SHA-256 hex digest is required." });
}

function requireHttpUrl(value: unknown, path: string, diagnostics: WorkbenchDiagnostic[]): void {
  try {
    const url = new URL(String(value));
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported protocol");
  } catch {
    diagnostics.push({ path, code: "invalid", message: "A safe HTTP(S) URL is required." });
  }
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.filter(Boolean).forEach((value) => (seen.has(value) ? duplicates.add(value) : seen.add(value)));
  return [...duplicates].sort();
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function hasChangeSignal(entity: ChangedEntity): boolean {
  return (
    entity.previousHash !== undefined ||
    entity.currentHash !== undefined ||
    entity.previousProducerVersion !== undefined ||
    entity.currentProducerVersion !== undefined
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
