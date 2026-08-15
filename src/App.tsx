import { useEffect, useRef, useState } from "react";
import { BundleExportPanel } from "./components/BundleExportPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ResultsReviewPanel } from "./components/ResultsReviewPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { SourceInputPanel, type BatchState, type CrawledPage, type SourceTab } from "./components/SourceInputPanel";
import { useProviderSettings } from "./hooks/useProviderSettings";
import {
  addOrReplaceBundleEntry,
  loadBatchFileName,
  loadBatchPages,
  loadBatchStatus,
  loadBundle,
  saveBatchFileName,
  saveBatchPages,
  saveBatchStatus,
  saveBundle,
} from "./lib/bundle";
import { fetchPage } from "./lib/fetchPage";
import { convertPage } from "./lib/pipeline";
import type { BundlePage, PageResult, StepStatus, StepUpdate } from "./lib/types";
import { slugify } from "./lib/wxr";

const STEP_ORDER = ["Fetch", "Extract", "Images", "Clean (LLM)", "Validate", "Blocks"];
interface StepState {
  status: StepStatus;
  note?: string;
}

export default function App() {
  const [tab, setTab] = useState<SourceTab>("paste");
  const [pastedHtml, setPastedHtml] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    apiKey,
    model,
    provider,
    providerConfig,
    connectionMode,
    proxyUrl,
    proxyToken,
    setApiKey,
    setModel,
    setProvider,
    setConnectionMode,
    setProxyUrl,
    setProxyToken,
  } = useProviderSettings();
  const [skipLlm, setSkipLlm] = useState(() => localStorage.getItem("blockify.skipLlm") === "1");

  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Map<string, StepState>>(new Map());
  const [error, setError] = useState("");
  const [result, setResult] = useState<PageResult | null>(null);
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState<CrawledPage[]>(() => loadBatchPages());
  const [batchFileName, setBatchFileName] = useState(loadBatchFileName);
  const [batchStatus, setBatchStatus] = useState<Map<number, BatchState>>(
    () => new Map(Object.entries(loadBatchStatus()).map(([index, state]) => [Number(index), state])),
  );
  const [batchBusy, setBatchBusy] = useState(false);
  const cancelBatchRef = useRef(false);

  const [bundle, setBundle] = useState<BundlePage[]>(loadBundle);
  const [lastClearedBundle, setLastClearedBundle] = useState<BundlePage[] | null>(null);
  const [bundleSaveError, setBundleSaveError] = useState(false);
  const [targetTemplate, setTargetTemplate] = useState(() => localStorage.getItem("blockify.targetTemplate") ?? "");

  useEffect(() => {
    // 🎨 Palette: We intercept saveBundle failure here without setting state directly
    // within the effect body to avoid cascading renders.
    const success = saveBundle(bundle);
    if (!success) {
      setTimeout(() => setBundleSaveError(true), 0);
    } else {
      setTimeout(() => setBundleSaveError(false), 0);
    }
  }, [bundle]);
  useEffect(() => localStorage.setItem("blockify.skipLlm", skipLlm ? "1" : "0"), [skipLlm]);
  useEffect(() => localStorage.setItem("blockify.targetTemplate", targetTemplate), [targetTemplate]);
  useEffect(() => saveBatchPages(batch), [batch]);
  useEffect(() => saveBatchFileName(batchFileName), [batchFileName]);
  useEffect(() => {
    // ⚡ Bolt: Avoid Array.from allocation and object intermediate for serialization
    const statusObj: Record<string, BatchState> = {};
    for (const [index, state] of batchStatus) {
      statusObj[String(index)] = state;
    }
    saveBatchStatus(statusObj);
  }, [batchStatus]);

  function hasConversionCredentials(): boolean {
    if (skipLlm) return true;
    if (connectionMode === "proxy") {
      if (proxyUrl.trim()) return true;
      setShowSettings(true);
      setError("Add your production proxy endpoint in Settings first (or enable Local-only cleanup).");
      return false;
    }
    if (apiKey.trim()) return true;
    setShowSettings(true);
    setError(`Add your ${providerConfig.shortName} API key in Settings first.`);
    return false;
  }

  function conversionConnection() {
    return connectionMode === "proxy"
      ? { apiKey: "", proxyUrl: proxyUrl.trim(), proxyToken }
      : { apiKey, proxyUrl: undefined, proxyToken: undefined };
  }

  function onStep(u: StepUpdate) {
    setSteps((prev) => {
      const next = new Map(prev);
      next.set(u.step, { status: u.status, note: u.note });
      return next;
    });
  }

  async function convert() {
    if (!hasConversionCredentials()) return;
    setBusy(true);
    setError("");
    setResult(null);
    setSteps(new Map());
    try {
      let rawHtml = pastedHtml;
      const url = pageUrl.trim() || undefined;
      if (tab === "fetch") {
        if (!url) throw new Error("Enter a URL to fetch.");
        onStep({ step: "Fetch", status: "active" });
        rawHtml = await fetchPage(url);
        onStep({ step: "Fetch", status: "done" });
      } else if (!rawHtml.trim()) {
        throw new Error("Paste the page's HTML first.");
      }
      const res = await convertPage(
        {
          rawHtml,
          url,
          selector: selector.trim() || undefined,
          ...conversionConnection(),
          model,
          provider,
          skipLlm,
        },
        onStep,
      );
      setResult(res);
      setTitle(res.title);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSteps((prev) => {
        const next = new Map(prev);
        for (const [k, v] of next) {
          if (v.status === "active") next.set(k, { ...v, status: "error" });
        }
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  async function loadBatchFile(file: File) {
    try {
      const data: unknown = JSON.parse(await file.text());
      const pages = Array.isArray(data) ? data : (data as { pages?: unknown }).pages;
      if (
        !Array.isArray(pages) ||
        pages.length === 0 ||
        !pages.every(
          (p) => p && typeof (p as CrawledPage).url === "string" && typeof (p as CrawledPage).html === "string",
        )
      ) {
        throw new Error("expected { pages: [{ url, html }, …] }");
      }
      setBatch(
        pages.map((p) => ({
          url: (p as CrawledPage).url,
          title: typeof (p as CrawledPage).title === "string" ? (p as CrawledPage).title : "",
          html: (p as CrawledPage).html,
          id: (p as CrawledPage).id,
          parentUrl: (p as CrawledPage).parentUrl,
          parentId: (p as CrawledPage).parentId,
          menuOrder: (p as CrawledPage).menuOrder,
        })),
      );
      setBatchFileName(file.name);
      setBatchStatus(new Map());
      setError("");
    } catch (e) {
      setError(`Could not read the crawl file: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function convertBatch(resume = false) {
    if (!hasConversionCredentials()) return;
    setBatchBusy(true);
    cancelBatchRef.current = false;
    setError("");
    let runStatus = resume
      ? new Map(batchStatus)
      : new Map<number, BatchState>(batch.map((_, index) => [index, { status: "pending" }]));
    if (resume) {
      for (let index = 0; index < batch.length; index++) {
        if (runStatus.get(index)?.status !== "done") runStatus.set(index, { status: "pending" });
      }
    }
    setBatchStatus(new Map(runStatus));

    const update = (index: number, state: BatchState) => {
      runStatus = new Map(runStatus);
      runStatus.set(index, state);
      setBatchStatus(runStatus);
    };

    try {
      for (let index = 0; index < batch.length; index++) {
        if (runStatus.get(index)?.status === "done") continue;
        if (cancelBatchRef.current) {
          for (let remaining = index; remaining < batch.length; remaining++) {
            if (runStatus.get(remaining)?.status !== "done") update(remaining, { status: "cancelled" });
          }
          break;
        }

        const page = batch[index];
        update(index, { status: "converting" });
        try {
          if (!page.html) throw new Error("Reload the crawl JSON to restore this page's HTML before resuming.");
          const res = await convertPage(
            {
              rawHtml: page.html,
              url: page.url,
              selector: selector.trim() || undefined,
              ...conversionConnection(),
              model,
              provider,
              skipLlm,
            },
            () => {},
          );
          const entry: BundlePage = {
            title: res.title || page.title || "Untitled",
            link: page.url,
            contentBlocks: res.blocks,
            images: res.images.filter((asset) => asset.type === "image").map(({ src, alt }) => ({ src, alt })),
            sourceHtml: res.sourceHtml,
            targetTemplate,
            placeholders: res.placeholders,
            id: page.id,
            parentUrl: page.parentUrl,
            parentId: page.parentId,
            menuOrder: page.menuOrder,
          };
          setBundle((current) => addOrReplaceBundleEntry(current, entry));
          update(index, {
            status: "done",
            note: res.warnings.length
              ? `${res.warnings.length} warning${res.warnings.length === 1 ? "" : "s"}`
              : undefined,
          });
        } catch (e) {
          update(index, {
            status: "error",
            note: e instanceof Error ? e.message : String(e),
          });
        }
      }
    } finally {
      setBatchBusy(false);
    }
  }

  function cancelBatch() {
    cancelBatchRef.current = true;
  }

  function addToBundle() {
    if (!result) return;
    const pageTitle = title.trim() || "Untitled";
    const link = result.sourceUrl || `https://example.com/${slugify(pageTitle)}`;
    setBundle((current) =>
      addOrReplaceBundleEntry(current, {
        title: pageTitle,
        link,
        contentBlocks: result.blocks,
        images: result.images.filter((asset) => asset.type === "image").map(({ src, alt }) => ({ src, alt })),
        sourceHtml: result.sourceHtml,
        targetTemplate,
        placeholders: result.placeholders,
      }),
    );
  }

  const visibleSteps = STEP_ORDER.filter((s) => steps.has(s) || (s !== "Fetch" && (busy || steps.size > 0)));

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Blockify · Migration workspace</p>
          <h1>From legacy HTML to clean Gutenberg.</h1>
          <p className="tagline">
            Extract real content, preserve migration risks, and package polished WordPress imports without losing the
            source trail.
          </p>
          <div className="hero-flow" aria-label="Migration workflow">
            <span>HTML source</span>
            <span aria-hidden="true">→</span>
            <span>Gutenberg blocks</span>
            <span aria-hidden="true">→</span>
            <span>WXR package</span>
          </div>
        </div>
        <div className="hero-actions">
          <span className="provider-status">
            <span className="status-dot" aria-hidden="true" />
            {skipLlm
              ? "Local cleanup"
              : connectionMode === "proxy"
                ? `Production proxy · ${providerConfig.shortName}`
                : `${providerConfig.shortName} · ${model}`}
          </span>
          <button
            type="button"
            className="settings-trigger"
            aria-expanded={showSettings}
            onClick={() => setShowSettings((visible) => !visible)}
          >
            <span aria-hidden="true">⚙</span>
            AI settings
          </button>
        </div>
      </header>

      <SettingsPanel
        visible={showSettings}
        provider={provider}
        providerConfig={providerConfig}
        apiKey={apiKey}
        model={model}
        connectionMode={connectionMode}
        proxyUrl={proxyUrl}
        proxyToken={proxyToken}
        onClose={() => setShowSettings(false)}
        onProviderChange={setProvider}
        onApiKeyChange={setApiKey}
        onModelChange={setModel}
        onConnectionModeChange={setConnectionMode}
        onProxyUrlChange={setProxyUrl}
        onProxyTokenChange={setProxyToken}
      />

      <SourceInputPanel
        tab={tab}
        pastedHtml={pastedHtml}
        pageUrl={pageUrl}
        selector={selector}
        showAdvanced={showAdvanced}
        skipLlm={skipLlm}
        targetTemplate={targetTemplate}
        providerName={providerConfig.shortName}
        model={model}
        busy={busy}
        batch={batch}
        batchFileName={batchFileName}
        batchStatus={batchStatus}
        batchBusy={batchBusy}
        onTabChange={setTab}
        onPastedHtmlChange={setPastedHtml}
        onPageUrlChange={setPageUrl}
        onSelectorChange={setSelector}
        onAdvancedToggle={() => setShowAdvanced((visible) => !visible)}
        onSkipLlmChange={setSkipLlm}
        onTargetTemplateChange={setTargetTemplate}
        onBatchFile={loadBatchFile}
        onConvert={convert}
        onConvertBatch={() => convertBatch(false)}
        onCancelBatch={cancelBatch}
        onResumeBatch={() => convertBatch(true)}
      />

      {(busy || steps.size > 0) && (
        <section className="panel pipeline-panel" aria-live="polite">
          <div className="panel-heading compact">
            <div>
              <p className="section-kicker">02 · Pipeline</p>
              <h2>{busy ? "Conversion in progress" : "Conversion complete"}</h2>
            </div>
          </div>
          <ol className="steps">
            {visibleSteps.map((name) => {
              const s = steps.get(name);
              const cls = s?.status ?? "pending";
              return (
                <li key={name} className={`step ${cls}`}>
                  <span className="step-name">{name}</span>
                  {s?.note && <span className="step-note">{s.note}</span>}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {error && (
        <section className="panel error-box" role="alert">
          <strong>Conversion stopped.</strong>
          <span>{error}</span>
        </section>
      )}

      {result && (
        <ErrorBoundary onReset={() => setResult(null)}>
          <ResultsReviewPanel result={result} title={title} onTitleChange={setTitle} onAddToBundle={addToBundle} />
        </ErrorBoundary>
      )}

      <BundleExportPanel
        bundle={bundle}
        saveError={bundleSaveError}
        onRemove={(index) => setBundle((current) => current.filter((_, itemIndex) => itemIndex !== index))}
        onClear={() => {
          setLastClearedBundle(bundle);
          setBundle([]);
        }}
        canUndoClear={!!lastClearedBundle}
        onUndoClear={() => {
          if (lastClearedBundle) {
            setBundle(lastClearedBundle);
            setLastClearedBundle(null);
          }
        }}
      />
    </div>
  );
}
