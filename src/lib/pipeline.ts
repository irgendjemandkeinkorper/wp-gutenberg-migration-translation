import { serializeBlocks } from "./blocks";
import { cleanCacheKey, readCleanCache, writeCleanCache } from "./cache";
import { extractContent } from "./extract";
import { cleanHtml, SYSTEM_PROMPT, validateProviderModel } from "./llm";
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
  provider?: string;
  /** Deterministic mode: enforce the whitelist in code only, no Gemini call. */
  skipLlm?: boolean;
  proxyUrl?: string;
  proxyToken?: string;
}

export async function convertPage(
  input: ConvertInput,
  onStep: (u: StepUpdate) => void,
): Promise<PageResult> {
  if (!input.skipLlm) {
    validateProviderModel(input.provider ?? "google", input.model);
  }

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
    note: extracted.note,
  });

  onStep({ step: "Images", status: "active" });
  const tokenized = tokenizeImages(extracted.html, input.url);
  const placeholders = tokenized.images
    .filter((asset) => asset.type !== "image")
    .map((asset) => ({
      index: asset.index,
      kind: asset.type,
      source: asset.src,
      label:
        `MIGRATION PLACEHOLDER ${asset.index + 1}: ${asset.type}` +
        (asset.src ? ` — ${asset.src}` : ""),
    }));
  onStep({
    step: "Images",
    status: "done",
    note:
      `${tokenized.images.length} asset${tokenized.images.length === 1 ? "" : "s"} tokenized; ` +
      `${placeholders.length} placeholder${placeholders.length === 1 ? "" : "s"}`,
  });

  const expected = tokenized.images.map((i) => i.index);
  let validatedHtml: string;
  let lostPositions: number[];

  if (input.skipLlm) {
    onStep({ step: "Clean (LLM)", status: "done", note: "skipped — no API call" });
    onStep({ step: "Validate", status: "active" });
    ({ html: validatedHtml, lostPositions } = enforceTokens(
      tokenized.html,
      expected,
    ));
    onStep({
      step: "Validate",
      status: lostPositions.length ? "warn" : "done",
      note: lostPositions.length ? "repaired" : "deterministic cleanup",
    });
  } else {
    // The prompt is part of the key so editing it invalidates old entries.
    const cacheKey = cleanCacheKey(input.model, SYSTEM_PROMPT, tokenized.html);
    const cached = readCleanCache(cacheKey);
    if (cached) {
      onStep({ step: "Clean (LLM)", status: "done", note: "cached — no API call" });
      onStep({ step: "Validate", status: "done", note: "cached" });
      validatedHtml = cached.html;
      lostPositions = cached.lostPositions;
    } else {
      ({ html: validatedHtml, lostPositions } = await cleanWithRetries(
        input,
        extracted.title,
        tokenized.html,
        expected,
        onStep,
      ));
      writeCleanCache(cacheKey, { html: validatedHtml, lostPositions });
    }
  }

  if (lostPositions.length) {
    warnings.push(
      `Position lost for asset${lostPositions.length === 1 ? "" : "s"} ` +
        `${lostPositions.join(", ")} — appended at the end of the page.`,
    );
  }
  if (placeholders.length) {
    warnings.push(
      `${placeholders.length} unsupported feature${placeholders.length === 1 ? " was" : "s were"} ` +
        "retained as visible migration placeholders.",
    );
  }

  onStep({ step: "Blocks", status: "active" });
  const assetMap = new Map(tokenized.images.map((i) => [i.index, i]));
  const blocks = serializeBlocks(validatedHtml, assetMap);

  if (!blocks.trim()) throw new Error("Empty output after block conversion.");
  if (blocks.includes(TOKEN_PREFIX)) {
    throw new Error(
      "Internal error: an asset token leaked into the final markup. " +
        "Please report this page's HTML as a bug.",
    );
  }
  onStep({ step: "Blocks", status: "done" });

  return {
    title: extracted.title,
    sourceUrl: input.url ?? "",
    blocks,
    intermediateHtml: validatedHtml,
    sourceHtml: input.rawHtml,
    placeholders,
    images: tokenized.images,
    lostPositions,
    warnings,
  };
}

async function cleanWithRetries(
  input: ConvertInput,
  title: string,
  tokenizedHtml: string,
  expected: number[],
  onStep: (u: StepUpdate) => void,
): Promise<{ html: string; lostPositions: number[] }> {
  let violationNote: string | undefined;
  let validatedHtml = "";
  let clean = true;

  onStep({ step: "Clean (LLM)", status: "active" });
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const cleaned = await cleanHtml({
      apiKey: input.apiKey,
      model: input.model,
      title,
      html: tokenizedHtml,
      violationNote,
      provider: input.provider,
      proxyUrl: input.proxyUrl,
      proxyToken: input.proxyToken,
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

  if (clean) {
    onStep({ step: "Validate", status: "done" });
    return { html: validatedHtml, lostPositions: [] };
  }
  const repaired = repairTokens(validatedHtml, expected);
  onStep({ step: "Validate", status: "warn", note: "repaired after retries" });
  return repaired;
}

/** Validate + (if tokens drifted) repair, without any model involvement. */
function enforceTokens(
  html: string,
  expected: number[],
): { html: string; lostPositions: number[] } {
  const { html: validated, report } = validateFragment(html, expected);
  if (!report.missing.length && !report.extra.length) {
    return { html: validated, lostPositions: [] };
  }
  return repairTokens(validated, expected);
}
