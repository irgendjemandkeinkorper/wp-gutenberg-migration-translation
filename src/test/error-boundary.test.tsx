import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../components/ErrorBoundary";

function ExplodingResult({ broken }: { broken: boolean }) {
  if (broken) throw new Error("fixture render failure");
  return <p>Healthy result view</p>;
}

describe("ErrorBoundary", () => {
  let root: Root | undefined;
  let host: HTMLDivElement | undefined;

  afterEach(() => {
    root?.unmount();
    host?.remove();
    vi.restoreAllMocks();
  });

  it("shows a resettable fallback and recovers the result view", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    let broken = true;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const render = () => root?.render(
      <ErrorBoundary onReset={() => { broken = false; }}>
        <ExplodingResult broken={broken} />
      </ErrorBoundary>,
    );

    await act(async () => render());
    expect(host.textContent).toContain("could not be displayed");
    const reset = host.querySelector("button");
    expect(reset).not.toBeNull();

    await act(async () => {
      reset?.click();
      render();
    });

    expect(host.textContent).toContain("Healthy result view");
    expect(consoleError).toHaveBeenCalled();
  });
});
