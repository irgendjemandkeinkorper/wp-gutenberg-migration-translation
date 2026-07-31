import { GoogleGenAI } from "@google/genai";

export type LlmProvider = "gemini" | "anthropic" | "openai";

export interface ProviderModel {
  id: string;
  label: string;
  note: string;
}

export interface LlmProviderConfig {
  id: LlmProvider;
  name: string;
  shortName: string;
  keyLabel: string;
  keyPlaceholder: string;
  keyUrl: string;
  apiHost: string;
  defaultModel: string;
  models: ProviderModel[];
}

export const DEFAULT_PROVIDER: LlmProvider = "gemini";

export const LLM_PROVIDERS: LlmProviderConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    shortName: "Gemini",
    keyLabel: "Gemini API key",
    keyPlaceholder: "AIza…",
    keyUrl: "https://aistudio.google.com/apikey",
    apiHost: "generativelanguage.googleapis.com",
    defaultModel: "gemini-3.6-flash",
    models: [
      {
        id: "gemini-3.6-flash",
        label: "Gemini 3.6 Flash",
        note: "Recommended",
      },
      {
        id: "gemini-3.5-flash-lite",
        label: "Gemini 3.5 Flash Lite",
        note: "Fastest",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    shortName: "Claude",
    keyLabel: "Anthropic API key",
    keyPlaceholder: "sk-ant-api…",
    keyUrl: "https://platform.claude.com/settings/keys",
    apiHost: "api.anthropic.com",
    defaultModel: "claude-sonnet-5",
    models: [
      {
        id: "claude-sonnet-5",
        label: "Claude Sonnet 5",
        note: "Recommended",
      },
      {
        id: "claude-haiku-4-5-20251001",
        label: "Claude Haiku 4.5",
        note: "Fastest",
      },
      {
        id: "claude-opus-5",
        label: "Claude Opus 5",
        note: "Highest quality",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    shortName: "OpenAI",
    keyLabel: "OpenAI API key",
    keyPlaceholder: "sk-proj-…",
    keyUrl: "https://platform.openai.com/api-keys",
    apiHost: "api.openai.com",
    defaultModel: "gpt-5.6-terra",
    models: [
      {
        id: "gpt-5.6-terra",
        label: "GPT-5.6 Terra",
        note: "Recommended",
      },
      {
        id: "gpt-5.6-luna",
        label: "GPT-5.6 Luna",
        note: "Lowest cost",
      },
      {
        id: "gpt-5.6-sol",
        label: "GPT-5.6 Sol",
        note: "Highest quality",
      },
    ],
  },
];

export function isLlmProvider(value: string | null): value is LlmProvider {
  return LLM_PROVIDERS.some((provider) => provider.id === value);
}

export function getProviderConfig(provider: LlmProvider): LlmProviderConfig {
  return LLM_PROVIDERS.find((candidate) => candidate.id === provider)!;
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

const FENCE_OPEN_RE = /^```(?:html)?\s*\r?\n?/i;
const FENCE_CLOSE_RE = /\r?\n?```\s*$/;

export interface CleanHtmlOptions {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  title: string;
  html: string;
  violationNote?: string;
}

export async function cleanHtml(opts: CleanHtmlOptions): Promise<string> {
  const apiKey = opts.apiKey.trim();
  const model = opts.model.trim();
  if (!apiKey) throw new Error("An API key is required for AI cleanup.");
  if (!model) throw new Error("Choose a model before converting.");

  let user =
    `Article title (for context; do NOT include it in the body): ${opts.title}\n\n` +
    `Extracted HTML to clean:\n\n${opts.html}`;
  if (opts.violationNote) user += `\n\n${opts.violationNote}`;

  let text: string;
  switch (opts.provider) {
    case "gemini":
      text = await cleanWithGemini(apiKey, model, user);
      break;
    case "anthropic":
      text = await cleanWithAnthropic(apiKey, model, user);
      break;
    case "openai":
      text = await cleanWithOpenAI(apiKey, model, user);
      break;
  }

  return text.replace(FENCE_OPEN_RE, "").replace(FENCE_CLOSE_RE, "").trim();
}

async function cleanWithGemini(
  apiKey: string,
  model: string,
  user: string,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: user,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0,
    },
  });
  return response.text ?? "";
}

interface AnthropicResponse {
  content?: Array<{ type?: string; text?: string }>;
}

async function cleanWithAnthropic(
  apiKey: string,
  model: string,
  user: string,
): Promise<string> {
  const response = await postJson<AnthropicResponse>(
    "Claude",
    "https://api.anthropic.com/v1/messages",
    {
      headers: {
        "anthropic-dangerous-direct-browser-access": "true",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        max_tokens: 32_768,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: user }],
      }),
    },
  );

  return (response.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("");
}

interface OpenAIResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

async function cleanWithOpenAI(
  apiKey: string,
  model: string,
  user: string,
): Promise<string> {
  const response = await postJson<OpenAIResponse>(
    "OpenAI",
    "https://api.openai.com/v1/responses",
    {
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_PROMPT,
        input: user,
        max_output_tokens: 32_768,
        store: false,
      }),
    },
  );

  if (typeof response.output_text === "string") return response.output_text;
  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter(
      (block) =>
        (block.type === "output_text" || block.type === "text") &&
        typeof block.text === "string",
    )
    .map((block) => block.text)
    .join("");
}

async function postJson<T>(
  providerName: string,
  url: string,
  init: Pick<RequestInit, "headers" | "body">,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", ...init });
  } catch {
    throw new Error(
      `${providerName} could not be reached from this browser. ` +
        "Check your connection or use a server-side API proxy.",
    );
  }

  const raw = await response.text();
  let data: unknown = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      if (response.ok) {
        throw new Error(`${providerName} returned an unreadable response.`);
      }
    }
  }

  if (!response.ok) {
    const detail = apiErrorMessage(data);
    throw new Error(
      `${providerName} API error ${response.status}` +
        (detail ? `: ${detail}` : ` (${response.statusText})`),
    );
  }

  return data as T;
}

function apiErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (record.error && typeof record.error === "object") {
    const message = (record.error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  return "";
}
