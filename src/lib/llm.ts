import { GoogleGenAI } from "@google/genai";

// gemini-2.5-* IDs 404 ("no longer available to new users") on API accounts
// created after mid-2026 — keep these on current-generation GA models.
export const DEFAULT_MODEL = "gemini-3.6-flash";
export const FAST_MODEL = "gemini-3.5-flash-lite";

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

export function sanitizeErrorMessage(msg: string): string {
  if (!msg) return "";
  let clean = msg;
  // Sanitize Google API keys
  clean = clean.replace(/AIzaSy[a-zA-Z0-9_-]+/g, "[REDACTED_API_KEY]");
  // Sanitize query params like key=...
  clean = clean.replace(/(\?|&)key=[^&]+/g, "$1key=[REDACTED]");
  // Sanitize Bearer tokens
  clean = clean.replace(/Bearer\s+[a-zA-Z0-9\-\._~]+/g, "Bearer [REDACTED]");
  return clean;
}

export async function cleanHtml(opts: {
  apiKey: string;
  model: string;
  title: string;
  html: string;
  violationNote?: string;
}): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });

  let user =
    `Article title (for context; do NOT include it in the body): ${opts.title}\n\n` +
    `Extracted HTML to clean:\n\n${opts.html}`;
  if (opts.violationNote) user += `\n\n${opts.violationNote}`;

  try {
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(sanitizeErrorMessage(msg));
  }
}
