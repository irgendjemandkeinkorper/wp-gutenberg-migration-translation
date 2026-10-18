import { TOKEN_RE, hasToken, isLoneToken, token, tokenIndices } from "./tokens";

export function isSafeUrl(url: string): boolean {
  // Strip control characters and whitespace which browsers ignore when parsing protocols
  const normalized = url.replace(/[\x00-\x20\x7F-\x9F]/g, "").toLowerCase();
  if (normalized.startsWith("javascript:") || normalized.startsWith("vbscript:")) {
    return false;
  }
  if (normalized.startsWith("data:")) {
    const match = normalized.match(/^data:([^;,]*)/);
    const mime = match ? match[1].trim() : "";
    if (!mime.startsWith("image/") && !mime.startsWith("audio/") && !mime.startsWith("video/")) {
      return false;
    }
    if (mime === "image/svg+xml") {
      return false;
    }
  }
  return true;
}

// The tag whitelist the LLM is prompted with, enforced here in code.
const WHITELIST = new Set([
  "h2",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "strong",
  "em",
  "a",
  "br",
  "hr",
  "sup",
  "sub",
]);

// Elements the model sometimes wraps the whole answer in; unwrap silently.
const WRAPPERS = new Set(["div", "article", "section", "main"]);

// Elements whose entire subtree is noise (code, page chrome, embeds) — remove
// outright rather than unwrap, so script text or nav link lists never leak
// into content. This matters most in skip-LLM mode, where raw extracted HTML
// reaches the validator without a model pass to judge boilerplate.
const DROP = new Set([
  "script",
  "style",
  "noscript",
  "template",
  "iframe",
  "object",
  "embed",
  "svg",
  "canvas",
  "video",
  "audio",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "nav",
  "aside",
  "footer",
]);

// Off-whitelist tags that should keep their role, not just their text.
const RENAME: Record<string, string> = {
  b: "strong",
  i: "em",
  h1: "h2",
  h5: "h4",
  h6: "h4",
};

export interface TokenReport {
  missing: number[]; // expected but absent
  extra: number[]; // present but never issued (hallucinated or duplicated)
}

export interface ValidateResult {
  html: string;
  report: TokenReport;
}

/**
 * Enforce the whitelist contract on the LLM's output in code — parse, unwrap
 * wrapper elements, normalize/unwrap off-whitelist tags, strip attributes,
 * isolate image tokens into their own paragraphs, and report token drift.
 */
export function validateFragment(html: string, expectedIndices: number[]): ValidateResult {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  unwrapWrappers(body);
  enforceWhitelist(body);
  isolateTokens(body);

  const found = tokenIndices(body.textContent ?? "");
  return { html: body.innerHTML, report: diffTokens(expectedIndices, found) };
}

/**
 * Last-resort repair after retries are exhausted: drop extra/duplicate token
 * paragraphs, append missing tokens as trailing paragraphs. Returns the
 * repaired HTML and the indices whose position was lost.
 */
export function repairTokens(html: string, expectedIndices: number[]): { html: string; lostPositions: number[] } {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  const seen = new Set<number>();
  const expected = new Set(expectedIndices);
  for (const child of Array.from(body.children)) {
    const text = child.textContent ?? "";
    if (!isLoneToken(text)) continue;
    const idx = tokenIndices(text)[0];
    if (!expected.has(idx) || seen.has(idx)) {
      child.remove();
    } else {
      seen.add(idx);
    }
  }

  const lostPositions = expectedIndices.filter((i) => !seen.has(i));
  for (const idx of lostPositions) {
    const p = doc.createElement("p");
    p.textContent = token(idx);
    body.appendChild(p);
  }

  return { html: body.innerHTML, lostPositions };
}

export function describeViolation(report: TokenReport): string {
  const parts: string[] = [];
  if (report.missing.length) {
    parts.push(`missing: ${report.missing.map((i) => token(i)).join(", ")}`);
  }
  if (report.extra.length) {
    parts.push(`duplicated or invented: ${report.extra.map((i) => token(i)).join(", ")}`);
  }
  return (
    "Your previous attempt violated rule 4. These tokens were " +
    parts.join("; ") +
    ". Return the corrected full fragment with every original token exactly once, in order."
  );
}

function diffTokens(expected: number[], found: number[]): TokenReport {
  const expectedSet = new Set(expected);
  const counts = new Map<number, number>();
  for (const i of found) counts.set(i, (counts.get(i) ?? 0) + 1);

  const missing = expected.filter((i) => !counts.has(i));
  const extra: number[] = [];
  for (const [i, c] of counts) {
    if (!expectedSet.has(i)) extra.push(i);
    else if (c > 1) extra.push(i);
  }
  return { missing, extra: extra.sort((a, b) => a - b) };
}

