import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import App from "../App";
import { convertPage } from "../lib/pipeline";

// Configure React act environment
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Polyfill File.prototype.text for JSDOM
if (typeof File.prototype.text !== "function") {
  File.prototype.text = function(this: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsText(this);
    });
  };
}

vi.mock("../lib/pipeline", () => {
  return {
    convertPage: vi.fn(),
  };
});

describe("Batch Conversion App Integration Tests", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("blockify.apiKey", "dummy-key");
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  async function waitForCondition(condition: () => boolean, timeout = 1000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (condition()) return;
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    console.log("HTML at Timeout:", container.innerHTML);
    throw new Error("Timeout waiting for condition");
  }

  async function renderAppAndGoToBatch() {
    let root: any;
    await act(async () => {
      root = createRoot(container);
      root.render(React.createElement(App));
    });

    // Locate Batch (crawl) tab and click it
    const tabs = container.querySelectorAll("button.tab");
    const batchTab = Array.from(tabs).find(t => t.textContent?.includes("Batch"));
    expect(batchTab).toBeDefined();

    await act(async () => {
      (batchTab as HTMLButtonElement).click();
    });

    // Batch conversion tests mock the pipeline, so skip the LLM call and avoid
    // requiring a client-side API key in Private Pilot Mode.
    const skipLlm = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(skipLlm).toBeDefined();
    await act(async () => {
      skipLlm.click();
    });

    // Simulate uploading pages.json
    const fileContent = JSON.stringify({
      pages: [
        { url: "https://example.com/p1", title: "Page 1", html: "<h1>P1</h1>" },
        { url: "https://example.com/p2", title: "Page 2", html: "<h1>P2</h1>" },
        { url: "https://example.com/p3", title: "Page 3", html: "<h1>P3</h1>" }
      ]
    });
    const file = new File([fileContent], "pages.json", { type: "application/json" });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      const files = [file];
      Object.defineProperty(fileInput, "files", {
        value: files,
        writable: true,
        configurable: true
      });
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Wait for async file reading to complete and render the list
    await waitForCondition(() => container.querySelectorAll(".bundle-list li").length === 3);
  }

  it("successfully runs start batch and converts all pages", async () => {
    vi.mocked(convertPage).mockResolvedValue({
      title: "Converted Page",
      sourceUrl: "https://example.com",
      blocks: "<!-- wp:paragraph --><p>Content</p>",
      intermediateHtml: "<p>Content</p>",
      sourceHtml: "<h1>P1</h1>",
      placeholders: [],
      images: [],
      lostPositions: [],
      warnings: []
    });

    await renderAppAndGoToBatch();

    const listItems = container.querySelectorAll(".bundle-list li");
    expect(listItems.length).toBe(3);

    const startBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Start Batch"));
    expect(startBtn).toBeDefined();

    await act(async () => {
      (startBtn as HTMLButtonElement).click();
    });

    // Wait for all three pages to finish converting
    await waitForCondition(() => {
      const summaryText = container.querySelector("div[style*='background: var(--code-bg)']")?.textContent;
      return !!summaryText && summaryText.includes("Completed: 3");
    });

    // Assert convertPage was called for all 3 pages
    expect(convertPage).toHaveBeenCalledTimes(3);

    // Assert summary updates
    const summaryText = container.querySelector("div[style*='background: var(--code-bg)']")?.textContent;
    expect(summaryText).toContain("Total: 3");
    expect(summaryText).toContain("Completed: 3");
  });

  it("covers cancellation between pages and leaves completed pages intact", async () => {
    let resolveFirstPage: any;
    const firstPagePromise = new Promise((resolve) => {
      resolveFirstPage = resolve;
    });

    vi.mocked(convertPage).mockImplementation((options) => {
      if (options.url === "https://example.com/p1") {
        return firstPagePromise as any;
      }
      return Promise.resolve({
        title: "Converted Page",
        sourceUrl: options.url || "",
        blocks: "<!-- wp:paragraph -->",
        intermediateHtml: "",
        sourceHtml: "",
        placeholders: [],
        images: [],
        lostPositions: [],
        warnings: []
      });
    });

    await renderAppAndGoToBatch();

    // Start batch
    const startBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Start Batch"));
    expect(startBtn).toBeDefined();

    await act(async () => {
      (startBtn as HTMLButtonElement).click();
    });

    // While page 1 is converting, click Cancel Conversion
    const cancelBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Cancel Conversion"));
    expect(cancelBtn).toBeDefined();

    await act(async () => {
      (cancelBtn as HTMLButtonElement).click();
    });

    // Resolve first page now
    await act(async () => {
      resolveFirstPage({
        title: "Page 1 Converted",
        sourceUrl: "https://example.com/p1",
        blocks: "<!-- wp:paragraph --><p>Page 1</p>",
        intermediateHtml: "",
        sourceHtml: "",
        placeholders: [],
        images: [],
        lostPositions: [],
        warnings: []
      });
    });

    // Wait for cancellation to complete (marked remaining pages as cancelled)
    await waitForCondition(() => {
      const summaryText = container.querySelector("div[style*='background: var(--code-bg)']")?.textContent;
      return !!summaryText && summaryText.includes("Cancelled: 2");
    });

    // Verify first page is completed, but others are cancelled
    const summaryText = container.querySelector("div[style*='background: var(--code-bg)']")?.textContent;
    expect(summaryText).toContain("Total: 3");
    expect(summaryText).toContain("Completed: 1");
    expect(summaryText).toContain("Cancelled: 2");

    // Only page 1 should have been converted
    expect(convertPage).toHaveBeenCalledTimes(1);
  });

  it("covers resumption after a failure and does not duplicate completed URLs", async () => {
    let callCount = 0;
    vi.mocked(convertPage).mockImplementation((options) => {
      callCount++;
      if (options.url === "https://example.com/p2" && callCount <= 3) {
        return Promise.reject(new Error("API network failure on page 2"));
      }
      return Promise.resolve({
        title: `Page ${options.url}`,
        sourceUrl: options.url || "",
        blocks: "<!-- wp:paragraph -->",
        intermediateHtml: "",
        sourceHtml: "",
        placeholders: [],
        images: [],
        lostPositions: [],
        warnings: []
      });
    });

    await renderAppAndGoToBatch();

    // Start batch
    const startBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Start Batch"));
    expect(startBtn).toBeDefined();

    await act(async () => {
      (startBtn as HTMLButtonElement).click();
    });

    // Wait for the run to finish (with failure on page 2)
    await waitForCondition(() => {
      const summaryText = container.querySelector("div[style*='background: var(--code-bg)']")?.textContent;
      return !!summaryText && summaryText.includes("Failed: 1");
    });

    // Verify Page 1 & Page 3 are completed, and Page 2 is failed
    const summaryText = container.querySelector("div[style*='background: var(--code-bg)']")?.textContent;
    expect(summaryText).toContain("Total: 3");
    expect(summaryText).toContain("Completed: 2");
    expect(summaryText).toContain("Failed: 1");

    // Click Resume Batch now that convertPage succeeds
    const resumeBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Resume Batch"));
    expect(resumeBtn).toBeDefined();

    await act(async () => {
      (resumeBtn as HTMLButtonElement).click();
    });

    // Wait for resumption to complete
    await waitForCondition(() => {
      const summaryText = container.querySelector("div[style*='background: var(--code-bg)']")?.textContent;
      return !!summaryText && summaryText.includes("Completed: 3");
    });

    // Verify everything is completed
    const summaryTextAfter = container.querySelector("div[style*='background: var(--code-bg)']")?.textContent;
    expect(summaryTextAfter).toContain("Total: 3");
    expect(summaryTextAfter).toContain("Completed: 3");
    expect(summaryTextAfter).toContain("Failed: 0");

    // convertPage should have been called 4 times total: 3 in first run, 1 in resume run!
    expect(convertPage).toHaveBeenCalledTimes(4);
  });
});
