import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageQaWorkbench } from "../components/PageQaWorkbench";
import type { PageQaRecord } from "../lib/qa/workbench";
import { operationAuthorizations, pageQaRecordFixture } from "./fixtures/page-qa-fixture";

function button(host: HTMLElement, label: string): HTMLButtonElement {
  const match = [...host.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes(label));
  if (!match) throw new Error(`Button not found: ${label}`);
  return match;
}

function checkbox(host: HTMLElement, label: string): HTMLInputElement {
  const match = [...host.querySelectorAll("label")].find((candidate) => candidate.textContent?.includes(label));
  const input = match?.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!input) throw new Error(`Checkbox not found: ${label}`);
  return input;
}

function select(host: HTMLElement, label: string): HTMLSelectElement {
  const match = [...host.querySelectorAll("label")].find((candidate) => candidate.textContent?.includes(label));
  const input = match?.querySelector("select");
  if (!input) throw new Error(`Select not found: ${label}`);
  return input;
}

describe("PageQaWorkbench", () => {
  let root: Root;
  let host: HTMLDivElement;

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

  it("shows page evidence, previews invalidation, and gates sensitive reruns on external grants", async () => {
    const record = pageQaRecordFixture();
    const onConfirmRerun = vi.fn();
    const render = (authorizations = operationAuthorizations().slice(0, 0)) =>
      root.render(
        <PageQaWorkbench
          record={record}
          operator="qa-operator"
          authorizations={authorizations}
          requestedAt="2026-08-03T12:10:00.000Z"
          now={() => "2026-08-03T12:11:00.000Z"}
          onConfirmRerun={onConfirmRerun}
        />,
      );

    await act(async () => render());
    for (const label of [
      "Saved source evidence",
      "Semantic IR and placement plan",
      "Block mapping",
      "Destination preview/reference",
      "Findings (2)",
      "Exception state (1)",
      "Prior revisions and audit",
      "Invalidation preview",
    ])
      expect(host.textContent).toContain(label);
    expect(host.textContent).toContain("Raw source HTML is intentionally not exposed");
    expect(host.textContent).toContain("Unsupported widget requires manual replacement");
    expect(host.textContent).toContain("Paragraph spacing was normalized");
    expect(onConfirmRerun).not.toHaveBeenCalled();

    await act(async () => {
      const severity = select(host, "Severity");
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(severity, "blocking");
      severity.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(host.textContent).toContain("Unsupported widget requires manual replacement");
    expect(host.textContent).not.toContain("Paragraph spacing was normalized");

    await act(async () => {
      checkbox(host, "Request recrawl").click();
      checkbox(host, "Request publish").click();
    });
    expect(host.textContent).toContain("recrawl requires an external authorization grant");
    expect(host.textContent).toContain("publish requires an external authorization grant");
    expect(button(host, "Confirm targeted rerun").disabled).toBe(true);

    await act(async () => render(operationAuthorizations()));
    expect(button(host, "Confirm targeted rerun").disabled).toBe(false);
    expect(onConfirmRerun).not.toHaveBeenCalled();

    await act(async () => button(host, "Confirm targeted rerun").click());
    expect(onConfirmRerun).toHaveBeenCalledOnce();
    expect(onConfirmRerun.mock.calls[0]?.[0]).toMatchObject({
      operations: ["recompute", "recrawl", "publish"],
      authorizationGrantIds: ["grant:publish:42", "grant:recrawl:42"],
    });
    expect(host.textContent).toContain("no work was started implicitly");
  });

  it("fails invalid evidence visibly and disables rerun confirmation", async () => {
    const invalid = structuredClone(pageQaRecordFixture()) as PageQaRecord & {
      current: PageQaRecord["current"] & { source: PageQaRecord["current"]["source"] & { rawHtml?: string } };
    };
    invalid.current.source.rawHtml = "<p>unsafe inline evidence</p>";

    await act(async () =>
      root.render(<PageQaWorkbench record={invalid} operator="qa-operator" onConfirmRerun={vi.fn()} />),
    );

    expect(host.querySelector('[role="alert"]')?.textContent).toContain("QA record is invalid");
    expect(host.textContent).toContain("current.source.rawHtml");
    expect([...host.querySelectorAll("button")].some((candidate) => candidate.textContent?.includes("Confirm"))).toBe(
      false,
    );
  });
});
