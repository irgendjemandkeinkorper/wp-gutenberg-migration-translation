import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useProviderSettings } from "../hooks/useProviderSettings";

function Probe() {
  const { apiKey, model, provider, setApiKey, setModel, setProvider } = useProviderSettings();
  return (
    <div>
      <output data-testid="provider">{provider}</output>
      <output data-testid="model">{model}</output>
      <output data-testid="key">{apiKey}</output>
      <button type="button" onClick={() => setProvider("openai")}>
        openai
      </button>
      <button type="button" onClick={() => setModel("gpt-test")}>
        model
      </button>
      <button type="button" onClick={() => setApiKey("new-key")}>
        key
      </button>
    </div>
  );
}

describe("useProviderSettings", () => {
  let root: Root | undefined;
  let host: HTMLDivElement | undefined;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    sessionStorage.clear();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
  });

  it("hydrates provider settings and preserves storage semantics", async () => {
    localStorage.setItem("blockify.provider", "openai");
    localStorage.setItem("blockify.model.openai", "gpt-saved");
    sessionStorage.setItem("blockify.apiKey.openai", "session-key");

    await act(async () => {
      root?.render(<Probe />);
    });
    expect(host?.querySelector("[data-testid=provider]")?.textContent).toBe("openai");
    expect(host?.querySelector("[data-testid=model]")?.textContent).toBe("gpt-saved");
    expect(host?.querySelector("[data-testid=key]")?.textContent).toBe("session-key");

    await act(async () => {
      host?.querySelectorAll("button")[1]?.click();
      host?.querySelectorAll("button")[2]?.click();
    });
    expect(localStorage.getItem("blockify.model.openai")).toBe("gpt-test");
    expect(sessionStorage.getItem("blockify.apiKey.openai")).toBe("new-key");
  });
});
