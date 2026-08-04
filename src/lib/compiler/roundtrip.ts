export interface ParsedGutenbergBlock {
  name: string;
  attributes: Record<string, unknown>;
  innerHtml: string;
  innerBlocks: ParsedGutenbergBlock[];
  path: string;
}

export interface CompilerRoundTripResult {
  valid: boolean;
  blocks: ParsedGutenbergBlock[];
  errors: string[];
}

/** Parse the deterministic subset of Gutenberg delimiters emitted by Blockify. */
export function parseGutenbergBlocks(markup: string): CompilerRoundTripResult {
  const errors: string[] = [];
  const roots: ParsedGutenbergBlock[] = [];
  const stack: Array<ParsedGutenbergBlock & { start: number; contentStart: number }> = [];
  const marker = /<!--\s*(\/?)wp:([a-z0-9][a-z0-9/_-]*)(?:\s+([\s\S]*?))?\s*-->/gi;
  let lastEnd = 0;
  let match: RegExpExecArray | null;
  while ((match = marker.exec(markup)) !== null) {
    const between = markup.slice(lastEnd, match.index);
    if (!stack.length && between.trim()) errors.push(`Unwrapped content before block at offset ${lastEnd}.`);
    const closing = match[1] === "/";
    const name = match[2];
    if (closing) {
      const open = stack.pop();
      if (!open) {
        errors.push(`Unexpected closing block ${name}.`);
      } else if (open.name !== name) {
        errors.push(`Mismatched closing block ${name}; expected ${open.name}.`);
      } else {
        open.innerHtml = markup.slice(open.contentStart, match.index);
        delete (open as Partial<typeof open>).start;
        delete (open as Partial<typeof open>).contentStart;
        if (stack.length) stack[stack.length - 1].innerBlocks.push(open);
        else roots.push(open);
      }
    } else {
      const attributes = parseAttributes(match[3], name, errors);
      const block: ParsedGutenbergBlock & { start: number; contentStart: number } = {
        name,
        attributes,
        innerHtml: "",
        innerBlocks: [],
        path: `/block[${roots.length + stack.length + 1}]`,
        start: match.index,
        contentStart: marker.lastIndex,
      };
      stack.push(block);
    }
    lastEnd = marker.lastIndex;
  }
  if (stack.length) errors.push(`Unclosed block ${stack[stack.length - 1].name}.`);
  if (!stack.length && markup.slice(lastEnd).trim()) errors.push(`Unwrapped content after offset ${lastEnd}.`);
  return { valid: errors.length === 0, blocks: roots, errors };
}

export function verifyCompiledMarkup(markup: string): CompilerRoundTripResult {
  const result = parseGutenbergBlocks(markup);
  const errors = [...result.errors];
  const inspect = (block: ParsedGutenbergBlock): void => {
    if (block.name === "html" && /<\s*script\b|\bon[a-z]+\s*=|javascript:/i.test(block.innerHtml)) {
      errors.push(`Unsafe HTML in block ${block.path}.`);
    }
    for (const child of block.innerBlocks) inspect(child);
  };
  for (const block of result.blocks) inspect(block);
  return { ...result, valid: errors.length === 0, errors };
}

export function stableBlockTree(result: CompilerRoundTripResult): string {
  return JSON.stringify(result.blocks, (_key, value: unknown) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
    }
    return value;
  });
}

function parseAttributes(raw: string | undefined, name: string, errors: string[]): Record<string, unknown> {
  if (!raw?.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw.trim());
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("attributes must be an object");
    return parsed as Record<string, unknown>;
  } catch (error) {
    errors.push(`Invalid attributes for block ${name}: ${error instanceof Error ? error.message : String(error)}.`);
    return {};
  }
}
