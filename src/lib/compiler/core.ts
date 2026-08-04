import type { JsonValue, SemanticNode } from "../ir/types";

export interface CompilerFinding {
  code: string;
  message: string;
  severity: "warning" | "blocking";
  sourceNodeId: string;
}

export interface CoreCompilation {
  markup: string;
  sourceNodeId: string;
  destinationPath: string;
  findings: CompilerFinding[];
}

export interface CoreCompilerOptions {
  /** Attributes which are safe to carry through on inline links. */
  allowedLinkAttributes?: ReadonlySet<string>;
}

const DEFAULT_LINK_ATTRIBUTES = new Set(["href", "title", "target", "rel"]);

/**
 * Compile one supported text-oriented IR node into deterministic Gutenberg
 * markup. The compiler never trusts source HTML as markup; it reconstructs
 * escaped text and a small, explicit inline allowlist from semantic nodes.
 */
export function compileCoreNode(node: SemanticNode, options: CoreCompilerOptions = {}): CoreCompilation {
  const findings: CompilerFinding[] = [];
  const markup = compileBlock(node, findings, {
    allowedLinkAttributes: options.allowedLinkAttributes ?? DEFAULT_LINK_ATTRIBUTES,
    findings,
  });
  return {
    markup,
    sourceNodeId: node.id,
    destinationPath: node.source.locator.value,
    findings,
  };
}

interface RenderContext {
  allowedLinkAttributes: ReadonlySet<string>;
  findings: CompilerFinding[];
}

function compileBlock(node: SemanticNode, findings: CompilerFinding[], options: RenderContext): string {
  switch (node.kind) {
    case "paragraph":
      return block("paragraph", renderInline(node, options));
    case "heading": {
      const level = headingLevel(node);
      return block("heading", `<h${level} class="wp-block-heading">${renderInline(node, options)}</h${level}>`, {
        level,
      });
    }
    case "list":
      return compileList(node, options);
    case "quote":
      return block("quote", `<blockquote class="wp-block-quote">${renderChildrenAsFlow(node, options)}</blockquote>`);
    case "code":
      return block(
        "code",
        `<pre class="wp-block-code"><code>${escapeHtml(node.text ?? renderPlainText(node))}</code></pre>`,
      );
    case "table":
      return compileTable(node, options);
    case "rich-text-span":
    case "list-item":
      return block("paragraph", renderInline(node, options));
    default:
      findings.push({
        code: "unsupported-core-node",
        message: `Node kind ${node.kind} is not supported by the core compiler.`,
        severity: "blocking",
        sourceNodeId: node.id,
      });
      return placeholder(node, `Unsupported core node: ${node.kind}`);
  }
}

function compileList(node: SemanticNode, options: RenderContext): string {
  const ordered = node.attributes.ordered === "true" || node.attributes.type === "ordered";
  const tag = ordered ? "ol" : "ul";
  const inner = node.children
    .map((child) => {
      if (child.kind !== "list-item") {
        options.findings.push({
          code: "list-child-not-item",
          message: `List child ${child.kind} was preserved as a nested block.`,
          severity: "warning",
          sourceNodeId: child.id,
        });
        return compileBlock(child, options.findings, options);
      }
      const nested = child.children
        .filter((nestedChild) => nestedChild.kind === "list")
        .map((nestedChild) => compileList(nestedChild, options))
        .join("\n");
      const inlineChildren = child.children.filter((nestedChild) => nestedChild.kind !== "list");
      const text = inlineChildren.length
        ? inlineChildren.map((nestedChild) => renderInline(nestedChild, options)).join("")
        : escapeHtml(child.text ?? "");
      return `<li>${text}${nested ? `\n${nested}` : ""}</li>`;
    })
    .join("\n");
  const attributes = ordered ? ` {"ordered":true}` : "";
  return `<!-- wp:list${attributes} -->\n<${tag} class="wp-block-list">${inner}</${tag}>\n<!-- /wp:list -->`;
}

