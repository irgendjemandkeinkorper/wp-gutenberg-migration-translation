import { useEffect, useMemo, useState } from "react";
import { downloadFile, loadBundle, saveBundle } from "./lib/bundle";
import { fetchPage } from "./lib/fetchPage";
import { DEFAULT_PROVIDER, getProviderConfig, isLlmProvider, LLM_PROVIDERS } from "./lib/llm";
import { convertPage } from "./lib/pipeline";
import { buildWxr, slugify } from "./lib/wxr";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { LlmProvider } from "./lib/llm";
import type { BundlePage, PageResult, StepStatus, StepUpdate } from "./lib/types";

const STEP_ORDER = ["Fetch", "Extract", "Images", "Clean (LLM)", "Validate", "Blocks"];
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

interface StepState {
  status: StepStatus;
  note?: string;
}

interface CrawledPage {
  url: string;
  title: string;
  html: string;
}

interface BatchState {
  status: "converting" | "done" | "error";
  note?: string;
}

type ProviderValues = Record<LlmProvider, string>;

function initialProvider(): LlmProvider {
  const saved = localStorage.getItem("blockify.provider");
  return isLlmProvider(saved) ? saved : DEFAULT_PROVIDER;
}

function initialModels(): ProviderValues {
  const legacyGemini = localStorage.getItem("blockify.model");
  return {
    gemini: localStorage.getItem("blockify.model.gemini") || legacyGemini || getProviderConfig("gemini").defaultModel,
    anthropic: localStorage.getItem("blockify.model.anthropic") || getProviderConfig("anthropic").defaultModel,
    openai: localStorage.getItem("blockify.model.openai") || getProviderConfig("openai").defaultModel,
  };
}

function initialApiKeys(): ProviderValues {
  return {
    gemini: sessionStorage.getItem("blockify.apiKey.gemini") || localStorage.getItem("blockify.apiKey") || "",
    anthropic: sessionStorage.getItem("blockify.apiKey.anthropic") || "",
    openai: sessionStorage.getItem("blockify.apiKey.openai") || "",
  };
}

