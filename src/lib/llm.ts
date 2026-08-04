export type LlmProvider = "gemini" | "anthropic" | "openai";

export const DEFAULT_MODEL = "gemini-3.6-flash";
export const FAST_MODEL = "gemini-3.5-flash-lite";

export interface ModelInfo {
  id: string;
  name: string;
  status: "supported" | "stale" | "unsupported";
  lastVerified: string;
  documentationUrl?: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  baseUrl: string;
  models: ModelInfo[];
}

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
  adapter: ProviderAdapter;
}

export interface ProviderAdapterInput {
  apiKey: string;
  model: string;
  user: string;
}

interface GeminiProviderRequest {
  transport: "gemini";
  apiKey: string;
  model: string;
  user: string;
}

interface HttpProviderRequest {
  transport: "http";
  providerName: string;
  url: string;
  init: Pick<RequestInit, "headers" | "body">;
}

type ProviderRequest = GeminiProviderRequest | HttpProviderRequest;

export interface ProviderAdapter {
  buildRequest(input: ProviderAdapterInput): ProviderRequest;
  extractResponse(response: unknown): string;
}

const GEMINI_ADAPTER: ProviderAdapter = {
  buildRequest: ({ apiKey, model, user }) => ({
    transport: "gemini",
    apiKey,
    model,
    user,
  }),
  extractResponse: (response) => {
    if (!isRecord(response) || typeof response.text !== "string") return "";
    return response.text;
  },
};

