import { describe, expect, it } from "vitest";
import { censusBlocks, verifyTemplateMatch, type TemplateContract } from "../lib/template-contract";
import { GOLFNOW_TEMPLATE_NAMES, contractForTemplate } from "../lib/template-contracts";

const GOOD_PAGE = `<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading">Course Overview</h1>
<!-- /wp:heading -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="hero.jpg" alt="18th hole at sunset"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Welcome to the course.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>Par 72</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`;

describe("censusBlocks", () => {
  it("counts only top-level blocks but records nested names", () => {
    const { topLevel, allNames } = censusBlocks(GOOD_PAGE);
    expect(topLevel).toEqual(["heading", "image", "paragraph", "list"]);
    expect(allNames.has("list-item")).toBe(true);
  });

  it("handles self-closing blocks like separators", () => {
    const { topLevel } = censusBlocks("<!-- wp:separator /--><!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->");
    expect(topLevel).toEqual(["separator", "paragraph"]);
  });

  it("returns empty census for block-free content", () => {
    expect(censusBlocks("<div>plain html</div>").topLevel).toEqual([]);
  });
});

describe("verifyTemplateMatch", () => {
  const contract: TemplateContract = {
    template: "Albatross",
    requiredBlocks: [{ name: "heading" }, { name: "paragraph" }, { name: "image" }],
    leadBlock: ["heading", "image", "cover"],
    maxHtmlFallbackRatio: 0.25,
    requireImageAlt: true,
  };

  it("passes a well-structured page", () => {
    const result = verifyTemplateMatch(GOOD_PAGE, contract);
    expect(result.findings).toEqual([]);
    expect(result.pass).toBe(true);
    expect(result.blockCounts).toMatchObject({ heading: 1, image: 1, paragraph: 1, list: 1 });
  });

  it("fails when a required block is missing", () => {
    const noImage = GOOD_PAGE.replace(/<!-- wp:image -->[\s\S]*?<!-- \/wp:image -->/, "");
    const result = verifyTemplateMatch(noImage, contract);
    expect(result.pass).toBe(false);
    expect(result.findings.some((f) => f.rule === "required-block")).toBe(true);
  });

  it("fails when the page does not open with an allowed lead block", () => {
    const paragraphFirst = `<!-- wp:paragraph --><p>intro</p><!-- /wp:paragraph -->\n${GOOD_PAGE}`;
    const result = verifyTemplateMatch(paragraphFirst, contract);
    expect(result.findings.some((f) => f.rule === "lead-block")).toBe(true);
  });

  it("fails when raw html fallbacks exceed the budget", () => {
    const htmlHeavy = `<!-- wp:heading --><h1>t</h1><!-- /wp:heading -->
<!-- wp:image --><figure><img src="a.jpg" alt="a"/></figure><!-- /wp:image -->
<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->
<!-- wp:html --><div>legacy</div><!-- /wp:html -->
<!-- wp:html --><div>legacy</div><!-- /wp:html -->
<!-- wp:html --><div>legacy</div><!-- /wp:html -->`;
    const result = verifyTemplateMatch(htmlHeavy, contract);
    expect(result.findings.some((f) => f.rule === "html-fallback-ratio")).toBe(true);
  });

  it("fails when an image is missing alt text", () => {
    const noAlt = GOOD_PAGE.replace('alt="18th hole at sunset"', "");
    const result = verifyTemplateMatch(noAlt, contract);
    expect(result.findings.some((f) => f.rule === "image-alt")).toBe(true);
  });

  it("flags forbidden blocks anywhere, including nested", () => {
    const withForbidden: TemplateContract = { ...contract, forbiddenBlocks: ["list-item"] };
    const result = verifyTemplateMatch(GOOD_PAGE, withForbidden);
    expect(result.findings.some((f) => f.rule === "forbidden-block")).toBe(true);
  });

  it("reports empty output", () => {
    const result = verifyTemplateMatch("", contract);
    expect(result.pass).toBe(false);
    expect(result.findings.some((f) => f.rule === "non-empty")).toBe(true);
  });
});

describe("contractForTemplate", () => {
  it("provides a contract for every template in the UI selector", () => {
    for (const name of GOLFNOW_TEMPLATE_NAMES) {
      const c = contractForTemplate(name);
      expect(c, `missing contract for ${name}`).toBeDefined();
      expect(c!.requiredBlocks.length).toBeGreaterThan(0);
    }
  });

  it("requires an image for image-forward templates only", () => {
    const albatross = contractForTemplate("Albatross")!;
    const austin = contractForTemplate("Austin")!;
    expect(albatross.requiredBlocks.some((b) => b.name === "image")).toBe(true);
    expect(austin.requiredBlocks.some((b) => b.name === "image")).toBe(false);
  });

  it("returns undefined when no template is selected", () => {
    expect(contractForTemplate("")).toBeUndefined();
  });
});
