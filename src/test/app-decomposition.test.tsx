import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { ResultsReviewPanel } from "../components/ResultsReviewPanel";
import type { PageResult } from "../lib/types";

function button(host: HTMLElement, label: string): HTMLButtonElement {
  const match = [...host.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes(label));
  if (!match) throw new Error(`Button not found: ${label}`);
  return match;
}

describe("App panel composition", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    sessionStorage.clear();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.restoreAllMocks();
  });

  it("wires settings, source input, and bundle panels through App", async () => {
    localStorage.setItem(
      "blockify.bundle",
      JSON.stringify([
        {
          title: "Fixture page",
          link: "https://example.test/fixture",
          contentBlocks: "<!-- wp:paragraph --><p>Fixture</p><!-- /wp:paragraph -->",
          images: [],
        },
      ]),
    );

    await act(async () => root.render(<App />));
    expect(host.textContent).toContain("Prepare a page for conversion");
    expect(host.textContent).toContain("WXR migration bundle");
    expect(host.textContent).not.toContain("Choose your provider");

    await act(async () => button(host, "AI settings").click());
    expect(host.textContent).toContain("Choose your provider");

    await act(async () => button(host, "Batch (crawl)").click());
    expect(host.textContent).toContain("Crawl the site from a terminal");

    await act(async () => button(host, "Remove").click());
    expect(host.textContent).not.toContain("WXR migration bundle");
  });
});

describe("ResultsReviewPanel", () => {
  let root: Root;
  let host: HTMLDivElement;

  const result: PageResult = {
    title: "Fixture",
    sourceUrl: "https://example.test/fixture",
    blocks: "<!-- wp:paragraph --><p>Fixture</p><!-- /wp:paragraph -->",
    intermediateHtml: "<p>Fixture</p>",
    sourceHtml: "<main><p>Fixture</p></main>",
    placeholders: [],
    images: [
      {
        index: 0,
        type: "image",
        src: "https://example.test/image.jpg",
        alt: "Fixture image",
        caption: "",
        tagName: "img",
        attributes: {},
        excerpt: "<img>",
      },
    ],
    lostPositions: [],
    warnings: [],
  };

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  it("keeps review-only disclosure state local and exposes explicit actions", async () => {
    const onTitleChange = vi.fn();
    const onAddToBundle = vi.fn();
    await act(async () =>
      root.render(
        <ResultsReviewPanel
          result={result}
          title="Fixture"
          onTitleChange={onTitleChange}
          onAddToBundle={onAddToBundle}
        />,
      ),
    );

    expect(host.querySelector(".images-table")).toBeNull();
    await act(async () => button(host, "Asset Manifest").click());
    expect(host.querySelector(".images-table")).not.toBeNull();

    await act(async () => button(host, "Add page to WXR bundle").click());
    expect(onAddToBundle).toHaveBeenCalledOnce();
    expect(host.textContent).toContain("Added to bundle ✓");

    const titleInput = host.querySelector<HTMLInputElement>('input[type="text"]');
    if (!titleInput) throw new Error("Title input not found");
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(titleInput, "Updated");
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(onTitleChange).toHaveBeenCalled();
  });
});