const ANTHROPIC_ADAPTER: ProviderAdapter = {
  buildRequest: ({ apiKey, model, user }) => ({
    transport: "http",
    providerName: "Claude",
    url: "https://api.anthropic.com/v1/messages",
    init: {
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
  }),
  extractResponse: extractAnthropicText,
};

const OPENAI_ADAPTER: ProviderAdapter = {
  buildRequest: ({ apiKey, model, user }) => ({
    transport: "http",
    providerName: "OpenAI",
    url: "https://api.openai.com/v1/responses",
    init: {
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
  }),
  extractResponse: extractOpenAiText,
};

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
    adapter: GEMINI_ADAPTER,
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
    adapter: ANTHROPIC_ADAPTER,
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
    adapter: OPENAI_ADAPTER,
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

/** Compatibility catalog with explicit lifecycle evidence for provider-model validation. */
export const PROVIDER_CATALOG: ProviderInfo[] = [
  {
    id: "google",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    models: [
      {
        id: DEFAULT_MODEL,
        name: "Gemini 3.6 Flash (Recommended)",
        status: "supported",
        lastVerified: "2025-02-21",
        documentationUrl: "https://ai.google.dev/gemini-api/docs/models/gemini",
      },
      {
        id: FAST_MODEL,
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
  const catalogProvider = PROVIDER_CATALOG.find((provider) => provider.id === providerId);
  if (catalogProvider) {
    const model = catalogProvider.models.find((candidate) => candidate.id === modelId);
    if (!model) {
      throw new Error(
        `Unknown model "${modelId}" for provider "${catalogProvider.name}". Please select a valid model.`,
      );
    }
    if (model.status !== "supported") {
      throw new Error(
        `Model "${model.name}" is marked as ${model.status} (last verified: ${model.lastVerified}). ` +
          `Please select a supported model (e.g., ${DEFAULT_MODEL}).`,
      );
    }
    return;
  }

  const normalizedProvider = providerId === "google" ? "gemini" : providerId;
  const provider = LLM_PROVIDERS.find((candidate) => candidate.id === normalizedProvider);
  if (!provider) throw new Error(`Unknown provider "${providerId}". Please select a valid provider.`);
  if (!provider.models.some((model) => model.id === modelId)) {
    throw new Error(`Unknown model "${modelId}" for provider "${provider.name}". Please select a valid model.`);
  }
}

export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/AIzaSy[a-zA-Z0-9_-]+/g, "[REDACTED_API_KEY]")
    .replace(/\bsk-(?:ant-|proj-)?[a-zA-Z0-9_-]+/g, "[REDACTED_API_KEY]")
    .replace(/([?&]key=)[^&\s]+/gi, "$1[REDACTED]")
    .replace(/Bearer\s+[^\s,;]+/gi, "Bearer [REDACTED]");
}

export function parseAndCleanProviderError(error: unknown, providerId: string): Error {
  const normalizedProvider = providerId === "google" ? "gemini" : providerId;
  const providerName =
    PROVIDER_CATALOG.find((provider) => provider.id === providerId)?.name ??
    LLM_PROVIDERS.find((provider) => provider.id === normalizedProvider)?.name ??
    providerId;
  const record = isRecord(error) ? error : null;
  const rawMessage =
    error instanceof Error ? error.message : typeof record?.message === "string" ? record.message : String(error);
  const cleanedMessage = sanitizeErrorMessage(rawMessage);
  const explicitStatus =
    typeof record?.status === "number"
      ? record.status
      : typeof record?.statusCode === "number"
        ? record.statusCode
        : undefined;
  const embeddedStatus = cleanedMessage.match(/\b(400|401|403|404|429|500|503)\b/);
  const statusCode = explicitStatus ?? (embeddedStatus ? Number(embeddedStatus[1]) : undefined);

  let guidance = "Please check your network connection and configuration settings.";
  if (statusCode === 401 || statusCode === 403) {
    guidance = "Your API key appears to be invalid or unauthorized. Please verify your API key in Settings.";
  } else if (statusCode === 404) {
    guidance =
      "The requested model was not found or has been retired by the provider. Please select a supported model in Settings.";
  } else if (statusCode === 429) {
    guidance = "Rate limit exceeded. Please wait a moment before trying again, or check your quota.";
  } else if (statusCode !== undefined && statusCode >= 500) {
    guidance = "The provider is currently experiencing internal server issues. Please try again later.";
  }

  const cleaned = new Error(
    `Provider Error (${providerName}): ${cleanedMessage} (Status: ${statusCode ?? "unknown"}). ` +
      `Recovery guidance: ${guidance}`,
  );
  if (error instanceof Error && error.stack) cleaned.stack = sanitizeErrorMessage(error.stack);
  return cleaned;
}

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
  provider?: LlmProvider | "google";
  apiKey: string;
  model: string;
  title: string;
  html: string;
  violationNote?: string;
  proxyUrl?: string;
  proxyToken?: string;
}

export async function cleanHtml(opts: CleanHtmlOptions): Promise<string> {
  const apiKey = opts.apiKey.trim();
  const model = opts.model.trim();
  const proxyUrl = opts.proxyUrl?.trim();
  const proxyToken = opts.proxyToken?.trim();
  const provider = opts.provider === "google" ? "gemini" : (opts.provider ?? DEFAULT_PROVIDER);
  if (!apiKey && !proxyUrl) throw new Error("An API key is required for AI cleanup.");
  if (!model) throw new Error("Choose a model before converting.");
  validateProviderModel(provider === "gemini" ? "google" : provider, model);

  let user =
    `Article title (for context; do NOT include it in the body): ${opts.title}\n\n` +
    `Extracted HTML to clean:\n\n${opts.html}`;
  if (opts.violationNote) user += `\n\n${opts.violationNote}`;

  const adapter = getProviderConfig(provider).adapter;
  const request = adapter.buildRequest({ apiKey: apiKey || "PROXY_MANAGED_KEY", model, user });
  try {
    let response: unknown;
    if (request.transport === "gemini") {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: request.apiKey,
        ...(proxyUrl
          ? {
              httpOptions: {
                baseUrl: proxyUrl,
                headers: proxyToken ? { Authorization: `Bearer ${proxyToken}` } : undefined,
              },
            }
          : {}),
      });
      response = await ai.models.generateContent({
        model: request.model,
        contents: request.user,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0,
        },
      });
    } else {
      let requestUrl = request.url;
      let requestInit = request.init;
      if (proxyUrl) {
        const headers = new Headers(request.init.headers);
        const vendorUrl = new URL(request.url);
        requestUrl = new URL(`${vendorUrl.pathname}${vendorUrl.search}`, ensureTrailingSlash(proxyUrl)).toString();
        if (proxyToken) headers.set("Authorization", `Bearer ${proxyToken}`);
        requestInit = { ...request.init, headers };
      }
      response = await postJson(request.providerName, requestUrl, requestInit);
    }

    return adapter.extractResponse(response).replace(FENCE_OPEN_RE, "").replace(FENCE_CLOSE_RE, "").trim();
  } catch (error) {
    throw parseAndCleanProviderError(error, provider === "gemini" ? "google" : provider);
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function extractAnthropicText(response: unknown): string {
  if (!isRecord(response) || !Array.isArray(response.content)) return "";
  return response.content
    .filter(isRecord)
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("");
}

function extractOpenAiText(response: unknown): string {
  if (!isRecord(response)) return "";
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return "";
  return response.output
    .filter(isRecord)
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter(isRecord)
    .filter((block) => (block.type === "output_text" || block.type === "text") && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

async function postJson<T>(providerName: string, url: string, init: Pick<RequestInit, "headers" | "body">): Promise<T> {
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
      `${providerName} API error ${response.status}` + (detail ? `: ${detail}` : ` (${response.statusText})`),
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
