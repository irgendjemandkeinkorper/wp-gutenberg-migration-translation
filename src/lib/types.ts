export type AssetType = "image" | "iframe" | "object" | "embed" | "video" | "audio" | "form";

export interface AssetRef {
  index: number;
  type: AssetType;
  src: string; // absolute URL when a page URL was provided
  alt: string;
  caption: string;
  tagName: string;
  attributes: Record<string, string>;
  excerpt: string;
}

export type ImageRef = AssetRef;

export interface ExtractResult {
  title: string;
  html: string;
  /** How the content was isolated, for the step display. */
  note: string;
}

export interface TokenizeResult {
  html: string;
  images: AssetRef[];
}

export interface PageResult {
  title: string;
  sourceUrl: string;
  blocks: string;
  intermediateHtml: string;
  /** Exact input HTML retained for migration QA. */
  sourceHtml: string;
  placeholders: MigrationPlaceholder[];
  images: AssetRef[];
  /** indices whose position was lost and were re-appended at the end */
  lostPositions: number[];
  warnings: string[];
}

export interface MigrationPlaceholder {
  index: number;
  kind: string;
  source: string;
  label: string;
}

export interface BundlePage {
  /** Stable import/reconciliation identity. WXR derives one from the source URL when omitted. */
  migrationId?: string;
  title: string;
  link: string;
  contentBlocks: string;
  images: { src: string; alt: string }[];
  sourceHtml?: string;
  targetTemplate?: string;
  placeholders?: MigrationPlaceholder[];
  id?: string | number;
  parentUrl?: string;
  parentId?: string | number;
  menuOrder?: number;
}

export type StepStatus = "pending" | "active" | "done" | "warn" | "error";

export interface StepUpdate {
  step: string;
  status: StepStatus;
  note?: string;
}

export type BatchPageStatus = "pending" | "converting" | "done" | "error" | "cancelled";

export interface BatchPageState {
  status: BatchPageStatus;
  note?: string;
}
