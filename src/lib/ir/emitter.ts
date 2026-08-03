import type { ArchivedPageSnapshot } from "../acquisition/contract";
import { lookupMediaRecord, type MediaRegistry } from "../media/registry";
import { tokenIndices } from "../tokens";
import type { AssetRef, PageResult } from "../types";
import { sourceEvidenceFromSnapshot } from "./evidence";
import { stableNodeId } from "./ids";
import {
  IR_SCHEMA_VERSION,
  type AssetReference,
  type Classification,
  type JsonObject,
  type NodeKind,
  type SemanticDocument,
  type SemanticNode,
  type SourceEvidence,
  type SourceLocator,
  type TransformationEvent,
  type UnknownNode,
} from "./types";
import { assertValidSemanticDocument } from "./validate";

const DEFAULT_AUDIT_TIME = "1970-01-01T00:00:00.000Z";
const MAX_SEARCH_EXCERPT = 4_096;

/** An exclusion recorded by an upstream extraction/tokenization stage. */
export interface BoilerplateExclusion {
  selector: string;
  count: number;
  reason: string;
}

export interface SemanticIrEmitterOptions {
  /** The immutable acquisition record that anchors every emitted evidence reference. */
  snapshot: ArchivedPageSnapshot;
  /** The deterministic pipeline result returned by convertPage. */
  page: PageResult;
  /** Optional pre-validation fragment, used only when it is itself deterministic. */
  deterministicHtml?: string;
  /** Explicit media-registry identity overrides, keyed by tokenizer asset index. */
  assetIds?: ReadonlyMap<number, string> | Readonly<Record<number, string>>;
  /** Acquired media evidence used to resolve tokenizer URLs to registry record IDs. */
  mediaRegistry?: MediaRegistry;
  /** Explicit audit records for boilerplate removed before tokenization. */
  boilerplateExclusions?: readonly BoilerplateExclusion[];
  /** Stable timestamp for audit events. Defaults to acquisition retrieval time. */
  auditAt?: string;
}

