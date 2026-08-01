import { GoogleGenAI } from "@google/genai";

// gemini-2.5-* IDs 404 ("no longer available to new users") on API accounts
// created after mid-2026 — keep these on current-generation GA models.
export const DEFAULT_MODEL = "gemini-3.6-flash";
export const FAST_MODEL = "gemini-3.5-flash-lite";

export interface ModelInfo {
  id: string;
  name: string;
  status: "supported" | "stale" | "unsupported";
  lastVerified: string; // e.g., "2025-02-21"
  documentationUrl?: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  baseUrl: string;
  models: ModelInfo[];
}

export const PROVIDER_CATALOG: ProviderInfo[] = [
  {
    id: "google",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    models: [
      {
        id: "gemini-3.6-flash",
        name: "Gemini 3.6 Flash (Recommended)",
        status: "supported",
        lastVerified: "2025-02-21",
        documentationUrl: "https://ai.google.dev/gemini-api/docs/models/gemini",
      },
      {
        id: "gemini-3.5-flash-lite",
        name: "Gemini 3.5 Flash Lite (Fast & Cheap)",
        status: "supported",
        lastVerified: "2025-02-21",
        documentationUrl: "https://ai.google.dev/gemini-api/docs/models/gemini",
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        status: "stale",
        lastVerified: "2025-02-21",
        documentationUrl: "https://ai.google.dev/gemini-api/docs/models/gemini",
      },
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        status: "unsupported",
        lastVerified: "2025-02-21",
        documentationUrl: "https://ai.google.dev/gemini-api/docs/models/gemini",
      },
    ],
  },
];

export function validateProviderModel(providerId: string, modelId: string): void {
  const provider = PROVIDER_CATALOG.find((p) => p.id === providerId);
  if (!provider) {
    throw new Error(`Unknown provider "${providerId}". Please select a valid provider.`);
  }

  const model = provider.models.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(
      `Unknown model "${modelId}" for provider "${provider.name}". Please select a valid model.`
    );
  }

  if (model.status !== "supported") {
    throw new Error(
      `Model "${model.name}" is marked as ${model.status} (last verified: ${model.lastVerified}). ` +
        `Please select a supported model (e.g., gemini-3.6-flash).`
    );
  }
}

export function sanitizeErrorMessage(message: string): string {
  let cleaned = message.replace(/AIzaSy[a-zA-Z0-9_-]+/g, "[REDACTED_API_KEY]");
  cleaned = cleaned.replace(/key=[a-zA-Z0-9_-]+/gi, "key=[REDACTED]");
  cleaned = cleaned.replace(/Bearer\s+[a-zA-Z0-9_.-]+/gi, "Bearer [REDACTED]");
  return cleaned;
}

export function parseAndCleanProviderError(error: any, providerId: string): Error {
  const provider = PROVIDER_CATALOG.find((p) => p.id === providerId);
  const providerName = provider?.name ?? providerId;

  const rawMessage =
    error instanceof Error
      ? error.message
      : error && typeof error.message === "string"
      ? error.message
      : String(error);
  const cleanedMessage = sanitizeErrorMessage(rawMessage);

  let statusCode: number | undefined;
  if (error && typeof error.status === "number") {
    statusCode = error.status;
  } else if (error && typeof error.statusCode === "number") {
    statusCode = error.statusCode;
  } else {
    const match = cleanedMessage.match(/\b(400|401|403|404|429|500|503)\b/);
    if (match) {
      statusCode = parseInt(match[1], 10);
    }
  }

  let guidance = "Please check your network connection and configuration settings.";
  if (statusCode === 401 || statusCode === 403) {
    guidance = "Your API key appears to be invalid or unauthorized. Please verify your API key in Settings.";
  } else if (statusCode === 404) {
    guidance = "The requested model was not found or has been retired by the provider. Please select a supported model in Settings.";
  } else if (statusCode === 429) {
    guidance = "Rate limit exceeded. Please wait a moment before trying again, or check your quota.";
  } else if (statusCode !== undefined && statusCode >= 500) {
    guidance = "The provider is currently experiencing internal server issues. Please try again later.";
  }

  const finalMessage = `Provider Error (${providerName}): ${cleanedMessage} (Status: ${statusCode ?? "unknown"}). Recovery guidance: ${guidance}`;

  const cleanedError = new Error(finalMessage);
  if (error instanceof Error && error.stack) {
    cleanedError.stack = sanitizeErrorMessage(error.stack);
  }
  return cleanedError;
}

export const WHITELIST =
  "h2, h3, h4, p, ul, ol, li, blockquote, pre, code, table, thead, " +
  "tbody, tr, th, td, strong, em, a, br, hr, sup, sub";

// The model normalizes messy HTML into whitelist HTML. It must never emit
// Gutenberg block markup (that's the deterministic serializer's job) and must
// never touch ⟦ASSET_n⟧ tokens (asset placement stays exact). Keeping the model
// on judgment (what is content) and off mechanics (block wrapping, asset URLs)
// is what keeps many pages consistent.
export const SYSTEM_PROMPT = `You are an HTML normalizer. You receive messy extracted article HTML and return a clean HTML fragment.
Rules:
1. Output ONLY these tags: ${WHITELIST}. Convert any h1 to h2. Drop every other tag (div, span, section, figure, figcaption, iframe, script, style, nav, button, form, img) but KEEP their meaningful text content by unwrapping.
2. On <a> keep only the href attribute. Strip all other attributes from all tags.
3. Remove boilerplate: navigation, share/social buttons, "related posts", author bios, newsletter or subscribe prompts, cookie/consent notices, comment sections, ad labels, breadcrumb trails.
4. Asset placeholder tokens look like ⟦ASSET_0⟧, ⟦ASSET_1⟧, etc. They represent images or unsupported embedded/interactive content. Preserve every token EXACTLY as written, each alone in its own <p>, in its original order. Never add, remove, renumber, or reword a token.
5. Do not add commentary, titles, or a wrapping document element. Do not wrap the output in Markdown code fences. Return the cleaned HTML fragment only.
6. Preserve the reading order and all substantive text. Do not summarize or rewrite prose — only restructure and strip.
7. Text in square brackets beginning with [MIGRATION PLACEHOLDER is an audit marker. Preserve it exactly, alone in its own <p>.`;

const FENCE_OPEN_RE = /^```[a-zA-Z]*\n/;
const FENCE_CLOSE_RE = /\n```\s*$/;

export async function cleanHtml(opts: {
  apiKey: string;
  model: string;
  title: string;
  html: string;
  violationNote?: string;
  provider?: string;
}): Promise<string> {
  const providerId = opts.provider ?? "google";
  validateProviderModel(providerId, opts.model);

  try {
    const ai = new GoogleGenAI({ apiKey: opts.apiKey });

    let user =
      `Article title (for context; do NOT include it in the body): ${opts.title}\n\n` +
      `Extracted HTML to clean:\n\n${opts.html}`;
    if (opts.violationNote) user += `\n\n${opts.violationNote}`;

    const resp = await ai.models.generateContent({
      model: opts.model,
      contents: user,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0,
      },
    });

    const text = resp.text ?? "";
    return text.replace(FENCE_OPEN_RE, "").replace(FENCE_CLOSE_RE, "").trim();
  } catch (error) {
    throw parseAndCleanProviderError(error, providerId);
  }
}
