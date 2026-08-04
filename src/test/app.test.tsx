import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import App from "../App";

// Configure react act environment
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("App clipboard copy", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("blockify.skipLlm", "1");
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root!.unmount();
      });
      root = null;
    }
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
    // Restore clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  async function renderApp() {
    await act(async () => {
      root = createRoot(container!);
      root.render(<App />);
    });
    // Flush initial render effects
    await act(async () => {});
  }

  async function flushAllUpdates() {
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }
  }

  function mockClipboard(writeTextFn: typeof navigator.clipboard.writeText | null) {
    if (writeTextFn === null) {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });
    } else {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: writeTextFn,
        },
        writable: true,
        configurable: true,
      });
    }
  }

  it("shows existing confirmation when clipboard writeText succeeds", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(mockWriteText);

    await renderApp();

    const textarea = container!.querySelector("textarea");
    if (textarea) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
      nativeSetter?.call(textarea, "<html><body><p>Hello World</p></body></html>");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const convertBtn = Array.from(container!.querySelectorAll("button")).find((btn) => btn.textContent === "Convert");
    expect(convertBtn).toBeTruthy();

    await act(async () => {
      convertBtn!.click();
    });
    await flushAllUpdates();

    const copyBtn = Array.from(container!.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Copy to clipboard",
    );
    expect(copyBtn).toBeTruthy();

    await act(async () => {
      copyBtn!.click();
    });
    await flushAllUpdates();

    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining("Hello World"));
    expect(copyBtn!.textContent).toBe("Copied ✓");

    // After 2 seconds, it should change back to "Copy to clipboard"
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    await flushAllUpdates();
    expect(copyBtn!.textContent).toBe("Copy to clipboard");
    vi.useRealTimers();
  });

  it("handles missing clipboard API gracefully", async () => {
    mockClipboard(null);

    const mockSelectNodeContents = vi.fn();
    const mockRemoveAllRanges = vi.fn();
    const mockAddRange = vi.fn();

    const originalCreateRange = document.createRange;
    const originalGetSelection = window.getSelection;

    document.createRange = () =>
      ({
        selectNodeContents: mockSelectNodeContents,
      }) as any;

    window.getSelection = () =>
      ({
        removeAllRanges: mockRemoveAllRanges,
        addRange: mockAddRange,
      }) as any;

    try {
      await renderApp();

      const textarea = container!.querySelector("textarea");
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        nativeSetter?.call(textarea, "<html><body><p>Hello World</p></body></html>");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }

      const convertBtn = Array.from(container!.querySelectorAll("button")).find((btn) => btn.textContent === "Convert");
      expect(convertBtn).toBeTruthy();

      await act(async () => {
        convertBtn!.click();
      });
      await flushAllUpdates();

      const copyBtn = Array.from(container!.querySelectorAll("button")).find(
        (btn) => btn.textContent === "Copy to clipboard",
      );
      expect(copyBtn).toBeTruthy();

      await act(async () => {
        copyBtn!.click();
      });
      await flushAllUpdates();

      const warnBox = container!.querySelector(".warn-box");
      expect(warnBox).toBeTruthy();
      expect(warnBox!.textContent).toContain("Could not copy automatically");
      expect(warnBox!.textContent).toContain("Please press Ctrl+C or Cmd+C to copy manually");

      const codeView = container!.querySelector("#result-code-view");
      expect(codeView).toBeTruthy();
      expect(mockSelectNodeContents).toHaveBeenCalledWith(codeView);
      expect(mockRemoveAllRanges).toHaveBeenCalled();
      expect(mockAddRange).toHaveBeenCalled();
      expect(document.activeElement).toBe(codeView);
    } finally {
      document.createRange = originalCreateRange;
      window.getSelection = originalGetSelection;
    }
  });

  it("handles clipboard writeText promise rejection gracefully", async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error("Permission denied"));
    mockClipboard(mockWriteText);

    const mockSelectNodeContents = vi.fn();
    const mockRemoveAllRanges = vi.fn();
    const mockAddRange = vi.fn();

    const originalCreateRange = document.createRange;
    const originalGetSelection = window.getSelection;

    document.createRange = () =>
      ({
        selectNodeContents: mockSelectNodeContents,
      }) as any;

    window.getSelection = () =>
      ({
        removeAllRanges: mockRemoveAllRanges,
        addRange: mockAddRange,
      }) as any;

    try {
      await renderApp();

      const textarea = container!.querySelector("textarea");
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        nativeSetter?.call(textarea, "<html><body><p>Hello World</p></body></html>");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }

      const convertBtn = Array.from(container!.querySelectorAll("button")).find((btn) => btn.textContent === "Convert");
      expect(convertBtn).toBeTruthy();

      await act(async () => {
        convertBtn!.click();
      });
      await flushAllUpdates();

      const copyBtn = Array.from(container!.querySelectorAll("button")).find(
        (btn) => btn.textContent === "Copy to clipboard",
      );
      expect(copyBtn).toBeTruthy();

      await act(async () => {
        copyBtn!.click();
      });
      await flushAllUpdates();

      const warnBox = container!.querySelector(".warn-box");
      expect(warnBox).toBeTruthy();
      expect(warnBox!.textContent).toContain("Could not copy automatically");

      const codeView = container!.querySelector("#result-code-view");
      expect(codeView).toBeTruthy();
      expect(mockSelectNodeContents).toHaveBeenCalledWith(codeView);
      expect(mockRemoveAllRanges).toHaveBeenCalled();
      expect(mockAddRange).toHaveBeenCalled();
      expect(document.activeElement).toBe(codeView);
    } finally {
      document.createRange = originalCreateRange;
      window.getSelection = originalGetSelection;
    }
  });
});
