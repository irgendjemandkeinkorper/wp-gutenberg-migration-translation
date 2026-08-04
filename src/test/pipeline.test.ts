import { beforeEach, describe, expect, it } from "vitest";
import { convertPage } from "../lib/pipeline";

// skip-LLM mode end-to-end: no API key, no network, deterministic output.
describe("convertPage (skipLlm)", () => {
  beforeEach(() => localStorage.clear());

  const page = `<html><head><title>About Us</title></head><body>
    <div id="content">
      <div class="wrap"><h1>About Us</h1>
        <script>var tracked = true;</script>
        <p class="intro" style="color:red">Welcome to <b>our</b> firm.</p>
        <img src="/uploads/team.jpg" alt="The team">
        <ul><li>One</li><li>Two</li></ul>
      </div>
    </div>
  </body></html>`;

  it("converts clean HTML to blocks with zero LLM involvement", async () => {
    const result = await convertPage(
      {
        rawHtml: page,
        url: "https://example.com/about",
        selector: "#content",
        apiKey: "",
        model: "irrelevant",
        skipLlm: true,
      },
      () => {},
    );

    expect(result.blocks).toContain('<!-- wp:heading {"level":2} -->');
    expect(result.blocks).toContain("<p>Welcome to <strong>our</strong> firm.</p>");
    expect(result.blocks).toContain('<img src="https://example.com/uploads/team.jpg" alt="The team"/>');
    expect(result.blocks).toContain("<!-- wp:list -->");
    expect(result.blocks).not.toContain("tracked");
    expect(result.lostPositions).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("reports steps including the skipped LLM step", async () => {
    const notes: string[] = [];
    await convertPage(
      {
        rawHtml: page,
        url: "https://example.com/about",
        selector: "#content",
        apiKey: "",
        model: "irrelevant",
        skipLlm: true,
      },
      (u) => notes.push(`${u.step}:${u.status}${u.note ? `:${u.note}` : ""}`),
    );
    expect(notes).toContain("Clean (LLM):done:skipped — no API call");
    expect(notes.some((n) => n.startsWith("Blocks:done"))).toBe(true);
  });

  it("retains original HTML and preserves unsupported content for QA", async () => {
    const rawHtml =
      '<html><head><title>Tee Times</title></head><body><main><p>Book:</p><iframe src="https://booking.example/tee"></iframe></main></body></html>';
    const result = await convertPage(
      {
        rawHtml,
        url: "https://example.com/tee-times",
        selector: "main",
        apiKey: "",
        model: "irrelevant",
        skipLlm: true,
      },
      () => {},
    );
    expect(result.sourceHtml).toBe(rawHtml);
    expect(result.placeholders).toHaveLength(1);
    expect(result.blocks).toContain("MIGRATION PLACEHOLDER 1: iframe");
    expect(result.warnings[0]).toContain("retained as visible migration placeholders");
  });
});
