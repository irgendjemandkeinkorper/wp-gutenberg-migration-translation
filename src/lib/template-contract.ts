// Template-contract verification: checks that serialized Gutenberg output
// structurally satisfies the expectations of a chosen GolfNow target template.
//
// The contract model is deliberately deterministic and parses only the
// top-level Gutenberg comment delimiters that blocks.ts emits, so the same
// verifier can run in vitest, in Playwright E2E specs, and (later) inside the
// WordPress import harness against post_content.

export interface BlockRequirement {
  /** Block name without the "wp:" prefix, e.g. "heading", "image". */
  name: string;
  /** Minimum number of top-level occurrences (default 1). */
  min?: number;
  /** Optional maximum number of top-level occurrences. */
  max?: number;
}

export interface TemplateContract {
  /** Template name as shown in the UI selector, e.g. "Albatross". */
  template: string;
  /** Blocks that must appear at the top level of the converted page. */
  requiredBlocks: BlockRequirement[];
  /** Blocks that must not appear anywhere in the output. */
  forbiddenBlocks?: string[];
  /** If set, the first top-level block must be one of these names. */
  leadBlock?: string[];
  /**
   * Maximum share (0..1) of top-level blocks allowed to be raw `wp:html`
   * fallbacks. High ratios mean the conversion failed to map the page onto
   * real Gutenberg blocks and the page will not restyle under the template.
   */
  maxHtmlFallbackRatio?: number;
  /** Require every wp:image block to carry a non-empty alt attribute. */
  requireImageAlt?: boolean;
}

export interface TemplateFinding {
  rule: string;
  message: string;
}

export interface TemplateMatchResult {
  template: string;
  pass: boolean;
  findings: TemplateFinding[];
  /** Census of top-level block names → counts, for reporting. */
  blockCounts: Record<string, number>;
}

/**
 * Census of TOP-LEVEL block names in serialized Gutenberg markup.
 * Nested blocks (e.g. wp:list-item inside wp:list) are not counted at the
 * top level but are included in `allNames` for forbidden-block checks.
 */
export function censusBlocks(serialized: string): {
  topLevel: string[];
  allNames: Set<string>;
} {
  const topLevel: string[] = [];
  const allNames = new Set<string>();
  let depth = 0;
  // Tokenize open/close/self-closing comments in document order.
  const token = /<!--\s+(\/)?wp:([a-z][a-z0-9-]*)(?:\s+\{[\s\S]*?\})?\s*(\/)?-->/g;
  let match: RegExpExecArray | null;
  while ((match = token.exec(serialized))) {
    const [, closing, name, selfClosing] = match;
    allNames.add(name);
    if (closing) {
      depth = Math.max(0, depth - 1);
    } else {
      if (depth === 0) topLevel.push(name);
      if (!selfClosing) depth += 1;
    }
  }
  return { topLevel, allNames };
}

export function verifyTemplateMatch(serialized: string, contract: TemplateContract): TemplateMatchResult {
  const findings: TemplateFinding[] = [];
  const { topLevel, allNames } = censusBlocks(serialized);

  const blockCounts: Record<string, number> = {};
  for (const name of topLevel) blockCounts[name] = (blockCounts[name] ?? 0) + 1;

  if (topLevel.length === 0) {
    findings.push({ rule: "non-empty", message: "Output contains no Gutenberg blocks." });
  }

  for (const requirement of contract.requiredBlocks) {
    const count = blockCounts[requirement.name] ?? 0;
    const min = requirement.min ?? 1;
    if (count < min) {
      findings.push({
        rule: "required-block",
        message: `Template "${contract.template}" requires at least ${min} wp:${requirement.name} block${min === 1 ? "" : "s"}; found ${count}.`,
      });
    }
    if (requirement.max !== undefined && count > requirement.max) {
      findings.push({
        rule: "max-block",
        message: `Template "${contract.template}" allows at most ${requirement.max} wp:${requirement.name} block${requirement.max === 1 ? "" : "s"}; found ${count}.`,
      });
    }
  }

  for (const forbidden of contract.forbiddenBlocks ?? []) {
    if (allNames.has(forbidden)) {
      findings.push({
        rule: "forbidden-block",
        message: `Template "${contract.template}" forbids wp:${forbidden} blocks.`,
      });
    }
  }

  if (contract.leadBlock && topLevel.length > 0 && !contract.leadBlock.includes(topLevel[0])) {
    findings.push({
      rule: "lead-block",
      message: `Template "${contract.template}" expects the page to open with ${contract.leadBlock
        .map((n) => `wp:${n}`)
        .join(" or ")}; found wp:${topLevel[0]}.`,
    });
  }

  if (contract.maxHtmlFallbackRatio !== undefined && topLevel.length > 0) {
    const htmlCount = blockCounts["html"] ?? 0;
    const ratio = htmlCount / topLevel.length;
    if (ratio > contract.maxHtmlFallbackRatio) {
      findings.push({
        rule: "html-fallback-ratio",
        message: `${htmlCount}/${topLevel.length} top-level blocks are raw wp:html fallbacks (${(ratio * 100).toFixed(0)}%), above the ${(contract.maxHtmlFallbackRatio * 100).toFixed(0)}% budget for "${contract.template}".`,
      });
    }
  }

  if (contract.requireImageAlt) {
    const imgTag = /<img\b[^>]*>/gi;
    let img: RegExpExecArray | null;
    while ((img = imgTag.exec(serialized))) {
      if (!/\salt\s*=\s*"[^"]+"/i.test(img[0])) {
        findings.push({
          rule: "image-alt",
          message: `Template "${contract.template}" requires alt text on every image; found an image without one.`,
        });
        break;
      }
    }
  }

  return { template: contract.template, pass: findings.length === 0, findings, blockCounts };
}
