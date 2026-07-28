import { serializeBlocks } from "./blocks";
import { extractContent } from "./extract";
import { cleanHtml } from "./llm";
import { TOKEN_PREFIX } from "./tokens";
import { tokenizeImages } from "./tokenize";
import {
  describeViolation,
  repairTokens,
  validateFragment,
} from "./validate";
import type { PageResult, StepUpdate } from "./types";

const MAX_RETRIES = 2;

export interface ConvertInput {
  rawHtml: string;
  url?: string;
  selector?: string;
  apiKey: string;
  model: string;
}

export async function convertPage(
  input: ConvertInput,
  onStep: (u: StepUpdate) => void,
): Promise<PageResult> {
  const warnings: string[] = [];

  onStep({ step: "Extract", status: "active" });
  const extracted = extractContent(input.rawHtml, {
    url: input.url,
    selector: input.selector,
  });
  if (!extracted.html.trim()) throw new Error("No content could be extracted.");
  onStep({
    step: "Extract",
    status: "done",
    note: extracted.usedSelector ? "via CSS selector" : "via Readability",
  });

  onStep({ step: "Images", status: "active" });
  const tokenized = tokenizeImages(extracted.html, input.url);
  onStep({
    step: "Images",
    status: "done",
    note: `${tokenized.images.length} image${tokenized.images.length === 1 ? "" : "s"} tokenized`,
  });

  const expected = tokenized.images.map((i) => i.index);
  let violationNote: string | undefined;
  let validatedHtml = "";
  let clean = true;

  onStep({ step: "Clean (LLM)", status: "active" });
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const cleaned = await cleanHtml({
      apiKey: input.apiKey,
      model: input.model,
      title: extracted.title,
      html: tokenized.html,
      violationNote,
    });
    if (!cleaned.trim()) throw new Error("The model returned an empty result.");

    onStep({ step: "Validate", status: "active" });
    const { html, report } = validateFragment(cleaned, expected);
    validatedHtml = html;
    clean = report.missing.length === 0 && report.extra.length === 0;
    if (clean) break;

    if (attempt < MAX_RETRIES) {
      violationNote = describeViolation(report);
      onStep({
        step: "Validate",
        status: "warn",
        note: `model broke the token contract, retrying ${attempt + 1}/${MAX_RETRIES}`,
      });
      onStep({ step: "Clean (LLM)", status: "active" });
    }
  }
  onStep({ step: "Clean (LLM)", status: "done" });

  let lostPositions: number[] = [];
  if (!clean) {
    const repaired = repairTokens(validatedHtml, expected);
    validatedHtml = repaired.html;
    lostPositions = repaired.lostPositions;
    if (lostPositions.length) {
      warnings.push(
        `Position lost for image${lostPositions.length === 1 ? "" : "s"} ` +
          `${lostPositions.join(", ")} — appended at the end of the page.`,
      );
    }
    onStep({ step: "Validate", status: "warn", note: "repaired after retries" });
  } else {
    onStep({ step: "Validate", status: "done" });
  }

  onStep({ step: "Blocks", status: "active" });
  const imageMap = new Map(tokenized.images.map((i) => [i.index, i]));
  const blocks = serializeBlocks(validatedHtml, imageMap);

  if (!blocks.trim()) throw new Error("Empty output after block conversion.");
  if (blocks.includes(TOKEN_PREFIX)) {
    throw new Error(
      "Internal error: an image token leaked into the final markup. " +
        "Please report this page's HTML as a bug.",
    );
  }
  onStep({ step: "Blocks", status: "done" });

  return {
    title: extracted.title,
    sourceUrl: input.url ?? "",
    blocks,
    intermediateHtml: validatedHtml,
    images: tokenized.images,
    lostPositions,
    warnings,
  };
}
