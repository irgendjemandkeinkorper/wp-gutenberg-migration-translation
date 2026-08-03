import { IR_SCHEMA_VERSION, LEGACY_IR_SCHEMA_VERSION, type ClassificationMethod, type JsonObject, type SemanticDocument, type SemanticNode, type SourceEvidence, type NodeKind } from "./types";
import { assertValidSemanticDocument, isSupportedVersion } from "./validate";
import { stableNodeId } from "./ids";

export interface LegacyIrNodeV0 {
  id: string;
  type: string;
  sourcePath: string;
  htmlExcerpt: string;
  text?: string | null;
  attributes?: Record<string, string>;
  assetIds?: string[];
  confidence?: number;
  method?: ClassificationMethod;
  children?: LegacyIrNodeV0[];
  extensions?: JsonObject;
}

export interface LegacyIrDocumentV0 {
  schemaVersion: typeof LEGACY_IR_SCHEMA_VERSION;
  documentId: string;
  sourceSnapshotId: string;
  sourcePath?: string;
  htmlExcerpt?: string;
  title?: string | null;
  nodes: LegacyIrNodeV0[];
  extensions?: JsonObject;
}

export interface IrMigrationResult {
  document: SemanticDocument;
  fromVersion: string;
  toVersion: string;
  changes: string[];
}

/**
 * Upgrade a persisted IR document without changing the meaning of a v1
 * document. Major-version changes require an explicit future migrator.
 */
export function migrateToCurrentIr(input: unknown): IrMigrationResult {
  if (!isRecord(input) || typeof input.schemaVersion !== "string") {
    throw new Error("Cannot migrate semantic IR without a schemaVersion.");
  }

  if (isSupportedVersion(input.schemaVersion)) {
    assertValidSemanticDocument(input);
    const document = clone(input);
    return {
      document,
      fromVersion: input.schemaVersion,
      toVersion: input.schemaVersion,
      changes: [],
    };
  }

  if (input.schemaVersion !== LEGACY_IR_SCHEMA_VERSION) {
    throw new Error(
      `No migration is registered for semantic IR schema ${input.schemaVersion}. ` +
        "Major-version changes require an explicit migration.",
    );
  }

  const document = migrateLegacyDocument(input);
  assertValidSemanticDocument(document);
  return {
    document,
    fromVersion: LEGACY_IR_SCHEMA_VERSION,
    toVersion: IR_SCHEMA_VERSION,
    changes: [
      "Wrapped legacy nodes in a document root with ordered children.",
      "Mapped legacy sourcePath/htmlExcerpt fields to source evidence references.",
      "Mapped asset IDs to ID-only asset references.",
      "Preserved unsupported legacy node HTML as unknown content.",
    ],
  };
}

function migrateLegacyDocument(input: Record<string, unknown>): SemanticDocument {
  if (typeof input.documentId !== "string" || !input.documentId) throw new Error("Legacy documentId is required.");
  if (typeof input.sourceSnapshotId !== "string" || !input.sourceSnapshotId) throw new Error("Legacy sourceSnapshotId is required.");
  if (!Array.isArray(input.nodes)) throw new Error("Legacy nodes must be an array.");

  const source = legacyEvidence(
    input.sourceSnapshotId,
    typeof input.sourcePath === "string" ? input.sourcePath : "/",
    typeof input.htmlExcerpt === "string" ? input.htmlExcerpt : "",
  );
  const root: SemanticNode = {
    id: input.documentId,
    kind: "document",
    source,
    children: input.nodes.map((node, index) => legacyNode(node, source, `${source.locator.value}/child[${index}]`)),
    text: null,
    attributes: {},
    assetRefs: [],
    classification: { confidence: 1, method: "rule", rationale: "Migrated document root." },
    auditEvents: [migrationEvent("legacy-document")],
    extensions: isJsonObject(input.extensions) ? clone(input.extensions) : {},
  };

  const document: SemanticDocument = {
    schemaVersion: IR_SCHEMA_VERSION,
    documentId: input.documentId,
    source,
    title: input.title === null || typeof input.title === "string" ? input.title ?? null : null,
    root: root as SemanticDocument["root"],
    compatibility: {
      reader: "forward-compatible",
      minimumReaderVersion: IR_SCHEMA_VERSION,
      unknownFields: "preserve",
    },
    extensions: isJsonObject(input.extensions) ? clone(input.extensions) : {},
  };
  return document;
}