export class SemanticIrEmissionError extends Error {
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "SemanticIrEmissionError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Adapt the existing deterministic extraction/tokenization result to semantic
 * IR v1. This function never calls an LLM, fetches a URL, or emits Gutenberg
 * blocks. `page.intermediateHtml` remains the canonical conversion artifact.
 */
export function emitSemanticIr(options: SemanticIrEmitterOptions): SemanticDocument {
  const { page, snapshot } = options;
  const html = options.deterministicHtml ?? page.intermediateHtml;
  if (!html.trim()) {
    throw new SemanticIrEmissionError(
      "empty-deterministic-html",
      "Cannot emit semantic IR from an empty deterministic conversion fragment.",
    );
  }

  const assets = indexAssets(page.images);
  const tokenCounts = countTokens(html);
  assertTokenAccountability(tokenCounts, assets);
  const assetReferences = createAssetReferences(assets, snapshot, page.sourceUrl, options);
  const assetRefsByIndex = new Map(assetReferences.map((reference) => [reference.index, reference.ref]));
  const auditAt = options.auditAt ?? snapshot.record.retrieval.retrievedAt ?? DEFAULT_AUDIT_TIME;
  const parsed = parseFragment(html);
  const rootPath = "/body[1]";
  const rootSource = evidenceFor(snapshot, rootPath, snapshot.decodedHtml, "body");
  const rootEvents = rootAuditEvents(page, options.boilerplateExclusions ?? [], auditAt);
  const childContext: EmitContext = {
    snapshot,
    auditAt,
    assets,
    assetRefsByIndex,
    pageUrl: page.sourceUrl,
  };
  const children = emitChildNodes(parsed.body, rootPath, childContext, true);

  const documentId = stableNodeId({
    snapshotId: snapshot.record.recordId,
    structuralPath: "/",
    kind: "document",
  });
  const document: SemanticDocument = {
    schemaVersion: IR_SCHEMA_VERSION,
    documentId,
    source: rootSource,
    title: page.title || null,
    root: {
      id: documentId,
      kind: "document",
      source: rootSource,
      children,
      text: null,
      attributes: {},
      assetRefs: [],
      classification: {
        confidence: 1,
        method: "adapter",
        rationale: "Deterministic extraction/tokenization pipeline root.",
      },
      auditEvents: rootEvents,
      extensions: {
        sourceUrl: page.sourceUrl,
        conversion: "deterministic",
        assetTokenCount: page.images.length,
      },
    },
    compatibility: {
      reader: "forward-compatible",
      minimumReaderVersion: IR_SCHEMA_VERSION,
      unknownFields: "preserve",
    },
    extensions: {
      emitter: "blockify-deterministic-ir-v1",
      pipeline: "extract-tokenize-validate",
    },
  };

  try {
    assertValidSemanticDocument(document);
  } catch (error) {
    throw new SemanticIrEmissionError(
      "invalid-emitted-ir",
      error instanceof Error ? error.message : String(error),
    );
  }
  return document;
}

interface IndexedAsset {
  asset: AssetRef;
  index: number;
}

interface ResolvedAssetReference {
  index: number;
  ref: AssetReference;
}

interface EmitContext {
  snapshot: ArchivedPageSnapshot;
  auditAt: string;
  assets: Map<number, IndexedAsset>;
  assetRefsByIndex: Map<number, AssetReference>;
  pageUrl: string;
}

function parseFragment(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function indexAssets(assets: readonly AssetRef[]): Map<number, IndexedAsset> {
  const indexed = new Map<number, IndexedAsset>();
  for (const asset of assets) {
    if (!Number.isInteger(asset.index) || asset.index < 0) {
      throw new SemanticIrEmissionError(
        "invalid-asset-index",
        `Asset index ${String(asset.index)} is not a non-negative integer.`,
      );
    }
    if (indexed.has(asset.index)) {
      throw new SemanticIrEmissionError(
        "duplicate-asset-index",
        `Tokenizer returned duplicate asset index ${asset.index}.`,
        { index: asset.index },
      );
    }
    indexed.set(asset.index, { asset, index: asset.index });
  }
  return indexed;
}

function countTokens(html: string): Map<number, number> {
  const counts = new Map<number, number>();
  for (const index of tokenIndices(html)) counts.set(index, (counts.get(index) ?? 0) + 1);
  return counts;
}

function assertTokenAccountability(
  tokenCounts: Map<number, number>,
  assets: Map<number, IndexedAsset>,
): void {
  const missing = [...assets.keys()].filter((index) => tokenCounts.get(index) !== 1);
  const extra = [...tokenCounts.keys()].filter((index) => !assets.has(index));
  const duplicated = [...tokenCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([index]) => index);
  if (missing.length || extra.length || duplicated.length) {
    throw new SemanticIrEmissionError(
      "asset-token-drift",
      "Deterministic HTML does not contain each issued asset token exactly once.",
      { missing, extra, duplicated },
    );
  }
}

function createAssetReferences(
  assets: Map<number, IndexedAsset>,
  snapshot: ArchivedPageSnapshot,
  pageUrl: string,
  options: SemanticIrEmitterOptions,
): ResolvedAssetReference[] {
  return [...assets.values()].sort((a, b) => a.index - b.index).map(({ asset, index }) => {
    const assetId = resolveAssetId(index, asset, snapshot, pageUrl, options);
    return {
      index,
      ref: {
        assetId,
        role: asset.type === "image" ? "content-image" : `unsupported-${asset.type}`,
        ordinal: index,
        extensions: {
          tokenizerIndex: index,
          assetType: asset.type,
          tagName: asset.tagName,
        },
      },
    };
  });
}

function resolveAssetId(
  index: number,
  asset: AssetRef,
  snapshot: ArchivedPageSnapshot,
  pageUrl: string,
  options: SemanticIrEmitterOptions,
): string {
  const explicit = lookupAssetId(options.assetIds, index);
  if (explicit) return explicit;

  if (options.mediaRegistry) {
    const result = lookupMediaRecord(options.mediaRegistry, asset.src, pageUrl || undefined);
    if (result.record) return result.record.recordId;
  }

  // A deterministic unresolved identity is still an ID-only reference. It is
  // intentionally marked unresolved so later media reconciliation can replace
  // it; the IR never embeds the transient source URL.
  return stableNodeId({
    snapshotId: snapshot.record.recordId,
    structuralPath: `/asset[${index}]`,
    kind: "media",
  }).replace("ir-node-v1-", "asset-unresolved-v1-");
}

function lookupAssetId(
  input: SemanticIrEmitterOptions["assetIds"],
  index: number,
): string | null {
  if (!input) return null;
  const value = input instanceof Map
    ? input.get(index)
    : (input as Readonly<Record<number, string>>)[index];
  if (value === undefined) return null;
  if (typeof value !== "string" || !value.trim()) {
    throw new SemanticIrEmissionError(
      "invalid-asset-id",
      `Asset ID override for tokenizer index ${index} must be a non-empty string.`,
      { index },
    );
  }
  return value;
}

function emitChildNodes(
  parent: Element,
  parentPath: string,
  context: EmitContext,
  includeTextNodes = false,
): SemanticNode[] {
  const nodes: SemanticNode[] = [];
  const elementOrdinals = new Map<string, number>();
  let textOrdinal = 0;
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      if (!normalizeText(child.textContent ?? "")) continue;
      if (!includeTextNodes) continue;
      textOrdinal += 1;
      const path = `${parentPath}/text()[${textOrdinal}]`;
      nodes.push(emitTextNode(child.textContent ?? "", path, context));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const element = child as Element;
    const tag = element.tagName.toLowerCase();
    const ordinal = (elementOrdinals.get(tag) ?? 0) + 1;
    elementOrdinals.set(tag, ordinal);
    nodes.push(emitElementNode(element, `${parentPath}/${tag}[${ordinal}]`, context));
  }
  return nodes;
}

function emitTextNode(text: string, path: string, context: EmitContext): SemanticNode {
  const value = normalizeText(text);
  return createTypedNode("paragraph", path, evidenceFor(context.snapshot, path, value, "text"), context, {
    text: value,
    attributes: {},
    children: [],
    auditEvents: [event("extracted", "text-node", "Direct text was emitted as a paragraph.", context.auditAt)],
  });
}

function emitElementNode(element: Element, path: string, context: EmitContext): SemanticNode {
  const token = loneToken(element);
  if (token !== null) return emitAssetNode(element, path, token, context);

  if (["img", "iframe", "object", "embed", "video", "audio", "form"].includes(element.tagName.toLowerCase())) {
    throw new SemanticIrEmissionError(
      "un-tokenized-asset",
      `Media element <${element.tagName.toLowerCase()}> at ${path} was not represented by an asset token.`,
      { path, tag: element.tagName.toLowerCase() },
    );
  }

  const containedTokens = tokenIndices(element.textContent ?? "");
  if (containedTokens.length) {
    throw new SemanticIrEmissionError(
      "asset-token-not-isolated",
      `Asset token(s) ${containedTokens.join(", ")} are not isolated in ${path}.`,
      { path, tokens: containedTokens },
    );
  }

  const kind = nodeKindForTag(element.tagName.toLowerCase());
  const sourceExcerpt = element.outerHTML;
  const source = evidenceFor(context.snapshot, path, sourceExcerpt, element.tagName.toLowerCase());
  const attrs = attributesFor(element);
  if (kind === "unknown") {
    return emitUnknownNode(element, path, source, attrs, context);
  }

  const children = shouldEmitChildren(kind, element)
    ? emitChildNodes(element, path, context)
    : [];
  const text = textForNode(kind, element, children);
  return createTypedNode(kind, path, source, context, {
    text,
    attributes: attrs,
    children,
    auditEvents: [event("extracted", `element-${kind}`, `Mapped <${element.tagName.toLowerCase()}> to ${kind}.`, context.auditAt)],
  });
}

function emitAssetNode(
  element: Element,
  path: string,
  index: number,
  context: EmitContext,
): SemanticNode {
  const asset = context.assets.get(index);
  const reference = context.assetRefsByIndex.get(index);
  if (!asset || !reference) {
    throw new SemanticIrEmissionError(
      "asset-token-unresolved",
      `Asset token ${index} has no corresponding tokenizer asset.`,
      { index, path },
    );
  }
  const kind = assetKind(asset.asset);
  const sourceExcerpt = asset.asset.excerpt || element.outerHTML;
  return createTypedNode(kind, path, evidenceFor(context.snapshot, path, sourceExcerpt, asset.asset.tagName), context, {
    text: null,
    attributes: sortedStringMap(asset.asset.attributes),
    children: [],
    assetRefs: [reference],
    auditEvents: [event(
      "extracted",
      "asset-token-resolved",
      `Resolved ASSET_${index} to an ID-only ${kind} reference.`,
      context.auditAt,
      { tokenizerIndex: index },
    )],
  });
}

function createTypedNode(
  kind: Exclude<NodeKind, "unknown">,
  path: string,
  source: SourceEvidence,
  context: EmitContext,
  values: Partial<SemanticNodeBaseValues>,
): SemanticNode {
  return {
    id: stableNodeId({ snapshotId: context.snapshot.record.recordId, structuralPath: path, kind }),
    kind,
    source,
    children: values.children ?? [],
    text: values.text ?? null,
    attributes: values.attributes ?? {},
    assetRefs: values.assetRefs ?? [],
    classification: values.classification ?? classificationFor(kind),
    auditEvents: values.auditEvents ?? [],
    extensions: values.extensions ?? {},
  } as SemanticNode;
}

interface SemanticNodeBaseValues {
  children: SemanticNode[];
  text: string | null;
  attributes: Record<string, string>;
  assetRefs: AssetReference[];
  classification: Classification;
  auditEvents: TransformationEvent[];
  extensions: JsonObject;
}

function emitUnknownNode(
  element: Element,
  path: string,
  source: SourceEvidence,
  attrs: Record<string, string>,
  context: EmitContext,
): UnknownNode {
  const rawHtml = element.outerHTML;
  const indexes = tokenIndices(rawHtml);
  const assetRefs = indexes.map((index) => {
    const reference = context.assetRefsByIndex.get(index);
    if (!reference) {
      throw new SemanticIrEmissionError(
        "asset-token-unresolved",
        `Unknown node ${path} contains unresolved asset token ${index}.`,
        { index, path },
      );
    }
    return reference;
  });
  return {
    id: stableNodeId({ snapshotId: context.snapshot.record.recordId, structuralPath: path, kind: "unknown" }),
    kind: "unknown",
    source,
    children: [],
    text: normalizeText(element.textContent ?? "") || null,
    attributes: attrs,
    assetRefs,
    classification: {
      confidence: 0.2,
      method: "adapter",
      rationale: `No semantic IR v1 mapping exists for <${element.tagName.toLowerCase()}>; raw content is preserved.`,
    },
    auditEvents: [event(
      "preserved",
      "unknown-content-preserved",
      `Preserved unsupported <${element.tagName.toLowerCase()}> content without dropping it.`,
      context.auditAt,
      { originalKind: element.tagName.toLowerCase() },
    )],
    extensions: {},
    unknown: {
      originalKind: element.tagName.toLowerCase(),
      rawHtml,
      reason: "No semantic IR v1 mapping exists for this source element.",
      rawAttributes: attrs,
    },
  };
}

function nodeKindForTag(tag: string): NodeKind {
  switch (tag) {
    case "article":
    case "main":
    case "section":
      return "section";
    case "div":
      return "group";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return "heading";
    case "p":
      return "paragraph";
    case "ul":
    case "ol":
      return "list";
    case "li":
      return "list-item";
    case "blockquote":
      return "quote";
    case "pre":
      return "code";
    case "table":
      return "table";
    case "figure":
      return "figure";
    case "figcaption":
      return "caption";
    case "strong":
    case "b":
    case "em":
    case "i":
    case "a":
    case "br":
    case "sup":
    case "sub":
      return "rich-text-span";
    case "code":
      return "rich-text-span";
    case "button":
      return "button";
    case "hr":
    default:
      return "unknown";
  }
}

function assetKind(asset: AssetRef): Exclude<NodeKind, "document" | "unknown"> {
  switch (asset.type) {
    case "image":
      return "image";
    case "iframe":
    case "object":
    case "embed":
      return "embed";
    case "form":
      return "form";
    case "video":
    case "audio":
      return "media";
  }
}

function shouldEmitChildren(kind: NodeKind, element: Element): boolean {
  if (kind === "code" && element.tagName.toLowerCase() === "pre") return false;
  if (kind === "image" || kind === "embed" || kind === "media" || kind === "form" || kind === "table") return false;
  return element.childNodes.length > 0;
}

function textForNode(kind: NodeKind, element: Element, children: SemanticNode[]): string | null {
  if (kind === "code") return element.textContent ?? null;
  if (kind === "rich-text-span" && element.tagName.toLowerCase() === "br") return "\n";
  if (children.length && element.children.length) {
    const directText = Array.from(element.childNodes)
      .filter((child) => child.nodeType === Node.TEXT_NODE)
      .map((child) => child.textContent ?? "")
      .join("");
    return normalizeText(directText) || null;
  }
  return normalizeText(element.textContent ?? "") || null;
}

function loneToken(element: Element): number | null {
  const text = (element.textContent ?? "").trim();
  const indexes = tokenIndices(text);
  if (indexes.length === 1 && text === `⟦ASSET_${indexes[0]}⟧`) return indexes[0];
  return null;
}

function attributesFor(element: Element): Record<string, string> {
  return sortedStringMap(Object.fromEntries(
    Array.from(element.attributes).map((attribute) => [attribute.name, attribute.value]),
  ));
}

function sortedStringMap(input: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));
}

