import { useEffect, useState } from "react";
import { BundleExportPanel } from "./components/BundleExportPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ResultsReviewPanel } from "./components/ResultsReviewPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { SourceInputPanel, type BatchState, type CrawledPage, type SourceTab } from "./components/SourceInputPanel";
import { useProviderSettings } from "./hooks/useProviderSettings";
import { loadBundle, saveBundle } from "./lib/bundle";
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

  const { apiKey, model, provider, providerConfig, setApiKey, setModel, setProvider } = useProviderSettings();
  const [skipLlm, setSkipLlm] = useState(() => localStorage.getItem("blockify.skipLlm") === "1");

  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Map<string, StepState>>(new Map());
  const [error, setError] = useState("");
  const [result, setResult] = useState<PageResult | null>(null);
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState<CrawledPage[]>([]);
  const [batchFileName, setBatchFileName] = useState("");
  const [batchStatus, setBatchStatus] = useState<Map<number, BatchState>>(new Map());
  const [batchBusy, setBatchBusy] = useState(false);

  const [bundle, setBundle] = useState<BundlePage[]>(loadBundle);
  const [targetTemplate, setTargetTemplate] = useState(() => localStorage.getItem("blockify.targetTemplate") ?? "");

  useEffect(() => saveBundle(bundle), [bundle]);
  useEffect(() => localStorage.setItem("blockify.skipLlm", skipLlm ? "1" : "0"), [skipLlm]);
  useEffect(() => localStorage.setItem("blockify.targetTemplate", targetTemplate), [targetTemplate]);

  function onStep(u: StepUpdate) {
    setSteps((prev) => {
      const next = new Map(prev);
      next.set(u.step, { status: u.status, note: u.note });
      return next;
    });
  }

  async function convert() {
    if (!apiKey && !skipLlm) {
      setShowSettings(true);
      setError(`Add your ${providerConfig.shortName} API key in Settings first.`);
      return;
    }
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
          apiKey,
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
        })),
      );
      setBatchFileName(file.name);
      setBatchStatus(new Map());
      setError("");
    } catch (e) {
      setError(`Could not read the crawl file: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function convertBatch() {
    if (!apiKey && !skipLlm) {
      setShowSettings(true);
      setError(`Add your ${providerConfig.shortName} API key in Settings first ` + "(or enable Skip LLM).");
      return;
    }
    setBatchBusy(true);
    setError("");
    const update = (i: number, s: BatchState) => setBatchStatus((prev) => new Map(prev).set(i, s));
    for (let i = 0; i < batch.length; i++) {
      const page = batch[i];
      update(i, { status: "converting" });
      try {
        const res = await convertPage(
          {
            rawHtml: page.html,
            url: page.url,
            selector: selector.trim() || undefined,
            apiKey,
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
        };
        // Replace an existing bundle entry for the same URL so re-running a
        // batch stays idempotent.
        setBundle((prev) => {
          const at = prev.findIndex((b) => b.link === page.url);
          if (at < 0) return [...prev, entry];
          const next = [...prev];
          next[at] = entry;
          return next;
        });
        update(i, {
          status: "done",
          note: res.warnings.length
            ? `${res.warnings.length} warning${res.warnings.length === 1 ? "" : "s"}`
            : undefined,
        });
      } catch (e) {
        update(i, {
          status: "error",
          note: e instanceof Error ? e.message : String(e),
        });
      }
    }
    setBatchBusy(false);
  }

  function addToBundle() {
    if (!result) return;
    const pageTitle = title.trim() || "Untitled";
    const link = result.sourceUrl || `https://example.com/${slugify(pageTitle)}`;
    setBundle((prev) => [
      ...prev,
      {
        title: pageTitle,
        link,
        contentBlocks: result.blocks,
        images: result.images.filter((asset) => asset.type === "image").map(({ src, alt }) => ({ src, alt })),
        sourceHtml: result.sourceHtml,
        targetTemplate,
        placeholders: result.placeholders,
      },
    ]);
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
            {skipLlm ? "Local cleanup" : `${providerConfig.shortName} · ${model}`}
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
        onClose={() => setShowSettings(false)}
        onProviderChange={setProvider}
        onApiKeyChange={setApiKey}
        onModelChange={setModel}
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
        onConvertBatch={convertBatch}
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
        onRemove={(index) => setBundle((current) => current.filter((_, itemIndex) => itemIndex !== index))}
        onClear={() => setBundle([])}
      />
    </div>
  );
}
