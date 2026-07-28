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

interface StepState {
  status: StepStatus;
  note?: string;
}

export default function App() {
  const [tab, setTab] = useState<"paste" | "fetch">("paste");
  const [pastedHtml, setPastedHtml] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("blockify.apiKey") ?? "",
  );
  const [model, setModel] = useState(
    () => localStorage.getItem("blockify.model") ?? DEFAULT_MODEL,
  );

  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Map<string, StepState>>(new Map());
  const [error, setError] = useState("");
  const [result, setResult] = useState<PageResult | null>(null);
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [showIntermediate, setShowIntermediate] = useState(false);
  const [showImages, setShowImages] = useState(false);

  const [bundle, setBundle] = useState<BundlePage[]>(loadBundle);
  const [author, setAuthor] = useState("admin");
  const [postType, setPostType] = useState<"page" | "post">("page");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [sideload, setSideload] = useState(true);

  useEffect(() => saveBundle(bundle), [bundle]);
  useEffect(() => localStorage.setItem("blockify.apiKey", apiKey), [apiKey]);
  useEffect(() => localStorage.setItem("blockify.model", model), [model]);

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
    if (!apiKey) {
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
        images: result.images.map(({ src, alt }) => ({ src, alt })),
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
        <button className="ghost" onClick={() => setShowSettings((v) => !v)}>
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
              <option value={DEFAULT_MODEL}>{DEFAULT_MODEL} (best quality)</option>
              <option value={FAST_MODEL}>{FAST_MODEL} (faster)</option>
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
        </div>

        {tab === "paste" ? (
          <>
            <p className="hint">
              In your browser, open the page and use View Page Source (or copy
              the outerHTML from DevTools for JS-rendered pages), then paste it
              here.
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
              Fetched through a public CORS proxy — works for many sites, but
              if it fails, use Paste HTML.
            </p>
          </>
        )}

        <button className="ghost small" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? "▾" : "▸"} Advanced
        </button>
        {showAdvanced && (
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
        )}

        <button className="primary" onClick={convert} disabled={busy}>
          {busy ? "Converting…" : "Convert"}
        </button>
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

      {error && <section className="panel error-box">{error}</section>}

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

          <button className="ghost small" onClick={() => setShowImages((v) => !v)}>
            {showImages ? "▾" : "▸"} Images ({result.images.length})
          </button>
          {showImages && result.images.length > 0 && (
            <table className="images-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Source URL</th>
                  <th>Alt text</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result.images.map((img) => (
                  <tr key={img.index}>
                    <td>{img.index}</td>
                    <td className="url-cell">{img.src}</td>
                    <td>{img.alt || <span className="muted">—</span>}</td>
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
          >
            {showIntermediate ? "▾" : "▸"} Intermediate HTML
          </button>
          {showIntermediate && (
            <pre className="code-view">{result.intermediateHtml}</pre>
          )}
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
                    ({p.images.length} image{p.images.length === 1 ? "" : "s"})
                  </span>
                </span>
                <button
                  className="ghost small"
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
            <button className="ghost" onClick={() => setBundle([])}>
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
