import { useMemo, useState } from "react";
import {
  confirmTargetedRerun,
  previewTargetedRerun,
  validatePageQaRecord,
  type OperationAuthorization,
  type PageQaRecord,
  type RerunOperation,
  type TargetedRerunCommand,
} from "../lib/qa/workbench";
import type { RiskSeverity } from "../lib/qa/risk";
import { WORKSPACE_STAGE_NAMES, type WorkspaceEntityKind, type WorkspaceStageName } from "../lib/workspace";

interface PageQaWorkbenchProps {
  record: PageQaRecord;
  operator: string;
  authorizations?: readonly OperationAuthorization[];
  requestedAt?: string;
  now?: () => string;
  onConfirmRerun: (command: TargetedRerunCommand, auditedRecord: PageQaRecord) => void;
}

interface EntityOption {
  value: string;
  kind: WorkspaceEntityKind;
  id: string;
  label: string;
}

export function PageQaWorkbench({
  record,
  operator,
  authorizations = [],
  requestedAt,
  now = () => new Date().toISOString(),
  onConfirmRerun,
}: PageQaWorkbenchProps) {
  const diagnostics = useMemo(() => validatePageQaRecord(record), [record]);
  const entityOptions = useMemo(() => rerunnableEntities(record), [record]);
  const [selectedEntityValue, setSelectedEntityValue] = useState(() => entityOptions[0]?.value ?? "");
  const [forceStage, setForceStage] = useState<WorkspaceStageName | "">("");
  const [requestRecrawl, setRequestRecrawl] = useState(false);
  const [requestPublish, setRequestPublish] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<RiskSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("all");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [requestTimestamp] = useState(requestedAt ?? now);
  const selectedEntity = entityOptions.find((option) => option.value === selectedEntityValue) ?? entityOptions[0];

  const preview = useMemo(() => {
    if (diagnostics.length || !selectedEntity) return null;
    const operations: RerunOperation[] = ["recompute"];
    if (requestRecrawl) operations.push("recrawl");
    if (requestPublish) operations.push("publish");
    return previewTargetedRerun(record, {
      requestedBy: operator,
      requestedAt: requestTimestamp,
      changedEntities: [{ kind: selectedEntity.kind, id: selectedEntity.id }],
      forceStages: forceStage ? [forceStage] : undefined,
      operations,
      authorizations,
    });
  }, [
    authorizations,
    diagnostics.length,
    forceStage,
    operator,
    record,
    requestPublish,
    requestRecrawl,
    requestTimestamp,
    selectedEntity,
  ]);

  const findings = [...record.current.findings]
    .filter((finding) => severityFilter === "all" || finding.severity === severityFilter)
    .filter(
      (finding) =>
        statusFilter === "all" ||
        (statusFilter === "open" ? finding.status !== "resolved" : finding.status === "resolved"),
    )
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));

  function confirm() {
    if (!preview) return;
    const confirmed = confirmTargetedRerun(record, preview, operator, now());
    onConfirmRerun(confirmed.command, confirmed.record);
    setConfirmationMessage(`Rerun command ${confirmed.command.commandId} recorded; no work was started implicitly.`);
  }

  return (
    <section className="panel qa-workbench" aria-labelledby="qa-workbench-title">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">QA workbench</p>
          <h2 id="qa-workbench-title">Page evidence and targeted rerun</h2>
          <p>
            Page <code>{record.pageId}</code> · revision <code>{record.current.revisionId}</code>
          </p>
        </div>
        <span className="result-badge">
          {
            record.current.findings.filter(
              (finding) => finding.severity === "blocking" && finding.status !== "resolved",
            ).length
          }{" "}
          blocking
        </span>
      </div>

      {diagnostics.length > 0 && (
        <div className="error-box" role="alert">
          <strong>QA record is invalid; rerun controls are disabled.</strong>
          <ul>
            {diagnostics.map((diagnostic) => (
              <li key={`${diagnostic.path}-${diagnostic.code}-${diagnostic.message}`}>
                <code>{diagnostic.path}</code>: {diagnostic.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details open>
        <summary>Saved source evidence</summary>
        <dl>
          <dt>Snapshot</dt>
          <dd>{record.current.source.snapshotId}</dd>
          <dt>Canonical URL</dt>
          <dd>{record.current.source.canonicalUrl}</dd>
          <dt>Content SHA-256</dt>
          <dd>
            <code>{record.current.source.contentSha256}</code>
          </dd>
          <dt>Storage reference</dt>
          <dd>
            <code>{record.current.source.storageKey}</code>
          </dd>
          <dt>Locator/range</dt>
          <dd>
            {record.current.source.locator.kind}: <code>{record.current.source.locator.value}</code> ·{" "}
            {record.current.source.range.startOffset}–{record.current.source.range.endOffset}
          </dd>
        </dl>
        <p className="hint">Raw source HTML is intentionally not exposed by this view record.</p>
      </details>

      <details open>
        <summary>Semantic IR and placement plan</summary>
        <p>
          IR <code>{record.current.semantic.documentId}</code> · schema {record.current.semantic.schemaVersion} ·{" "}
          {record.current.semantic.nodeCount} nodes
        </p>
        <p>{record.current.semantic.summary}</p>
        <p>
          Plan <code>{record.current.placement.planId}</code> · <strong>{record.current.placement.basisLabel}</strong>
          {record.current.placement.profileId && (
            <>
              {" "}
              · profile <code>{record.current.placement.profileId}</code> {record.current.placement.profileVersion}
            </>
          )}
        </p>
        <ul>
          {record.current.placement.slots.map((slot) => (
            <li key={slot.slotId}>
              <code>{slot.slotId}</code> → <code>{slot.destinationPath}</code> ({slot.sourceNodeIds.length} source node
              {slot.sourceNodeIds.length === 1 ? "" : "s"})
            </li>
          ))}
        </ul>
      </details>

      <details open>
        <summary>Block mapping</summary>
        <div className="table-scroll">
          <table className="images-table">
            <thead>
              <tr>
                <th>Source node</th>
                <th>Destination</th>
                <th>Block</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {record.current.blockMappings.map((mapping) => (
                <tr key={`${mapping.sourceNodeId}-${mapping.destinationPath}`}>
                  <td>{mapping.sourceNodeId}</td>
                  <td>{mapping.destinationPath}</td>
                  <td>{mapping.blockName}</td>
                  <td>{mapping.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details open>
        <summary>Destination preview/reference</summary>
        <p>
          {record.current.destination.status} delivery <code>{record.current.destination.deliveryRecordId}</code>
        </p>
        {record.current.destination.referenceUrl && (
          <p>
            <a href={record.current.destination.referenceUrl} target="_blank" rel="noreferrer">
              Open destination reference
            </a>
          </p>
        )}
        {record.current.destination.preview && (
          <pre className="code-view">{record.current.destination.preview.excerpt}</pre>
        )}
      </details>

      <details open>
        <summary>Findings ({record.current.findings.length})</summary>
        <div className="row wrap">
          <label>
            Severity
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as RiskSeverity | "all")}
            >
              <option value="all">all</option>
              <option value="blocking">blocking</option>
              <option value="warning">warning</option>
              <option value="info">info</option>
            </select>
          </label>
          <label>
            State
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            >
              <option value="all">all</option>
              <option value="open">needs review</option>
              <option value="resolved">resolved</option>
            </select>
          </label>
        </div>
        <ul>
          {findings.map((finding) => (
            <li key={finding.id}>
              <strong>{finding.severity}</strong> · score {finding.score} · {finding.message}{" "}
              <span className="muted">({finding.status})</span>
            </li>
          ))}
        </ul>
      </details>

      <details open>
        <summary>Exception state ({record.current.exceptions.length})</summary>
        <ul>
          {record.current.exceptions.map((exception) => (
            <li key={exception.id}>
              <code>{exception.placeholderId}</code> · {exception.status} · {exception.remediation}
            </li>
          ))}
        </ul>
      </details>

      <details>
        <summary>
          Prior revisions and audit ({record.history.length} revision{record.history.length === 1 ? "" : "s"},{" "}
          {record.audit.length} event
          {record.audit.length === 1 ? "" : "s"})
        </summary>
        <ul>
          {record.history.map((snapshot) => (
            <li key={snapshot.revisionId}>
              Revision <code>{snapshot.revisionId}</code> retained from {snapshot.recordedAt}
            </li>
          ))}
          {record.audit.map((event) => (
            <li key={event.id}>
              {event.at} · {event.type} · {event.message}
            </li>
          ))}
        </ul>
      </details>

      <div className="conversion-options">
        <h3>Targeted rerun</h3>
        <label>
          Changed/failed input
          <select value={selectedEntity?.value ?? ""} onChange={(event) => setSelectedEntityValue(event.target.value)}>
            {entityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Force one stage <span className="muted">(optional)</span>
          <select value={forceStage} onChange={(event) => setForceStage(event.target.value as WorkspaceStageName | "")}>
            <option value="">automatic dependency invalidation</option>
            {WORKSPACE_STAGE_NAMES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={requestRecrawl}
            onChange={(event) => setRequestRecrawl(event.target.checked)}
          />
          Request recrawl
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={requestPublish}
            onChange={(event) => setRequestPublish(event.target.checked)}
          />
          Request publish
        </label>

        {preview && (
          <div aria-live="polite">
            <strong>Invalidation preview</strong>
            <ul>
              {preview.plan.scopes.map((scope) => (
                <li key={`${scope.stage}-${scope.reason}`}>
                  {scope.stage} · {scope.reason} · {scope.entityIds.length} affected entity/entities
                </li>
              ))}
            </ul>
            {preview.diagnostics.length > 0 && (
              <div className="warn-box" role="alert">
                {preview.diagnostics.map((diagnostic) => (
                  <p key={`${diagnostic.path}-${diagnostic.message}`}>{diagnostic.message}</p>
                ))}
              </div>
            )}
            <button type="button" className="primary" disabled={!preview.canConfirm} onClick={confirm}>
              Confirm targeted rerun
            </button>
          </div>
        )}
        {confirmationMessage && <p role="status">{confirmationMessage}</p>}
        <p className="hint">
          Confirming emits an audited rerun command only. Recrawl and publish require external grants and never execute
          implicitly.
        </p>
      </div>
    </section>
  );
}

function rerunnableEntities(record: PageQaRecord): EntityOption[] {
  const current = record.current;
  const entries: Array<[WorkspaceEntityKind, string | null, string]> = [
    ["page_snapshot", current.source.snapshotId, "Saved page snapshot"],
    ["source_site", current.source.sourceSiteId, "Source site (recrawl boundary)"],
    ["semantic_document", current.semantic.documentId, "Semantic document"],
    ["template_profile", current.placement.profileId, "Template profile"],
    ["conversion_run", current.destination.conversionRunId, "Conversion run"],
    ["delivery_record", current.destination.deliveryRecordId, "Delivery record"],
    ...current.exceptions.map((exception): [WorkspaceEntityKind, string, string] => [
      "exception",
      exception.id,
      `Exception ${exception.placeholderId}`,
    ]),
  ];
  return entries.flatMap(([kind, id, label], index) =>
    id ? [{ value: `entity-${index}`, kind, id, label: `${label} · ${id}` }] : [],
  );
}
