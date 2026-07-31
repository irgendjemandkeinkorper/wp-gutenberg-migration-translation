export interface ImageRef {
  index: number;
  src: string; // absolute URL when a page URL was provided
  alt: string;
  caption: string;
}

export interface ExtractResult {
  title: string;
  html: string;
  /** How the content was isolated, for the step display. */
  note: string;
}

export interface TokenizeResult {
  html: string;
  images: ImageRef[];
}

export interface PageResult {
  title: string;
  sourceUrl: string;
  blocks: string;
  intermediateHtml: string;
  images: ImageRef[];
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
