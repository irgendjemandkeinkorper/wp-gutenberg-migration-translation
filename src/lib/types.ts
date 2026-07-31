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
  usedSelector: boolean;
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
  images: AssetRef[];
  /** indices whose position was lost and were re-appended at the end */
  lostPositions: number[];
  warnings: string[];
}

export interface BundlePage {
  title: string;
  link: string;
  contentBlocks: string;
  images: { src: string; alt: string }[];
}

export type StepStatus = "pending" | "active" | "done" | "warn" | "error";

export interface StepUpdate {
  step: string;
  status: StepStatus;
  note?: string;
}
