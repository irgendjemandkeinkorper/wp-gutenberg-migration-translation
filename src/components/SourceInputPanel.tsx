import type { BatchPageStatus } from "../lib/types";

export type SourceTab = "paste" | "fetch" | "batch";

export interface CrawledPage {
  url: string;
  title: string;
  html?: string;
  id?: string | number;
  parentUrl?: string;
  parentId?: string | number;
  menuOrder?: number;
}

export interface BatchState {
  status: BatchPageStatus;
  note?: string;
}

interface SourceInputPanelProps {
  tab: SourceTab;
  pastedHtml: string;
  pageUrl: string;
  selector: string;
  showAdvanced: boolean;
  skipLlm: boolean;
  targetTemplate: string;
  providerName: string;
  model: string;
  busy: boolean;
  batch: readonly CrawledPage[];
  batchFileName: string;
  batchStatus: ReadonlyMap<number, BatchState>;
  batchBusy: boolean;
  onTabChange: (tab: SourceTab) => void;
  onPastedHtmlChange: (html: string) => void;
  onPageUrlChange: (url: string) => void;
  onSelectorChange: (selector: string) => void;
  onAdvancedToggle: () => void;
  onSkipLlmChange: (skipLlm: boolean) => void;
  onTargetTemplateChange: (template: string) => void;
  onBatchFile: (file: File) => void | Promise<void>;
  onConvert: () => void | Promise<void>;
  onConvertBatch: () => void | Promise<void>;
  onCancelBatch: () => void;
  onResumeBatch: () => void | Promise<void>;
}

const GOLFNOW_TEMPLATES = [
  "Albatross",
  "Aspen",
  "Austin",
  "Dogwood",
  "Eagleton",
  "Indigo",
  "Mulberry",
  "Pine",
  "Quantum",
  "Redmond",
  "Sequoia",
  "Sunrise",
  "Sunstone",
  "Willow",
];

