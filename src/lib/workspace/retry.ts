import {
  getStageDefinition,
  planInvalidation,
  type ChangedEntity,
  type InvalidationRequest,
  type InvalidationPlan,
  type WorkspaceStageName,
  type WorkspaceEntityKind,
} from "./index";

export interface FailedStageItem {
  stage: WorkspaceStageName;
  entityId: string;
}

export interface SelectiveRetryRequest {
  changedEntities?: readonly ChangedEntity[];
  changedStageProducers?: InvalidationRequest["changedStageProducers"];
  schemaVersionChanged?: boolean;
  forceStages?: readonly WorkspaceStageName[];
  failedItems?: readonly FailedStageItem[];
  now?: string;
}

export interface RetryScope {
  stage: WorkspaceStageName;
  entityIds: string[];
  reason: "changed-input" | "failed-item" | "dependency-invalidated" | "forced";
}

export interface RetryAuditEvent {
  type: "selective-retry-planned";
  at: string;
  message: string;
  stageNames: WorkspaceStageName[];
  entityIds: string[];
}

export interface SelectiveRetryPlan {
  invalidation: InvalidationPlan;
  scopes: RetryScope[];
  auditEvent: RetryAuditEvent;
}

/**
 * Converts the workspace dependency graph into a page/asset-scoped retry
 * plan. Unaffected entities retain their committed results and are never put
 * in a retry scope.
 */
export function planSelectiveRetry(request: SelectiveRetryRequest = {}): SelectiveRetryPlan {
  const changedEntities = request.changedEntities ?? [];
  const invalidation = planInvalidation({
    changedEntities,
    changedStageProducers: request.changedStageProducers,
    schemaVersionChanged: request.schemaVersionChanged,
    forceStages: request.forceStages,
  });
  const scopes: RetryScope[] = [];
  const changedIds = new Set(changedEntities.flatMap((entity) => entity.id ? [entity.id] : []));
  const failedByStage = new Map<WorkspaceStageName, Set<string>>();
  for (const failed of request.failedItems ?? []) {
    const ids = failedByStage.get(failed.stage) ?? new Set<string>();
    ids.add(failed.entityId);
    failedByStage.set(failed.stage, ids);
  }
  const allFailedIds = new Set([...failedByStage.values()].flatMap((ids) => [...ids]));

  for (const stageResult of invalidation.stages) {
    if (!stageResult.invalidated) continue;
    const failedIds = failedByStage.get(stageResult.stage);
    if (failedIds?.size) {
      scopes.push({ stage: stageResult.stage, entityIds: [...failedIds].sort(), reason: "failed-item" });
      continue;
    }
    const definition = getStageDefinition(stageResult.stage);
    const directIds = changedEntities
      .filter((entity) => entity.id && definition.inputEntityKinds.includes(entity.kind as WorkspaceEntityKind))
      .map((entity) => entity.id as string);
    const dependencyFailureIds = stageResult.reasons.includes("dependency-invalidated") ? [...allFailedIds] : [];
    const entityIds = [...new Set(directIds.length ? directIds : dependencyFailureIds.length ? dependencyFailureIds : [...changedIds])].sort();
    scopes.push({
      stage: stageResult.stage,
      entityIds,
      reason: request.forceStages?.includes(stageResult.stage) ? "forced" : stageResult.reasons.includes("dependency-invalidated") ? "dependency-invalidated" : "changed-input",
    });
  }
  const stageNames = scopes.map((scope) => scope.stage);
  const entityIds = [...new Set(scopes.flatMap((scope) => scope.entityIds))].sort();
  return {
    invalidation,
    scopes,
    auditEvent: {
      type: "selective-retry-planned",
      at: request.now ?? new Date(0).toISOString(),
      message: `Planned selective retry for ${stageNames.length} stage(s) and ${entityIds.length} affected entity/entities.`,
      stageNames,
      entityIds,
    },
  };
}
