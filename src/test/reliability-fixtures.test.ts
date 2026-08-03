import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { convertPage } from "../lib/pipeline";

interface ReliabilityFixture {
  id: string;
  file: string;
  url: string;
  selector?: string;
  requiredText: string[];
  forbiddenOutput: string[];
  assetTypes: string[];
  placeholderTypes: string[];
  requiredBlocks: string[];
}

const FIXTURE_ROOT = resolve(process.cwd(), "integration/reliability/fixtures");

const fixtures: ReliabilityFixture[] = [
  {
    id: "hosted-builder",
    file: "hosted-builder.html",
    url: "https://builder.example.test/clubhouse",
    selector: "#builder-page",
    requiredText: ["Clubhouse", "Welcome to the clubhouse."],
    forbiddenOutput: ["Builder chrome", "<script", "window.copyThisWidget"],
    assetTypes: ["image", "iframe"],
    placeholderTypes: ["iframe"],
    requiredBlocks: ["wp:heading", "wp:image", "blockifyAsset", "assetType\":\"iframe"],
  },
  {
    id: "static-table",
    file: "static-table.html",
    url: "https://legacy.example.test/scorecard",
    selector: "#content",
    requiredText: ["Course scorecard", "Hole", "412", "538"],
    forbiddenOutput: [],
    assetTypes: ["image"],
    placeholderTypes: [],
    requiredBlocks: ["wp:table", "wp:image"],
  },
  {
    id: "invalid-nesting",
    file: "invalid-nesting.html",
    url: "https://legacy.example.test/notice",
    selector: "#content",
    requiredText: ["Opening notice", "Nested legacy detail", "First retained item", "Second retained item", "Closing notice"],
    forbiddenOutput: [],
    assetTypes: [],
    placeholderTypes: [],
    requiredBlocks: ["wp:paragraph"],
  },
  {
    id: "encoding",
    file: "encoding.html",
    url: "https://legacy.example.test/cafe",
    selector: "#content",
    requiredText: ["Café", "François", "Crème brûlée", "naïve", "ampersand &amp; remain readable"],
    forbiddenOutput: [],
    assetTypes: [],
    placeholderTypes: [],
    requiredBlocks: ["wp:heading", "wp:paragraph"],
  },
  {
    id: "repeated-chrome",
    file: "repeated-chrome.html",
    url: "https://club.example.test/practice",
    requiredText: ["Practice facilities", "Use the range and short-game area"],
    forbiddenOutput: ["Repeated club header", "Repeated sidebar promotions", "Repeated club footer", "<nav"],
    assetTypes: [],
    placeholderTypes: [],
    requiredBlocks: ["wp:heading", "wp:paragraph"],
  },
];

describe("cross-source reliability corpus", () => {
  beforeEach(() => localStorage.clear());

  for (const fixture of fixtures) {
    it(`preserves expected dispositions for ${fixture.id}`, async () => {
      const rawHtml = readFileSync(resolve(FIXTURE_ROOT, fixture.file), "utf8");
      const result = await convertPage(
        {
          rawHtml,
          url: fixture.url,
          selector: fixture.selector,
          apiKey: "",
          model: "fixture",
          skipLlm: true,
        },
        () => {},
      );
      const output = `${result.intermediateHtml}\n${result.blocks}`;

      for (const text of fixture.requiredText) expect(output).toContain(text);
      for (const text of fixture.forbiddenOutput) expect(output).not.toContain(text);
      expect(result.images.map((asset) => asset.type)).toEqual(fixture.assetTypes);
      expect(result.placeholders.map((placeholder) => placeholder.kind)).toEqual(fixture.placeholderTypes);
      for (const marker of fixture.requiredBlocks) expect(result.blocks).toContain(marker);
    });
  }
});