export default function App() {
  const [tab, setTab] = useState<"paste" | "fetch" | "batch">("paste");
  const [pastedHtml, setPastedHtml] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [provider, setProvider] = useState<LlmProvider>(initialProvider);
  const [apiKeys, setApiKeys] = useState<ProviderValues>(initialApiKeys);
  const [models, setModels] = useState<ProviderValues>(initialModels);
  const [skipLlm, setSkipLlm] = useState(() => localStorage.getItem("blockify.skipLlm") === "1");

  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Map<string, StepState>>(new Map());
  const [error, setError] = useState("");
  const [result, setResult] = useState<PageResult | null>(null);
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [showIntermediate, setShowIntermediate] = useState(false);
  const [showImages, setShowImages] = useState(false);

  const [batch, setBatch] = useState<CrawledPage[]>([]);
  const [batchFileName, setBatchFileName] = useState("");
  const [batchStatus, setBatchStatus] = useState<Map<number, BatchState>>(new Map());
  const [batchBusy, setBatchBusy] = useState(false);

  const [bundle, setBundle] = useState<BundlePage[]>(loadBundle);
  const [author, setAuthor] = useState("admin");
  const [postType, setPostType] = useState<"page" | "post">("page");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [sideload, setSideload] = useState(true);
  const [targetTemplate, setTargetTemplate] = useState(() => localStorage.getItem("blockify.targetTemplate") ?? "");

  const providerConfig = getProviderConfig(provider);
  const apiKey = apiKeys[provider];
  const model = models[provider];

  useEffect(() => saveBundle(bundle), [bundle]);
  useEffect(() => {
    localStorage.removeItem("blockify.apiKey");
    localStorage.removeItem("blockify.model");
  }, []);
  useEffect(() => localStorage.setItem("blockify.provider", provider), [provider]);
  useEffect(() => {
    for (const option of LLM_PROVIDERS) {
      localStorage.setItem(`blockify.model.${option.id}`, models[option.id]);
      const keyName = `blockify.apiKey.${option.id}`;
      if (apiKeys[option.id]) {
        sessionStorage.setItem(keyName, apiKeys[option.id]);
      } else {
        sessionStorage.removeItem(keyName);
      }
    }
  }, [apiKeys, models]);
  useEffect(() => localStorage.setItem("blockify.skipLlm", skipLlm ? "1" : "0"), [skipLlm]);
  useEffect(() => localStorage.setItem("blockify.targetTemplate", targetTemplate), [targetTemplate]);

  const lostSet = useMemo(() => new Set(result?.lostPositions ?? []), [result]);

  function setApiKey(value: string) {
    setApiKeys((current) => ({ ...current, [provider]: value }));
  }

  function setModel(value: string) {
    setModels((current) => ({ ...current, [provider]: value }));
  }

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
    setCopied(false);
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

  async function copyBlocks() {
    if (!result) return;
    await navigator.clipboard.writeText(result.blocks);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  function downloadWxr() {
    const xml = buildWxr(bundle, {
      author: author.trim() || "admin",
      postType,
      status,
      emitAttachments: sideload,
    });
    downloadFile("export.wxr", xml, "application/xml");
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

      {showSettings && (
        <section className="panel settings settings-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">AI cleanup</p>
              <h2>Choose your provider</h2>
              <p>Each provider uses the same guarded normalization prompt and deterministic token validation.</p>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Close AI settings"
              onClick={() => setShowSettings(false)}
            >
              ×
            </button>
          </div>

          <div className="provider-switcher" role="group" aria-label="AI provider">
            {LLM_PROVIDERS.map((option) => (
              <button
                type="button"
                key={option.id}
                className={option.id === provider ? "provider-option active" : "provider-option"}
                aria-pressed={option.id === provider}
                onClick={() => setProvider(option.id)}
              >
                <span>{option.shortName}</span>
                <small>{option.models[0].label}</small>
              </button>
            ))}
          </div>

          <div className="settings-grid">
            <label>
              {providerConfig.keyLabel}
              <input
                type="password"
                value={apiKey}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={providerConfig.keyPlaceholder}
              />
              <span className="field-help">
                Need one?{" "}
                <a href={providerConfig.keyUrl} target="_blank" rel="noreferrer">
                  Open {providerConfig.shortName} key settings
                </a>
              </span>
            </label>
            <label>
              Model
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                {providerConfig.models.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} · {option.note}
                  </option>
                ))}
              </select>
              <span className="field-help">Requests go only to {providerConfig.apiHost}.</span>
            </label>
          </div>

          <div className="security-note" role="note">
            <strong>Private-browser mode.</strong> Keys are kept only for this browser tab, never included in an export,
            and sent directly to the selected provider. For a public production deployment, route AI requests through a
            backend so credentials never reach the browser.
            {provider === "openai" && <> Use an OpenAI Platform API key; a ChatGPT subscription is separate.</>}
          </div>
        </section>
      )}

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
            onClick={() => setTab("paste")}
          >
            Paste HTML
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "fetch"}
            className={tab === "fetch" ? "tab active" : "tab"}
            onClick={() => setTab("fetch")}
          >
            Fetch URL
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "batch"}
            className={tab === "batch" ? "tab active" : "tab"}
            onClick={() => setTab("batch")}
          >
            Batch (crawl)
          </button>
        </div>

        <div className="template-row">
          <label className="template-field">
            Target GolfNow template
            <select value={targetTemplate} onChange={(e) => setTargetTemplate(e.target.value)}>
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
            <a href="https://golfnowbusiness.com/template-library/" target="_blank" rel="noreferrer">
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
                className="file-input"
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadBatchFile(f);
                }}
              />
              {batch.length > 0 && (
                <>
                  <p className="hint">
                    {batchFileName}: {batch.length} page
                    {batch.length === 1 ? "" : "s"} loaded.
                  </p>
                  <ul className="bundle-list">
                    {batch.map((p, i) => {
                      const s = batchStatus.get(i);
                      return (
                        <li key={p.url}>
                          <span>
                            {s?.status === "done" && "✓ "}
                            {s?.status === "error" && "✗ "}
                            {s?.status === "converting" && "… "}
                            {p.title || p.url} {s?.note && <span className="muted">({s.note})</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
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
                value={pastedHtml}
                onChange={(e) => setPastedHtml(e.target.value)}
                placeholder="<html>…</html>"
                rows={10}
              />
              <label>
                Page URL <span className="muted">(optional — resolves relative image links)</span>
                <input
                  type="url"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
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
                  onChange={(e) => setPageUrl(e.target.value)}
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
          <button
            type="button"
            className="disclosure-button"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((visible) => !visible)}
          >
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
                  onChange={(e) => setSelector(e.target.value)}
                  placeholder="e.g. #content .entry"
                />
              </label>
            </div>
          )}

          <label className="checkbox toggle-card">
            <input type="checkbox" checked={skipLlm} onChange={(e) => setSkipLlm(e.target.checked)} />
            <span>
              <strong>Local-only cleanup</strong>
              <small>Skip AI and enforce the HTML whitelist in code. Best for already-clean pages.</small>
            </span>
          </label>
        </div>

        <div className="conversion-action">
          <p>{skipLlm ? "No API call · deterministic cleanup" : `${providerConfig.shortName} · ${model}`}</p>
          {tab === "batch" ? (
            <button type="button" className="primary" onClick={convertBatch} disabled={batchBusy || batch.length === 0}>
              {batchBusy ? `Converting ${batchStatus.size}/${batch.length}…` : "Convert all & add to bundle"}
            </button>
          ) : (
            <button type="button" className="primary" onClick={convert} disabled={busy}>
              {busy ? "Converting…" : "Convert"}
            </button>
          )}
        </div>
      </section>

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
          <section className="panel result-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">03 · Review</p>
                <h2>Gutenberg result</h2>
                <p>Inspect the generated blocks and migration flags before bundling.</p>
              </div>
              <span className="result-badge">{result.images.length} assets audited</span>
            </div>
            {result.warnings.map((w) => (
              <p key={w} className="warn-box">
                {w}
              </p>
            ))}
            <label>
              Title
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <div className="row">
              <button type="button" className="primary" onClick={copyBlocks}>
                {copied ? "Copied ✓" : "Copy to clipboard"}
              </button>
              <button type="button" className="secondary" onClick={addToBundle}>
                Add page to WXR bundle
              </button>
            </div>
            <p className="hint">To paste directly: WordPress block editor → ⋮ menu → Code editor → paste.</p>
            <pre className="code-view">{result.blocks}</pre>

            {result.placeholders.length > 0 && (
              <div className="warn-box">
                <strong>Manual migration needed</strong>
                <ul>
                  {result.placeholders.map((p) => (
                    <li key={p.index}>{p.label}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              className="disclosure-button result-disclosure"
              aria-expanded={showImages}
              onClick={() => setShowImages((visible) => !visible)}
            >
              {showImages ? "▾" : "▸"} Asset Manifest / Audit ({result.images.length})
            </button>
            {showImages && result.images.length > 0 && (
              <div className="table-scroll">
                <table className="images-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Type</th>
                      <th>Source URL</th>
                      <th>Details</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.images.map((img) => (
                      <tr key={img.index}>
                        <td>{img.index}</td>
                        <td>
                          <span className={img.type === "image" ? "badge image-badge" : "badge asset-badge"}>
                            {img.type}
                          </span>
                        </td>
                        <td className="url-cell">{img.src || <span className="muted">—</span>}</td>
                        <td>
                          {img.type === "image" ? (
                            img.alt || <span className="muted">—</span>
                          ) : (
                            <details>
                              <summary className="detail-summary">View details</summary>
                              <div className="asset-details">
                                <strong>Attributes:</strong> <code>{JSON.stringify(img.attributes)}</code>
                                <br />
                                <strong>Excerpt:</strong> <pre>{img.excerpt}</pre>
                              </div>
                            </details>
                          )}
                        </td>
                        <td>{lostSet.has(img.index) && <span className="badge">position lost</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              type="button"
              className="disclosure-button result-disclosure"
              aria-expanded={showIntermediate}
              onClick={() => setShowIntermediate((v) => !v)}
            >
              {showIntermediate ? "▾" : "▸"} Intermediate HTML
            </button>
            {showIntermediate && <pre className="code-view">{result.intermediateHtml}</pre>}
            <details>
              <summary>Original source HTML (retained in WXR metadata)</summary>
              <pre className="code-view">{result.sourceHtml}</pre>
            </details>
          </section>
        </ErrorBoundary>
      )}

      {bundle.length > 0 && (
        <section className="panel bundle-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">04 · Export</p>
              <h2>WXR migration bundle</h2>
              <p>Package reviewed pages for WordPress Tools → Import.</p>
            </div>
            <span className="bundle-count">
              {bundle.length} page{bundle.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="bundle-list">
            {bundle.map((p, i) => (
              <li key={`${p.link}-${i}`}>
                <span>
                  {p.title}{" "}
                  <span className="muted">
                    ({p.images.length} image{p.images.length === 1 ? "" : "s"}
                    {p.targetTemplate ? ` · ${p.targetTemplate}` : ""})
                  </span>
                </span>
                <button
                  type="button"
                  className="text-button danger-text"
                  onClick={() => setBundle((prev) => prev.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="row wrap">
            <label>
              Author login
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </label>
            <label>
              Post type
              <select value={postType} onChange={(e) => setPostType(e.target.value as "page" | "post")}>
                <option value="page">page</option>
                <option value="post">post</option>
              </select>
            </label>
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "publish")}>
                <option value="draft">draft</option>
                <option value="publish">publish</option>
              </select>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={sideload} onChange={(e) => setSideload(e.target.checked)} />
              Sideload images
            </label>
          </div>
          <div className="row">
            <button type="button" className="primary" onClick={downloadWxr}>
              Download WXR
            </button>
            <button type="button" className="secondary" onClick={() => setBundle([])}>
              Clear bundle
            </button>
          </div>
          <p className="hint">
            In WordPress: Tools → Import → WordPress, upload this file, assign an author, and check “Download and import
            file attachments” so images are copied into your media library.
          </p>
        </section>
      )}
    </div>
  );
}
