import { useMemo, useState } from "react";
import type { PageResult } from "../lib/types";

interface ResultsReviewPanelProps {
  result: PageResult;
  title: string;
  onTitleChange: (title: string) => void;
  onAddToBundle: () => void;
}

export function ResultsReviewPanel({ result, title, onTitleChange, onAddToBundle }: ResultsReviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showIntermediate, setShowIntermediate] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const lostSet = useMemo(() => new Set(result.lostPositions), [result]);

  async function copyBlocks() {
    await navigator.clipboard.writeText(result.blocks);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">03 · Review</p>
          <h2>Gutenberg result</h2>
          <p>Inspect the generated blocks and migration flags before bundling.</p>
        </div>
        <span className="result-badge">{result.images.length} assets audited</span>
      </div>
      {result.warnings.map((warning) => (
        <p key={warning} className="warn-box">
          {warning}
        </p>
      ))}
      <label>
        Title
        <input type="text" value={title} onChange={(event) => onTitleChange(event.target.value)} />
      </label>
      <div className="row">
        <button type="button" className="primary" onClick={() => void copyBlocks()}>
          {copied ? "Copied ✓" : "Copy to clipboard"}
        </button>
        <button type="button" className="secondary" onClick={onAddToBundle}>
          Add page to WXR bundle
        </button>
      </div>
      <p className="hint">To paste directly: WordPress block editor → ⋮ menu → Code editor → paste.</p>
      <pre className="code-view">{result.blocks}</pre>

      {result.placeholders.length > 0 && (
        <div className="warn-box">
          <strong>Manual migration needed</strong>
          <ul>
            {result.placeholders.map((placeholder) => (
              <li key={placeholder.index}>{placeholder.label}</li>
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
              {result.images.map((image) => (
                <tr key={image.index}>
                  <td>{image.index}</td>
                  <td>
                    <span className={image.type === "image" ? "badge image-badge" : "badge asset-badge"}>
                      {image.type}
                    </span>
                  </td>
                  <td className="url-cell">{image.src || <span className="muted">—</span>}</td>
                  <td>
                    {image.type === "image" ? (
                      image.alt || <span className="muted">—</span>
                    ) : (
                      <details>
                        <summary className="detail-summary">View details</summary>
                        <div className="asset-details">
                          <strong>Attributes:</strong> <code>{JSON.stringify(image.attributes)}</code>
                          <br />
                          <strong>Excerpt:</strong> <pre>{image.excerpt}</pre>
                        </div>
                      </details>
                    )}
                  </td>
                  <td>{lostSet.has(image.index) && <span className="badge">position lost</span>}</td>
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
        onClick={() => setShowIntermediate((visible) => !visible)}
      >
        {showIntermediate ? "▾" : "▸"} Intermediate HTML
      </button>
      {showIntermediate && <pre className="code-view">{result.intermediateHtml}</pre>}
      <details>
        <summary>Original source HTML (retained in WXR metadata)</summary>
        <pre className="code-view">{result.sourceHtml}</pre>
      </details>
    </section>
  );
}