function classificationFor(kind: NodeKind): Classification {
  return {
    confidence: kind === "unknown" ? 0.2 : 0.98,
    method: "adapter",
    rationale: "Deterministic HTML element mapping.",
  };
}

function evidenceFor(
  snapshot: ArchivedPageSnapshot,
  path: string,
  excerpt: string,
  tag: string,
): SourceEvidence {
  const raw = snapshot.decodedHtml;
  const boundedExcerpt = tag === "unknown"
    ? excerpt
    : excerpt.slice(0, MAX_SEARCH_EXCERPT);
  const exactStart = raw.indexOf(boundedExcerpt);
  const startOffset = exactStart >= 0 ? exactStart : 0;
  const endOffset = exactStart >= 0 ? exactStart + boundedExcerpt.length : raw.length;
  const source = sourceEvidenceFromSnapshot(snapshot, structuralLocator(path), { startOffset, endOffset });
  source.htmlExcerpt.excerpt = boundedExcerpt;
  return source;
}

function structuralLocator(path: string): SourceLocator {
  return { kind: "structural-path", value: path };
}

function rootAuditEvents(
  page: PageResult,
  exclusions: readonly BoilerplateExclusion[],
  auditAt: string,
): TransformationEvent[] {
  const events: TransformationEvent[] = [
    event("extracted", "pipeline-extraction", "Semantic IR was emitted from the existing extraction/tokenization pipeline.", auditAt),
    event("normalized", "deterministic-conversion", "The deterministic intermediate HTML is the source of truth for node order and content.", auditAt),
  ];
  if (exclusions.length) {
    events.push(event(
      "normalized",
      "boilerplate-exclusion",
      `Recorded ${exclusions.length} explicit boilerplate exclusion audit record${exclusions.length === 1 ? "" : "s"}.`,
      auditAt,
      { exclusions: exclusions.map((exclusion) => ({ ...exclusion })) },
    ));
  } else {
    events.push(event(
      "warning",
      "boilerplate-exclusion-not-reported",
      "The upstream pipeline did not provide explicit boilerplate exclusion records for this emission.",
      auditAt,
    ));
  }
  for (const warning of page.warnings) {
    events.push(event("warning", "pipeline-warning", warning, auditAt));
  }
  if (page.lostPositions.length) {
    events.push(event(
      "warning",
      "asset-position-repaired",
      "The deterministic validator repaired asset positions before IR emission.",
      auditAt,
      { tokenizerIndices: [...page.lostPositions] },
    ));
  }
  return events;
}

function event(
  type: TransformationEvent["type"],
  code: string,
  message: string,
  at: string,
  data?: JsonObject,
): TransformationEvent {
  return { type, code, message, at, ...(data ? { data } : {}) };
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