function unwrap(el: Element): void {
  const doc = el.ownerDocument;
  const frag = doc.createDocumentFragment();
  while (el.firstChild) {
    frag.appendChild(el.firstChild);
  }
  el.replaceWith(frag);
}

function unwrapWrappers(body: HTMLElement): void {
  // Repeatedly unwrap while the body has a single element child (ignoring
  // whitespace) that is a known wrapper.
  for (;;) {
    let only: Node | null = null;
    let count = 0;

    let n = body.firstChild;
    while (n) {
      if (n.nodeType !== Node.TEXT_NODE || (n.textContent && n.textContent.trim())) {
        count++;
        if (count > 1) return;
        only = n;
      }
      n = n.nextSibling;
    }

    if (count !== 1 || !only || only.nodeType !== Node.ELEMENT_NODE) return;
    const el = only as HTMLElement;
    if (!WRAPPERS.has(el.tagName.toLowerCase())) return;

    unwrap(el);
  }
}

function enforceWhitelist(body: HTMLElement): void {
  // Snapshot first: unwrapping keeps descendants in the document, and they
  // are already in the snapshot, so one pass suffices.
  for (const el of Array.from(body.querySelectorAll("*"))) {
    const tag = el.tagName.toLowerCase();
    if (DROP.has(tag)) {
      el.remove();
    } else if (RENAME[tag]) {
      if (el.isConnected) rename(el, RENAME[tag]);
    } else if (!WHITELIST.has(tag)) {
      unwrap(el);
    }
  }
  for (const el of Array.from(body.querySelectorAll("*"))) {
    if (el.tagName.toLowerCase() === "a") {
      const href = el.getAttribute("href");
      while (el.attributes.length > 0) {
        el.removeAttribute(el.attributes[0].name);
      }
      if (href && isSafeUrl(href)) {
        el.setAttribute("href", href);
      } else {
        unwrap(el);
      }
    } else {
      while (el.attributes.length > 0) {
        el.removeAttribute(el.attributes[0].name);
      }
    }
  }
}

function rename(el: Element, newTag: string): void {
  const doc = el.ownerDocument;
  const repl = doc.createElement(newTag);
  while (el.firstChild) {
    repl.appendChild(el.firstChild);
  }
  el.replaceWith(repl);
}

/**
 * Ensure every token ends up alone in its own top-level <p>.
 *
 * Pass 1: split top-level <p> elements whose direct text nodes mix tokens
 * with other content. Pass 2: for tokens still nested deeper (inside
 * formatting or other containers), remove them from the text and re-insert
 * them as lone paragraphs immediately after that top-level block.
 */
function isolateTokens(body: HTMLElement): void {
  const doc = body.ownerDocument;

  for (const child of Array.from(body.children)) {
    if (child.tagName.toLowerCase() !== "p") continue;
    const text = child.textContent ?? "";
    if (!hasToken(text) || isLoneToken(text)) continue;

    const pieces: Node[] = [];
    let current = doc.createElement("p");
    const flush = () => {
      if (current.childNodes.length && (current.textContent ?? "").trim()) {
        pieces.push(current);
      }
      current = doc.createElement("p");
    };
    for (const node of Array.from(child.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = (node.textContent ?? "").split(/(⟦ASSET_\d+⟧)/);
        for (const part of parts) {
          if (!part) continue;
          if (isLoneToken(part)) {
            flush();
            const tp = doc.createElement("p");
            tp.textContent = part;
            pieces.push(tp);
          } else {
            current.append(doc.createTextNode(part));
          }
        }
      } else {
        current.append(node);
      }
    }
    flush();
    const frag = doc.createDocumentFragment();
    for (const piece of pieces) {
      frag.appendChild(piece);
    }
    child.replaceWith(frag);
  }

  for (const child of Array.from(body.children)) {
    const ownText = child.textContent ?? "";
    if (isLoneToken(ownText)) continue;
    const indices: number[] = [];
    const walker = doc.createTreeWalker(child, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent ?? "";
      if (!hasToken(t)) continue;
      indices.push(...tokenIndices(t));
      n.textContent = t.replace(TOKEN_RE, "");
    }
    let anchor: Element = child;
    for (const idx of indices) {
      const tp = doc.createElement("p");
      tp.textContent = token(idx);
      anchor.after(tp);
      anchor = tp;
    }
  }
}