function compileTable(node: SemanticNode, options: RenderContext): string {
  const rows = tableRows(node);
  if (!rows.length) {
    options.findings.push({
      code: "table-rows-missing",
      message: "Table IR has no deterministic row representation.",
      severity: "blocking",
      sourceNodeId: node.id,
    });
  }
  const html = rows
    .map((row) => {
      const cells = row.cells
        .map((cell) => {
          const tag = cell.header ? "th" : "td";
          return `<${tag}>${escapeHtml(cell.text)}</${tag}>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return block("table", `<figure class="wp-block-table"><table><tbody>${html}</tbody></table></figure>`);
}

interface TableRow {
  cells: Array<{ text: string; header: boolean }>;
}

function tableRows(node: SemanticNode): TableRow[] {
  const value = node.extensions.rows;
  if (!Array.isArray(value)) return [];
  return value.flatMap((row): TableRow[] => {
    if (!isObject(row) || !Array.isArray(row.cells)) return [];
    const cells = row.cells.flatMap((cell): Array<{ text: string; header: boolean }> => {
      if (!isObject(cell) || typeof cell.text !== "string") return [];
      return [{ text: cell.text, header: cell.header === true }];
    });
    return cells.length ? [{ cells }] : [];
  });
}

function renderChildrenAsFlow(node: SemanticNode, options: RenderContext): string {
  if (!node.children.length) return escapeHtml(node.text ?? "");
  return node.children
    .map((child) => {
      if (child.kind === "paragraph" || child.kind === "rich-text-span")
        return `<p>${renderInline(child, options)}</p>`;
      return renderInline(child, options);
    })
    .join("\n");
}

function renderInline(node: SemanticNode, options: RenderContext): string {
  if (node.kind === "unknown") {
    options.findings.push({
      code: "unsupported-inline-node",
      message: "Unknown content cannot be emitted by the core inline compiler.",
      severity: "blocking",
      sourceNodeId: node.id,
    });
    return placeholder(node, "Unsupported inline content");
  }
  const children = node.children.map((child) => renderInline(child, options)).join("");
  const text = `${escapeHtml(node.text ?? "")}${children}`;
  if (node.kind !== "rich-text-span") return text;
  const tag = sourceTag(node);
  switch (tag) {
    case "strong":
    case "b":
      return `<strong>${text}</strong>`;
    case "em":
    case "i":
      return `<em>${text}</em>`;
    case "code":
      return `<code>${text}</code>`;
    case "br":
      return "<br />";
    case "sup":
      return `<sup>${text}</sup>`;
    case "sub":
      return `<sub>${text}</sub>`;
    case "a":
      return `<a${safeAttributes(node, options.allowedLinkAttributes, options.findings)}>${text}</a>`;
    default:
      return `<span>${text}</span>`;
  }
}

function renderPlainText(node: SemanticNode): string {
  return node.children.map(renderPlainText).join("") || node.text || "";
}

function block(name: string, content: string, attrs?: Record<string, JsonValue>): string {
  const serializedAttrs = attrs && Object.keys(attrs).length ? ` ${JSON.stringify(attrs)}` : "";
  return `<!-- wp:${name}${serializedAttrs} -->\n${content}\n<!-- /wp:${name} -->`;
}

function placeholder(node: SemanticNode, message: string): string {
  const exceptionId = `blockify-${node.id}`;
  return `<!-- wp:html {"blockifyExceptionId":"${escapeAttr(exceptionId)}"} -->\n<div class="blockify-migration-placeholder" data-exception-id="${escapeAttr(exceptionId)}">${escapeHtml(message)}</div>\n<!-- /wp:html -->`;
}

function headingLevel(node: SemanticNode): number {
  const explicit = Number(node.attributes.level);
  if (Number.isInteger(explicit) && explicit >= 1 && explicit <= 6) return explicit;
  const match = node.source.locator.value.match(/\/h([1-6])\[/i);
  return match ? Number(match[1]) : 2;
}

function sourceTag(node: SemanticNode): string {
  const tag = node.extensions.sourceTag;
  return typeof tag === "string" ? tag.toLowerCase() : "span";
}

function safeAttributes(node: SemanticNode, allowed: ReadonlySet<string>, findings: CompilerFinding[]): string {
  const attributes = Object.entries(node.attributes);
  for (const [name] of attributes) {
    if (!allowed.has(name.toLowerCase())) {
      findings.push({
        code: "unsupported-inline-attribute",
        message: `Attribute ${name} was not supported by the Gutenberg inline compiler.`,
        severity: "warning",
        sourceNodeId: node.id,
      });
    }
  }
  return attributes
    .filter(([name]) => allowed.has(name.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ` ${name}="${escapeAttr(value)}"`)
    .join("");
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function isObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
