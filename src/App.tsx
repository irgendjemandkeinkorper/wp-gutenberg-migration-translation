import { useEffect, useMemo, useState } from "react";
import { downloadFile, loadBundle, saveBundle } from "./lib/bundle";
import { fetchPage } from "./lib/fetchPage";
import { DEFAULT_MODEL, FAST_MODEL } from "./lib/llm";
import { convertPage } from "./lib/pipeline";
import { buildWxr, slugify } from "./lib/wxr";
import type {
  BundlePage,
  PageResult,
  StepStatus,
  StepUpdate,
} from "./lib/types";

const STEP_ORDER = ["Fetch", "Extract", "Images", "Clean (LLM)", "Validate", "Blocks"];
const GOLFNOW_TEMPLATES = [
  "Albatross", "Aspen", "Austin", "Dogwood", "Eagleton", "Indigo", "Mulberry",
  "Pine", "Quantum", "Redmond", "Sequoia", "Sunrise", "Sunstone", "Willow",
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

export default function App() {
  const [tab, setTab] = useState<"paste" | "fetch" | "batch">("paste");
  const [pastedHtml, setPastedHtml] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("blockify.apiKey") ?? "",
  );
  const [model, setModel] = useState(() => {
    // Snap stale saved IDs (e.g. retired gemini-2.5-*) back to a live model.
    const stored = localStorage.getItem("blockify.model");
    return stored === DEFAULT_MODEL || stored === FAST_MODEL
      ? stored
      : DEFAULT_MODEL;
  });
  const [skipLlm, setSkipLlm] = useState(
    () => localStorage.getItem("blockify.skipLlm") === "1",
  );

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
  const [batchStatus, setBatchStatus] = useState<Map<number, BatchState>>(
    new Map(),
  );
  const [batchBusy, setBatchBusy] = useState(false);

  const [bundle, setBundle] = useState<BundlePage[]>(loadBundle);
  const [author, setAuthor] = useState("admin");
  const [postType, setPostType] = useState<"page" | "post">("page");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [sideload, setSideload] = useState(true);
  const [targetTemplate, setTargetTemplate] = useState(
    () => localStorage.getItem("blockify.targetTemplate") ?? "",
  );

  useEffect(() => saveBundle(bundle), [bundle]);
  useEffect(() => localStorage.setItem("blockify.apiKey", apiKey), [apiKey]);
  useEffect(() => localStorage.setItem("blockify.model", model), [model]);
  useEffect(
    () => localStorage.setItem("blockify.skipLlm", skipLlm ? "1" : "0"),
    [skipLlm],
  );
  useEffect(() => localStorage.setItem("blockify.targetTemplate", targetTemplate), [targetTemplate]);

  const lostSet = useMemo(
    () => new Set(result?.lostPositions ?? []),
    [result],
  );

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
      setError("Add your Gemini API key in Settings first.");
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
      const pages = Array.isArray(data)
        ? data
        : (data as { pages?: unknown }).pages;
      if (
        !Array.isArray(pages) ||
        pages.length === 0 ||
        !pages.every(
          (p) =>
            p &&
            typeof (p as CrawledPage).url === "string" &&
            typeof (p as CrawledPage).html === "string",
        )
      ) {
        throw new Error("expected { pages: [{ url, html }, …] }");
      }
      setBatch(
        pages.map((p) => ({
          url: (p as CrawledPage).url,
          title:
            typeof (p as CrawledPage).title === "string"
              ? (p as CrawledPage).title
              : "",
          html: (p as CrawledPage).html,
        })),
      );
      setBatchFileName(file.name);
      setBatchStatus(new Map());
      setError("");
    } catch (e) {
      setError(
        `Could not read the crawl file: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  async function convertBatch() {
    if (!apiKey && !skipLlm) {
      setShowSettings(true);
      setError("Add your Gemini API key in Settings first (or enable Skip LLM).");
      return;
    }
    setBatchBusy(true);
    setError("");
    const update = (i: number, s: BatchState) =>
      setBatchStatus((prev) => new Map(prev).set(i, s));
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
            skipLlm,
          },
          () => {},
        );
        const entry: BundlePage = {
          title: res.title || page.title || "Untitled",
          link: page.url,
          contentBlocks: res.blocks,
          images: res.images
            .filter((asset) => asset.type === "image")
            .map(({ src, alt }) => ({ src, alt })),
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
    const link =
      result.sourceUrl || `https://example.com/${slugify(pageTitle)}`;
    setBundle((prev) => [
      ...prev,
      {
        title: pageTitle,
        link,
        contentBlocks: result.blocks,
        images: result.images
          .filter((asset) => asset.type === "image")
          .map(({ src, alt }) => ({ src, alt })),
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

  const visibleSteps = STEP_ORDER.filter(
    (s) => steps.has(s) || (s !== "Fetch" && (busy || steps.size > 0)),
  );

  return (
    <div className="app">
      <header>
        <div>
          <h1>Blockify</h1>
          <p className="tagline">
            Non-WordPress page → Gutenberg blocks → WXR import file. Everything
            runs in your browser.
          </p>
        </div>
        <button
          className="ghost"
          onClick={() => setShowSettings((v) => !v)}
          aria-expanded={showSettings}
        >
          ⚙ Settings
        </button>
      </header>

      {showSettings && (
        <section className="panel settings">
          <label>
            Gemini API key
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza…  (stored only in this browser)"
            />
          </label>
          <label>
            Model
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value={DEFAULT_MODEL}>{DEFAULT_MODEL} (recommended)</option>
              <option value={FAST_MODEL}>{FAST_MODEL} (fastest, cheapest)</option>
            </select>
          </label>
          <p className="hint">
            The key is kept in localStorage and sent only to
            generativelanguage.googleapis.com.
          </p>
        </section>
      )}

      <section className="panel">
        <div className="tabs">
          <button
            className={tab === "paste" ? "tab active" : "tab"}
            onClick={() => setTab("paste")}
          >
            Paste HTML
          </button>
          <button
            className={tab === "fetch" ? "tab active" : "tab"}
            onClick={() => setTab("fetch")}
          >
            Fetch URL
          </button>
          <button
            className={tab === "batch" ? "tab active" : "tab"}
            onClick={() => setTab("batch")}
          >
            Batch (crawl)
          </button>
        </div>

        <label>
          Target GolfNow template
          <select value={targetTemplate} onChange={(e) => setTargetTemplate(e.target.value)}>
            <option value="">Not selected</option>
            {GOLFNOW_TEMPLATES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <p className="hint">
          Saved with every imported page for implementation and QA. Review the{" "}
          <a href="https://golfnowbusiness.com/template-library/" target="_blank" rel="noreferrer">template library</a>.
        </p>

        {tab === "batch" ? (
          <>
            <p className="hint">
              Crawl the site from a terminal —{" "}
              <code>node scripts/crawl.mjs https://example.com</code> — then
              load the resulting <code>crawl/pages.json</code> here. Every page
              is converted with the settings below (CSS selector, skip-LLM,
              model) and added to the WXR bundle.
            </p>
            <input
              type="file"
              aria-label="Upload crawl pages.json file"
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
                          {p.title || p.url}{" "}
                          {s?.note && (
                            <span className="muted">({s.note})</span>
                          )}
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
              In your browser, open the page and use View Page Source (or copy
              the outerHTML from DevTools for JS-rendered pages), then paste it
              here.
            </p>
            <textarea
              aria-label="HTML to convert"
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
              Fetched through a public CORS proxy — works for many sites, but
              if it fails, use Paste HTML.
            </p>
          </>
        )}

        <button
          className="ghost small"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? "▾" : "▸"} Advanced
        </button>
        {showAdvanced && (
          <div style={{ marginTop: "10px" }}>
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

        <label className="checkbox">
          <input
            type="checkbox"
            checked={skipLlm}
            onChange={(e) => setSkipLlm(e.target.checked)}
          />
          Skip LLM cleanup (no API call)
        </label>
        {skipLlm && (
          <p className="hint">
            Deterministic mode: off-whitelist tags are stripped in code, but
            nothing judges boilerplate — best for already-clean pages combined
            with a content CSS selector. No API key needed.
          </p>
        )}

        {tab === "batch" ? (
          <button
            className="primary"
            onClick={convertBatch}
            disabled={batchBusy || batch.length === 0}
          >
            {batchBusy
              ? `Converting ${batchStatus.size}/${batch.length}…`
              : "Convert all & add to bundle"}
          </button>
        ) : (
          <button className="primary" onClick={convert} disabled={busy}>
            {busy ? "Converting…" : "Convert"}
          </button>
        )}
      </section>

      {(busy || steps.size > 0) && (
        <section className="panel">
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

      {error && <section className="panel error-box" role="alert">{error}</section>}

      {result && (
        <section className="panel">
          <h2>Result</h2>
          {result.warnings.map((w) => (
            <p key={w} className="warn-box">
              {w}
            </p>
          ))}
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <div className="row">
            <button className="primary" onClick={copyBlocks}>
              {copied ? "Copied ✓" : "Copy to clipboard"}
            </button>
            <button onClick={addToBundle}>Add page to WXR bundle</button>
          </div>
          <p className="hint">
            To paste directly: WordPress block editor → ⋮ menu → Code editor →
            paste.
          </p>
          <pre className="code-view">{result.blocks}</pre>

          {result.placeholders.length > 0 && (
            <div className="warn-box">
              <strong>Manual migration needed</strong>
              <ul>{result.placeholders.map((p) => <li key={p.index}>{p.label}</li>)}</ul>
            </div>
          )}

          <button className="ghost small" onClick={() => setShowImages((v) => !v)}>
            {showImages ? "▾" : "▸"} Asset Manifest / Audit ({result.images.length})
          </button>
          {showImages && result.images.length > 0 && (
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
                      <span className="badge" style={{ backgroundColor: img.type === "image" ? undefined : "#f5f5f5", color: img.type === "image" ? undefined : "#333" }}>
                        {img.type}
                      </span>
                    </td>
                    <td className="url-cell">{img.src || <span className="muted">—</span>}</td>
                    <td>
                      {img.type === "image" ? (
                        img.alt || <span className="muted">—</span>
                      ) : (
                        <details>
                          <summary style={{ cursor: "pointer", fontSize: "0.75rem" }}>View details</summary>
                          <div style={{ marginTop: "5px", fontSize: "0.75rem" }}>
                            <strong>Attributes:</strong> <code>{JSON.stringify(img.attributes)}</code>
                            <br />
                            <strong>Excerpt:</strong> <pre style={{ whiteSpace: "pre-wrap", background: "#f9f9f9", padding: "4px", margin: "4px 0" }}>{img.excerpt}</pre>
                          </div>
                        </details>
                      )}
                    </td>
                    <td>
                      {lostSet.has(img.index) && (
                        <span className="badge">position lost</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button
            className="ghost small"
            onClick={() => setShowIntermediate((v) => !v)}
            aria-expanded={showIntermediate}
          >
            {showIntermediate ? "▾" : "▸"} Intermediate HTML
          </button>
          {showIntermediate && (
            <pre className="code-view">{result.intermediateHtml}</pre>
          )}
          <details>
            <summary>Original source HTML (retained in WXR metadata)</summary>
            <pre className="code-view">{result.sourceHtml}</pre>
          </details>
        </section>
      )}

      {bundle.length > 0 && (
        <section className="panel">
          <h2>WXR bundle ({bundle.length} page{bundle.length === 1 ? "" : "s"})</h2>
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
                  className="ghost small"
                  aria-label={`Remove "${p.title}" from bundle`}
                  onClick={() =>
                    setBundle((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="row wrap">
            <label>
              Author login
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </label>
            <label>
              Post type
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as "page" | "post")}
              >
                <option value="page">page</option>
                <option value="post">post</option>
              </select>
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "publish")}
              >
                <option value="draft">draft</option>
                <option value="publish">publish</option>
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={sideload}
                onChange={(e) => setSideload(e.target.checked)}
              />
              Sideload images
            </label>
          </div>
          <div className="row">
            <button className="primary" onClick={downloadWxr}>
              Download WXR
            </button>
            <button
              className="ghost"
              onClick={() => {
                if (window.confirm("Are you sure you want to clear the entire bundle?")) {
                  setBundle([]);
                }
              }}
            >
              Clear bundle
            </button>
          </div>
          <p className="hint">
            In WordPress: Tools → Import → WordPress, upload this file, assign
            an author, and check “Download and import file attachments” so
            images are copied into your media library.
          </p>
        </section>
      )}
    </div>
  );
}
