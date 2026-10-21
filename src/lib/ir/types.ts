/**
 * Source-agnostic semantic representation shared by extraction and future
 * target compilers. The IR deliberately refers to acquired evidence and
 * asset IDs; it never owns fetching, media discovery, or serialization.
 */

export const IR_SCHEMA_VERSION = "1.0.0" as const;
export const LEGACY_IR_SCHEMA_VERSION = "0.1.0" as const;

export type IrSchemaVersion = `1.${number}.${number}`;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export const IR_NODE_KINDS = [
  "document",
  "section",
  "heading",
  "paragraph",
  "rich-text-span",
  "list",
  "list-item",
  "quote",
  "code",
  "table",
  "image",
  "gallery",
  "figure",
  "caption",
  "cta",
  "button-group",
  "button",
  "columns",
  "group",
  "embed",
  "media",
  "form",
  "widget",
  "unknown",
] as const;

export type NodeKind = (typeof IR_NODE_KINDS)[number];

export type SourceLocatorKind = "css" | "xpath" | "structural-path";

export interface SourceLocator {
  kind: SourceLocatorKind;
  value: string;
}

/** A byte/character range inside an immutable acquisition content object. */
export interface HtmlExcerptReference {
  contentKind: "decoded-html" | "raw-bytes";
  contentSha256: string;
  storageKey: string;
  startOffset: number;
  endOffset: number;
  /** Optional inline copy used by migration fixtures and unknown-content preservation. */
  excerpt?: string;
}

/**
 * `snapshotId` is an AcquisitionRecord.recordId. The hash and storage key
 * identify the immutable content object in that record.
 */
export interface SourceEvidence {
  snapshotId: string;
  locator: SourceLocator;
  htmlExcerpt: HtmlExcerptReference;
}

/** Asset references are intentionally ID-only; URLs belong to the acquisition/media registry. */
export interface AssetReference {
  assetId: string;
  role: string;
  ordinal: number;
  extensions: JsonObject;
}

export type ClassificationMethod = "rule" | "adapter" | "model" | "operator";

export interface Classification {
  confidence: number;
  method: ClassificationMethod;
  rationale?: string;
}

export type TransformationEventType =
  "extracted" | "classified" | "normalized" | "preserved" | "migrated" | "operator-override" | "warning";

export interface TransformationEvent {
  type: TransformationEventType;
  code: string;
  message: string;
  at: string;
  data?: JsonObject;
}

export interface UnknownContent {
  /** Original source kind/tag when it was available. */
  originalKind: string | null;
  /** Exact HTML that cannot yet be mapped to a supported semantic kind. */
  rawHtml: string;
  reason: string;
  rawAttributes: Record<string, string>;
}

export interface SemanticNodeBase<K extends NodeKind> {
  id: string;
  kind: K;
  source: SourceEvidence;
  /** Children are a sequence, so source order is part of the contract. */
  children: SemanticNode[];
  text: string | null;
  attributes: Record<string, string>;
  assetRefs: AssetReference[];
  classification: Classification;
  auditEvents: TransformationEvent[];
  extensions: JsonObject;
}

export type TypedSemanticNode = SemanticNodeBase<Exclude<NodeKind, "unknown">>;

export type UnknownNode = SemanticNodeBase<"unknown"> & {
  unknown: UnknownContent;
};

export type SemanticNode = TypedSemanticNode | UnknownNode;

export type DocumentNode = SemanticNodeBase<"document">;
export type SectionNode = SemanticNodeBase<"section">;
export type HeadingNode = SemanticNodeBase<"heading">;
export type ParagraphNode = SemanticNodeBase<"paragraph">;
export type RichTextSpanNode = SemanticNodeBase<"rich-text-span">;
export type ListNode = SemanticNodeBase<"list">;
export type ListItemNode = SemanticNodeBase<"list-item">;
export type QuoteNode = SemanticNodeBase<"quote">;
export type CodeNode = SemanticNodeBase<"code">;
export type TableNode = SemanticNodeBase<"table">;
export type ImageNode = SemanticNodeBase<"image">;
export type GalleryNode = SemanticNodeBase<"gallery">;
export type FigureNode = SemanticNodeBase<"figure">;
export type CaptionNode = SemanticNodeBase<"caption">;
export type CtaNode = SemanticNodeBase<"cta">;
export type ButtonGroupNode = SemanticNodeBase<"button-group">;
export type ButtonNode = SemanticNodeBase<"button">;
export type ColumnsNode = SemanticNodeBase<"columns">;
export type GroupNode = SemanticNodeBase<"group">;
export type EmbedNode = SemanticNodeBase<"embed">;
export type MediaNode = SemanticNodeBase<"media">;
export type FormNode = SemanticNodeBase<"form">;
export type WidgetNode = SemanticNodeBase<"widget">;

export interface IrCompatibilityPolicy {
  reader: "forward-compatible";
  minimumReaderVersion: IrSchemaVersion;
  unknownFields: "preserve";
}

export interface SemanticDocument {
  schemaVersion: IrSchemaVersion;
  documentId: string;
  source: SourceEvidence;
  title: string | null;
  root: DocumentNode;
  compatibility: IrCompatibilityPolicy;
  extensions: JsonObject;
}

export interface StableNodeIdInput {
  snapshotId: string;
  structuralPath: string;
  kind: NodeKind;
}
