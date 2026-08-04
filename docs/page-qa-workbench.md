# Page QA workbench and targeted rerun (G3)

`src/lib/qa/workbench.ts` defines a versioned page evidence record and the authorization-safe targeted-rerun controller. `src/components/PageQaWorkbench.tsx` renders that record without exposing archived raw HTML.

The record links one page revision to a saved source hash and storage locator, semantic IR summary, authoritative or explicitly synthetic placement basis, source-to-block mappings, destination preview/reference, risk findings, migration exceptions, prior revisions, and audit events. Validation rejects raw source fields, unsafe URLs, unknown finding/exception references, duplicate revisions, and cross-page findings before rerun controls are enabled.

Selecting an entity previews the exact workspace stages and entity scopes that will be invalidated. An explicit selection without changed hashes is represented honestly as a forced dependency-graph invalidation; no synthetic hash is invented. Recrawl and publish remain disabled until the host supplies external `OperationAuthorization` grants. Confirmation returns a `TargetedRerunCommand` through `onConfirmRerun`; it does not crawl, convert, or publish by itself.

After the host executes a command, pass the resulting snapshot to `recordPageQaRevision`. The previous snapshot is appended to `history`, and the preview, confirmation, and revision events remain in `audit`, so changed results never silently replace earlier evidence.

The workbench is intentionally a contract-bound component rather than a legacy-result adapter. Mount it only with a `PageQaRecord` assembled from durable acquisition, workspace, placement, reconciliation, and exception artifacts; do not fabricate missing evidence from the current in-memory converter.
