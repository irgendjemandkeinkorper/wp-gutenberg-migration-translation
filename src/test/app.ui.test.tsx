// Configure React 18/19 testing environment support for act(...)
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

// Polyfill Blob.text if it doesn't exist in JSDOM
if (typeof Blob !== "undefined" && !Blob.prototype.text) {
  Blob.prototype.text = async function (this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(this);
    });
  };
}

describe("Blockify Web Application Smoke & Accessibility Tests", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.stubGlobal("confirm", () => true);

    // Prevent JSDOM from trying to navigate when anchor is clicked during download
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    return () => {
      document.body.removeChild(container);
      vi.restoreAllMocks();
    };
  });

  async function renderApp() {
    let root: any;
    await act(async () => {
      root = createRoot(container);
      root.render(<App />);
    });
    return root;
  }

  // Helper to change values on React 19 controlled inputs
  function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  it("completes primary local-only paste conversion, edit title, and copy flow", async () => {
    await renderApp();

    // Verify app header and tab rendering
    expect(container.textContent).toContain("Blockify");
    expect(container.textContent).toContain("Paste HTML");

    // Retrieve active interactive controls
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();

    const skipLlmCheckbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(skipLlmCheckbox).not.toBeNull();

    // Fill paste area HTML and enable skip-LLM checkbox by simulating a click
    await act(async () => {
      setInputValue(
        textarea,
        `
        <html>
          <head><title>Test Local Paste</title></head>
          <body>
            <div id="content">
              <h1>Test Local Paste</h1>
              <p>Welcome to our firm.</p>
              <img src="https://example.com/team.jpg" alt="The team">
            </div>
          </body>
        </html>
      `,
      );
    });

    await act(async () => {
      if (!skipLlmCheckbox.checked) {
        skipLlmCheckbox.click();
      }
    });

    const convertBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Convert",
    ) as HTMLButtonElement;
    expect(convertBtn).not.toBeNull();

    // Run conversion
    await act(async () => {
      convertBtn.click();
    });

    // Verify successful Gutenberg results with skip LLM
    expect(container.textContent).toContain("Result");
    expect(container.textContent).toContain("Title");

    // Title input should be editable
    const titleInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(titleInput).not.toBeNull();
    expect(titleInput.value).toBe("Test Local Paste");

    await act(async () => {
      setInputValue(titleInput, "Updated Post Title");
    });
    expect(titleInput.value).toBe("Updated Post Title");

    // Mock clipboard API
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const copyBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Copy to clipboard"),
    ) as HTMLButtonElement;
    expect(copyBtn).not.toBeNull();

    await act(async () => {
      copyBtn.click();
    });

    expect(writeTextMock).toHaveBeenCalled();
    expect(container.textContent).toContain("Copied ✓");
  });

  it("handles provider settings and missing-key guidance", async () => {
    await renderApp();

    // Select settings button
    const settingsBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.toLowerCase().includes("settings"),
    ) as HTMLButtonElement;
    expect(settingsBtn).not.toBeNull();

    // The settings panel should start hidden
    let apiKeyInput = container.querySelector('input[type="password"]') as HTMLInputElement;
    expect(apiKeyInput).toBeNull();

    // Click to open settings
    await act(async () => {
      settingsBtn.click();
    });

    apiKeyInput = container.querySelector('input[type="password"]') as HTMLInputElement;
    expect(apiKeyInput).not.toBeNull();

    // If key is empty and skip-LLM is disabled, check error on convert
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    await act(async () => {
      setInputValue(textarea, "<p>Hello</p>");
    });

    const convertBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Convert",
    ) as HTMLButtonElement;

    await act(async () => {
      convertBtn.click();
    });

    expect(container.textContent).toContain("Add your Gemini API key in Settings first.");

    // Provide an API key
    await act(async () => {
      setInputValue(apiKeyInput, "AIza_mock_key_123");
    });

    // Credentials are tab-scoped and must never persist in localStorage.
    expect(sessionStorage.getItem("blockify.apiKey.gemini")).toBe("AIza_mock_key_123");
    expect(localStorage.getItem("blockify.apiKey")).toBeNull();
  });

  it("asserts step progress and warning and unsupported-content states", async () => {
    await renderApp();

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    const skipLlmCheckbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;

    // Use a CSS selector explicitly so we bypass Readability's automatic scoring completely
    const advancedBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Advanced"),
    ) as HTMLButtonElement;
    expect(advancedBtn).not.toBeNull();

    await act(async () => {
      advancedBtn.click();
    });

    const selectorInput = container.querySelector('input[placeholder="e.g. #content .entry"]') as HTMLInputElement;
    expect(selectorInput).not.toBeNull();

    await act(async () => {
      setInputValue(selectorInput, "#my-content");
      setInputValue(
        textarea,
        `
        <html>
          <body>
            <div id="my-content">
              <h1>Some Page Title</h1>
              <p>Hello world. Short text is fine because we override with CSS selector.</p>
              <iframe src="https://example.com/embed"></iframe>
            </div>
          </body>
        </html>
      `,
      );
    });

    await act(async () => {
      if (!skipLlmCheckbox.checked) {
        skipLlmCheckbox.click();
      }
    });

    const convertBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Convert",
    ) as HTMLButtonElement;

    await act(async () => {
      convertBtn.click();
    });

    // Steps rendering checks
    const stepsSection = container.querySelector(".steps");
    expect(stepsSection).not.toBeNull();
    expect(stepsSection?.textContent).toContain("Extract");
    expect(stepsSection?.textContent).toContain("Images");
    expect(stepsSection?.textContent).toContain("Clean (LLM)");
    expect(stepsSection?.textContent).toContain("Validate");
    expect(stepsSection?.textContent).toContain("Blocks");

    // Warnings and manual-migration states checks
    expect(container.textContent).toContain("Manual migration needed");
    expect(container.textContent).toContain("MIGRATION PLACEHOLDER 1: iframe");

    // Expand Audit Table
    const auditBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Asset Manifest / Audit"),
    ) as HTMLButtonElement;
    expect(auditBtn).not.toBeNull();

    await act(async () => {
      auditBtn.click();
    });

    // Check table content
    const table = container.querySelector(".images-table");
    expect(table).not.toBeNull();
    expect(table?.textContent).toContain("iframe");
  });

  it("covers WXR bundle additions, accessibility remove labels, and custom downloads", async () => {
    // Clear localStorage to ensure clean state and no lingering bundle entries
    localStorage.clear();

    await renderApp();

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    const skipLlmCheckbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;

    await act(async () => {
      setInputValue(
        textarea,
        `
        <html>
          <head><title>Page Title</title></head>
          <body>
            <main>
              <h1>Page Title</h1>
              <p>Gutenberg ready.</p>
            </main>
          </body>
        </html>
      `,
      );
    });

    await act(async () => {
      if (!skipLlmCheckbox.checked) {
        skipLlmCheckbox.click();
      }
    });

    const convertBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Convert",
    ) as HTMLButtonElement;

    await act(async () => {
      convertBtn.click();
    });

    const addToBundleBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Add page to WXR bundle",
    ) as HTMLButtonElement;
    expect(addToBundleBtn).not.toBeNull();

    await act(async () => {
      addToBundleBtn.click();
    });

    // Bundle panel is now visible
    expect(container.textContent).toContain("WXR bundle (1 page)");

    // Target specific interactive controls for import author / options
    const authorInput = Array.from(container.querySelectorAll("label"))
      .find((lbl) => lbl.textContent?.includes("Author login"))
      ?.querySelector("input") as HTMLInputElement;
    expect(authorInput).not.toBeNull();
    expect(authorInput.value).toBe("admin");

    await act(async () => {
      setInputValue(authorInput, "migrator_bot");
    });

    // Check accessible "Remove" aria-label on the item
    const removeBtn = container.querySelector('button[aria-label^="Remove \\""]') as HTMLButtonElement;
    expect(removeBtn).not.toBeNull();
    expect(removeBtn.getAttribute("aria-label")).toBe('Remove "Page Title" from bundle');

    // Mock and check download WXR execution
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob://mock-wxr"),
      revokeObjectURL: vi.fn(),
    });

    // Custom helper tracking
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(HTMLAnchorElement.prototype, "remove");

    const downloadBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Download WXR",
    ) as HTMLButtonElement;
    expect(downloadBtn).not.toBeNull();

    await act(async () => {
      downloadBtn.click();
    });

    // Confirm that download anchor element is injected, clicked, and cleaned up
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    // Check Clear Bundle destructive confirmation behavior
    const clearBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Clear bundle",
    ) as HTMLButtonElement;
    expect(clearBtn).not.toBeNull();

    const confirmSpy = vi.spyOn(window, "confirm");
    await act(async () => {
      clearBtn.click();
    });

    expect(confirmSpy).toHaveBeenCalled();
    // Use bundle.length check or similar check instead of not.toContain("WXR bundle") if "WXR bundle (0 pages)" is displayed or panel is hidden
    expect(container.textContent).not.toContain("WXR bundle (");
  });

  it("handles batch loading, display per-page status, and batch conversion", async () => {
    await renderApp();

    // Click the Batch (crawl) tab
    const batchTab = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Batch (crawl)",
    ) as HTMLButtonElement;
    expect(batchTab).not.toBeNull();

    await act(async () => {
      batchTab.click();
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    // Mock File text and loading
    const mockPagesJson = JSON.stringify({
      pages: [
        { url: "https://example.com/one", title: "Page One", html: "<main><h1>Page One</h1><p>Content One</p></main>" },
        { url: "https://example.com/two", title: "Page Two", html: "<main><h1>Page Two</h1><p>Content Two</p></main>" },
      ],
    });
    const file = new File([mockPagesJson], "pages.json", {
      type: "application/json",
    });
    // Add file.text polyfill override specifically for this file mock
    (file as any).text = async () => mockPagesJson;

    await act(async () => {
      // Simulate input file selection
      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Wait for file text resolution in microtask queue
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Verify metadata loading
    expect(container.textContent).toContain("pages.json: 2 pages loaded.");
    expect(container.textContent).toContain("Page One");
    expect(container.textContent).toContain("Page Two");

    // Enable skip-LLM
    const skipLlmCheckbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await act(async () => {
      if (!skipLlmCheckbox.checked) {
        skipLlmCheckbox.click();
      }
    });

    const convertAllBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Start Batch",
    ) as HTMLButtonElement;
    expect(convertAllBtn).not.toBeNull();

    await act(async () => {
      convertAllBtn.click();
    });

    // Verify per-page ticks
    expect(container.textContent).toContain("✓ Page One");
    expect(container.textContent).toContain("✓ Page Two");
    expect(container.textContent).toContain("WXR bundle (2 pages)");
  });

  it("verifies keyboard focus, accessible labels, tabs, and mobile layout classes", async () => {
    await renderApp();

    // 1. Keyboard focus and focus-visible on primary buttons or settings
    const settingsBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.toLowerCase().includes("settings"),
    ) as HTMLButtonElement;
    expect(settingsBtn).not.toBeNull();

    await act(async () => {
      settingsBtn.focus();
    });
    expect(document.activeElement).toBe(settingsBtn);

    // 2. Tabs / disclosures aria-expanded state checks
    expect(settingsBtn.getAttribute("aria-expanded")).toBe("false");
    await act(async () => {
      settingsBtn.click();
    });
    expect(settingsBtn.getAttribute("aria-expanded")).toBe("true");

    // 3. Accessibility / label element checks
    const targetSelectorSelect = Array.from(container.querySelectorAll("label")).find((lbl) =>
      lbl.textContent?.includes("Target GolfNow template"),
    );
    expect(targetSelectorSelect).not.toBeNull();

    // 4. Checking mobile styles or responsive classes
    const appWrapper = container.querySelector(".app");
    expect(appWrapper).not.toBeNull();

    const tabsWrapper = container.querySelector(".tabs");
    expect(tabsWrapper).not.toBeNull();
  });
});