function legacyNode(input: unknown, parentSource: SourceEvidence, fallbackPath: string): SemanticNode {
  if (!isRecord(input)) throw new Error(`Legacy node at ${fallbackPath} must be an object.`);
  const sourcePath = typeof input.sourcePath === "string" && input.sourcePath ? input.sourcePath : fallbackPath;
  const htmlExcerpt = typeof input.htmlExcerpt === "string" ? input.htmlExcerpt : "";
  const originalKind = typeof input.type === "string" ? input.type : "unknown";
  const kind = mapLegacyKind(originalKind);
  const id = typeof input.id === "string" && input.id ? input.id : stableNodeId({
    snapshotId: parentSource.snapshotId,
    structuralPath: sourcePath,
    kind,
  });
  const children = Array.isArray(input.children)
    ? input.children.map((child, index) => legacyNode(child, parentSource, `${sourcePath}/child[${index}]`))
    : [];
  const assets = Array.isArray(input.assetIds)
    ? input.assetIds.map((assetId, ordinal) => ({
        assetId: typeof assetId === "string" ? assetId : String(assetId),
        role: "legacy",
        ordinal,
        extensions: {},
      }))
    : [];
  const source = legacyEvidence(parentSource.snapshotId, sourcePath, htmlExcerpt);
  const base = {
    id,
    kind,
    source,
    children,
    text: input.text === null || typeof input.text === "string" ? input.text ?? null : null,
    attributes: isStringMap(input.attributes) ? clone(input.attributes) : {},
    assetRefs: assets,
    classification: {
      confidence: typeof input.confidence === "number" && Number.isFinite(input.confidence)
        ? Math.min(1, Math.max(0, input.confidence))
        : 0.5,
      method: isMethod(input.method) ? input.method : "rule",
      rationale: "Migrated from semantic IR 0.1.0.",
    },
    auditEvents: [migrationEvent("legacy-node")],
    extensions: isJsonObject(input.extensions) ? clone(input.extensions) : {},
  };

  if (kind === "unknown") {
    return {
      ...base,
      kind: "unknown",
      unknown: {
        originalKind,
        rawHtml: htmlExcerpt,
        reason: `Legacy node type ${originalKind} has no v1 mapping.`,
        rawAttributes: isStringMap(input.attributes) ? clone(input.attributes) : {},
      },
    };
  }
  return base as SemanticNode;
}

function legacyEvidence(snapshotId: string, path: string, excerpt: string): SourceEvidence {
  return {
    snapshotId,
    locator: { kind: "structural-path", value: path || "/" },
    htmlExcerpt: {
      contentKind: "decoded-html",
      contentSha256: "legacy-inline",
      storageKey: `legacy/${snapshotId}/decoded-html`,
      startOffset: 0,
      endOffset: excerpt.length,
      excerpt,
    },
  };
}

function mapLegacyKind(value: string): NodeKind {
  const aliases: Record<string, NodeKind> = {
    text: "paragraph",
    richText: "rich-text-span",
    "rich-text": "rich-text-span",
    "button-group": "button-group",
    unsupported: "unknown",
  };
  const mapped = aliases[value] ?? value;
  return [
    "document", "section", "heading", "paragraph", "rich-text-span", "list", "list-item", "quote", "code", "table",
    "image", "gallery", "figure", "caption", "cta", "button-group", "button", "columns", "group", "embed", "media", "form", "widget", "unknown",
  ].includes(mapped) ? mapped as NodeKind : "unknown";
}

function migrationEvent(code: string) {
  return {
    type: "migrated" as const,
    code,
    message: "Migrated from semantic IR 0.1.0.",
    at: "1970-01-01T00:00:00.000Z",
  };
}

function isMethod(value: unknown): value is ClassificationMethod {
  return value === "rule" || value === "adapter" || value === "model" || value === "operator";
}

function isStringMap(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");
}

function isJsonObject(value: unknown): value is JsonObject {
  return isRecord(value) && Object.values(value).every((entry) => isJsonValue(entry));
}

function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isJsonObject(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
