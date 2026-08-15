import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyTemplateMatch } from "../src/lib/template-contract";
import { contractForTemplate } from "../src/lib/template-contracts";

const FIXTURE_HTML = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "fixtures", "course-page.html"),
  "utf8",
);
const TEMPLATE = "Albatross";

async function convertFixture(page: Page, template: string): Promise<string> {
  await page.goto("./");
  // Deterministic pipeline: no API key, no network.
  const localOnly = page.getByRole("checkbox", { name: /local-only cleanup/i });
  if (!(await localOnly.isChecked())) await localOnly.check();

  await page.getByLabel(/target golfnow template/i).selectOption(template);
  await page.getByLabel("Paste HTML source code").fill(FIXTURE_HTML);
  await page.getByRole("button", { name: "Convert", exact: true }).click();

  const codeView = page.locator("#result-code-view");
  await expect(codeView).toBeVisible({ timeout: 20_000 });
  return (await codeView.textContent()) ?? "";
}

test.describe("template-match verification", () => {
  test("converted content satisfies the selected template contract", async ({ page }) => {
    const blocks = await convertFixture(page, TEMPLATE);

    expect(blocks).toContain("<!-- wp:heading");
    const contract = contractForTemplate(TEMPLATE);
    expect(contract, `no contract registered for ${TEMPLATE}`).toBeDefined();

    const result = verifyTemplateMatch(blocks, contract!);
    expect(
      result.findings,
      `template-contract findings for ${TEMPLATE}:\n${result.findings.map((f) => `- [${f.rule}] ${f.message}`).join("\n")}`,
    ).toEqual([]);
    expect(result.pass).toBe(true);
  });

  test("selected template is shown with the page and carried into the bundle", async ({ page }) => {
    await convertFixture(page, TEMPLATE);

    await expect(page.locator(".template-chip")).toHaveText(TEMPLATE);
    await page.getByRole("button", { name: /add page to wxr bundle/i }).click();
    // The bundle list annotates each page with its target template.
    await expect(page.locator(".bundle-list")).toContainText(TEMPLATE);
  });

  test("downloaded WXR embeds the target template meta and contract-passing blocks", async ({ page }) => {
    await convertFixture(page, TEMPLATE);
    await page.getByRole("button", { name: /add page to wxr bundle/i }).click();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download WXR", exact: true }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const wxr = Buffer.concat(chunks).toString("utf8");

    expect(wxr).toContain("_blockify_target_template");
    expect(wxr).toContain(TEMPLATE);

    // The post content travels inside CDATA; verify the embedded blocks still
    // satisfy the template contract end-to-end (UI → bundle → WXR).
    const cdata = wxr.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
    expect(cdata, "WXR is missing content:encoded CDATA").not.toBeNull();
    const result = verifyTemplateMatch(cdata![1], contractForTemplate(TEMPLATE)!);
    expect(
      result.findings,
      `WXR content failed the ${TEMPLATE} contract:\n${result.findings.map((f) => f.message).join("\n")}`,
    ).toEqual([]);
  });

  test("conversion without a selected template still succeeds but is flagged in the UI", async ({ page }) => {
    await page.goto("./");
    const localOnly = page.getByRole("checkbox", { name: /local-only cleanup/i });
    if (!(await localOnly.isChecked())) await localOnly.check();
    await page.getByLabel("Paste HTML source code").fill(FIXTURE_HTML);
    await page.getByRole("button", { name: "Convert", exact: true }).click();
    await expect(page.locator("#result-code-view")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".template-chip")).toHaveText(/not selected/i);
  });
});