export function SourceInputPanel({
  tab,
  pastedHtml,
  pageUrl,
  selector,
  showAdvanced,
  skipLlm,
  targetTemplate,
  providerName,
  model,
  busy,
  batch,
  batchFileName,
  batchStatus,
  batchBusy,
  onTabChange,
  onPastedHtmlChange,
  onPageUrlChange,
  onSelectorChange,
  onAdvancedToggle,
  onSkipLlmChange,
  onTargetTemplateChange,
  onBatchFile,
  onConvert,
  onConvertBatch,
  onCancelBatch,
  onResumeBatch,
}: SourceInputPanelProps) {
  // ⚡ Bolt: Avoid Array.from and O(N^2) object spread inside reducer for frequent UI updates
  const batchCounts: Record<BatchPageStatus, number> = { pending: 0, converting: 0, done: 0, error: 0, cancelled: 0 };
  for (const item of batchStatus.values()) {
    batchCounts[item.status]++;
  }
  const canResume = batchCounts.error > 0 || batchCounts.cancelled > 0;

  let isConvertDisabled = false;
  let convertDisabledReason = "";
  if (tab === "paste" && !pastedHtml.trim()) {
    isConvertDisabled = true;
    convertDisabledReason = "Please paste HTML source to convert";
  } else if (tab === "fetch" && !pageUrl.trim()) {
    isConvertDisabled = true;
    convertDisabledReason = "Please enter a URL to fetch";
  }

  return (
    <section className="panel source-panel">
      <div className="panel-heading source-heading">
        <div>
          <p className="section-kicker">01 · Source</p>
          <h2>Prepare a page for conversion</h2>
          <p>Paste one page, fetch a URL, or load a local crawl for a full-site batch.</p>
        </div>
        <span className="template-chip">{targetTemplate || "Template not selected"}</span>
      </div>
      <div className="tabs" role="tablist" aria-label="Source method">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "paste"}
          className={tab === "paste" ? "tab active" : "tab"}
          onClick={() => onTabChange("paste")}
        >
          Paste HTML
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "fetch"}
          className={tab === "fetch" ? "tab active" : "tab"}
          onClick={() => onTabChange("fetch")}
        >
          Fetch URL
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "batch"}
          className={tab === "batch" ? "tab active" : "tab"}
          onClick={() => onTabChange("batch")}
        >
          Batch (crawl)
        </button>
      </div>

      <div className="template-row">
        <label className="template-field">
          Target GolfNow template
          <select value={targetTemplate} onChange={(event) => onTargetTemplateChange(event.target.value)}>
            <option value="">Not selected</option>
            {GOLFNOW_TEMPLATES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <p className="hint">
          Stored with each page for implementation and QA. Compare against the{" "}
          <a href="https://golfnowbusiness.com/template-library/" target="_blank" rel="noopener noreferrer">
            template library
          </a>
          .
        </p>
      </div>

      <div className="input-stage">
        {tab === "batch" ? (
          <>
            <p className="hint">
              Crawl the site from a terminal — <code>node scripts/crawl.mjs https://example.com</code> — then load the
              resulting <code>crawl/pages.json</code> here. Every page is converted with the settings below (CSS
              selector, skip-LLM, model) and added to the WXR bundle.
            </p>
            <input
              aria-label="Load crawl JSON file"
              className="file-input"
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onBatchFile(file);
              }}
            />
            {batch.length > 0 && (
              <>
                <p className="hint">
                  {batchFileName}: {batch.length} page
                  {batch.length === 1 ? "" : "s"} loaded.
                </p>
                <ul className="bundle-list">
                  {batch.map((page, index) => {
                    const itemStatus = batchStatus.get(index);
                    return (
                      <li key={page.url}>
                        <span>
                          {itemStatus?.status === "done" && (
                            <>
                              <span aria-hidden="true">✓ </span>
                              <span className="sr-only">Done: </span>
                            </>
                          )}
                          {itemStatus?.status === "error" && (
                            <>
                              <span aria-hidden="true">✗ </span>
                              <span className="sr-only">Error: </span>
                            </>
                          )}
                          {itemStatus?.status === "converting" && (
                            <>
                              <span aria-hidden="true">… </span>
                              <span className="sr-only">Converting: </span>
                            </>
                          )}
                          {itemStatus?.status === "cancelled" && (
                            <>
                              <span aria-hidden="true">⊘ </span>
                              <span className="sr-only">Cancelled: </span>
                            </>
                          )}
                          {itemStatus?.status === "pending" && (
                            <>
                              <span aria-hidden="true">○ </span>
                              <span className="sr-only">Pending: </span>
                            </>
                          )}
                          {page.title || page.url}{" "}
                          {itemStatus?.note && <span className="muted">({itemStatus.note})</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="batch-summary" style={{ background: "var(--code-bg)" }} aria-live="polite">
                  <span>Total: {batch.length}</span>
                  <span>Completed: {batchCounts.done}</span>
                  <span>Failed: {batchCounts.error}</span>
                  <span>Cancelled: {batchCounts.cancelled}</span>
                </div>
              </>
            )}
          </>
        ) : tab === "paste" ? (
          <>
            <p className="hint">
              In your browser, open the page and use View Page Source (or copy the outerHTML from DevTools for
              JS-rendered pages), then paste it here.
            </p>
            <textarea
              aria-label="Paste HTML source code"
              value={pastedHtml}
              onChange={(event) => onPastedHtmlChange(event.target.value)}
              placeholder="<html>…</html>"
              rows={10}
            />
            <label>
              Page URL <span className="muted">(optional — resolves relative image links)</span>
              <input
                type="url"
                value={pageUrl}
                onChange={(event) => onPageUrlChange(event.target.value)}
                placeholder="https://example.com/about"
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Page URL
              <input
                type="url"
                value={pageUrl}
                onChange={(event) => onPageUrlChange(event.target.value)}
                placeholder="https://example.com/about"
              />
            </label>
            <p className="hint">
              Fetched through a public CORS proxy — works for many sites, but if it fails, use Paste HTML.
            </p>
          </>
        )}
      </div>

      <div className="conversion-options">
        <button type="button" className="disclosure-button" aria-expanded={showAdvanced} onClick={onAdvancedToggle}>
          <span aria-hidden="true">{showAdvanced ? "−" : "+"}</span>
          Advanced extraction
        </button>
        {showAdvanced && (
          <div className="advanced-fields">
            <label>
              Content CSS selector{" "}
              <span className="muted">
                (overrides automatic extraction, e.g. <code>main article</code>)
              </span>
              <input
                type="text"
                value={selector}
                onChange={(event) => onSelectorChange(event.target.value)}
                placeholder="e.g. #content .entry"
              />
            </label>
          </div>
        )}

        <label className="checkbox toggle-card">
          <input type="checkbox" checked={skipLlm} onChange={(event) => onSkipLlmChange(event.target.checked)} />
          <span>
            <strong>Local-only cleanup</strong>
            <small>Skip AI and enforce the HTML whitelist in code. Best for already-clean pages.</small>
          </span>
        </label>
      </div>

      <div className="conversion-action">
        <p>{skipLlm ? "No API call · deterministic cleanup" : `${providerName} · ${model}`}</p>
        {tab === "batch" ? (
          <div className="batch-actions">
            {batchBusy ? (
              <button type="button" className="secondary danger-text" onClick={onCancelBatch}>
                Cancel Conversion
              </button>
            ) : canResume ? (
              <button type="button" className="primary" onClick={() => void onResumeBatch()}>
                Resume Batch
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                onClick={() => void onConvertBatch()}
                disabled={batch.length === 0}
              >
                {batchCounts.done === batch.length && batch.length > 0 ? "Run Batch Again" : "Start Batch"}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="primary"
            onClick={() => void onConvert()}
            disabled={busy || isConvertDisabled}
            title={isConvertDisabled && !busy ? convertDisabledReason : undefined}
          >
            {busy ? "Converting…" : "Convert"}
          </button>
        )}
      </div>
    </section>
  );
}
