import { useState } from "react";
import { downloadFile } from "../lib/bundle";
import type { BundlePage } from "../lib/types";
import { buildWxr } from "../lib/wxr";

interface BundleExportPanelProps {
  bundle: BundlePage[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

export function BundleExportPanel({ bundle, onRemove, onClear }: BundleExportPanelProps) {
  const [author, setAuthor] = useState("admin");
  const [postType, setPostType] = useState<"page" | "post">("page");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [sideload, setSideload] = useState(true);

  if (bundle.length === 0) return null;

  function downloadWxr() {
    const xml = buildWxr(bundle, {
      author: author.trim() || "admin",
      postType,
      status,
      emitAttachments: sideload,
    });
    downloadFile("export.wxr", xml, "application/xml");
  }

  return (
    <section className="panel bundle-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">04 · Export</p>
          <h2>WXR migration bundle</h2>
          <p>Package reviewed pages for WordPress Tools → Import.</p>
        </div>
        <span className="bundle-count">
          WXR bundle ({bundle.length} page{bundle.length === 1 ? "" : "s"})
        </span>
      </div>
      <ul className="bundle-list">
        {bundle.map((page, index) => (
          <li key={`${page.link}-${index}`}>
            <span>
              {page.title}{" "}
              <span className="muted">
                ({page.images.length} image{page.images.length === 1 ? "" : "s"}
                {page.targetTemplate ? ` · ${page.targetTemplate}` : ""})
              </span>
            </span>
            <button
              type="button"
              className="text-button danger-text"
              aria-label={`Remove "${page.title}" from bundle`}
              onClick={() => onRemove(index)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="row wrap">
        <label>
          Author login
          <input type="text" value={author} onChange={(event) => setAuthor(event.target.value)} />
        </label>
        <label>
          Post type
          <select value={postType} onChange={(event) => setPostType(event.target.value as "page" | "post")}>
            <option value="page">page</option>
            <option value="post">post</option>
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "publish")}>
            <option value="draft">draft</option>
            <option value="publish">publish</option>
          </select>
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={sideload} onChange={(event) => setSideload(event.target.checked)} />
          Sideload images
        </label>
      </div>
      <div className="row">
        <button type="button" className="primary" onClick={downloadWxr}>
          Download WXR
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            if (window.confirm("Clear every page from this WXR bundle?")) onClear();
          }}
        >
          Clear bundle
        </button>
      </div>
      <p className="hint">
        In WordPress: Tools → Import → WordPress, upload this file, assign an author, and check “Download and import
        file attachments” so images are copied into your media library.
      </p>
    </section>
  );
}
