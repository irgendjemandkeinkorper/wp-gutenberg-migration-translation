import { assertValidSemanticDocument, type SemanticDocument } from "../ir";

export interface AdapterInput {
  url: string;
  html: string;
  headers?: Readonly<Record<string, string>>;
}

export interface DetectionSignal {
  adapterId: string;
  cms: string;
  confidence: number;
  evidence: string[];
  diagnostics: string[];
}

export interface AdapterExtraction {
  contentRoot?: string;
  boilerplateSelectors: string[];
  mediaExpansions: Array<{ selector: string; attributes: string[] }>;
  structuredPageHints: Record<string, string>;
  evidence: string[];
  semanticDocument?: SemanticDocument;
  diagnostics: string[];
}

export interface SourceAdapter {
  id: string;
  version: string;
  detect(input: AdapterInput): DetectionSignal;
  extract(input: AdapterInput, detection: DetectionSignal): AdapterExtraction;
}

export interface AdapterSelection {
  adapter: SourceAdapter | null;
  detection: DetectionSignal;
  candidates: DetectionSignal[];
  diagnostics: string[];
}

const GENERIC_DETECTION: DetectionSignal = {
  adapterId: "generic",
  cms: "unknown",
  confidence: 0,
  evidence: ["No registered source adapter matched."],
  diagnostics: [],
};

/** Deterministically chooses the strongest adapter and exposes conflicts. */
export function selectSourceAdapter(input: AdapterInput, adapters: readonly SourceAdapter[]): AdapterSelection {
  const candidates = adapters.map((adapter) => adapter.detect(input)).sort((left, right) => right.confidence - left.confidence || left.adapterId.localeCompare(right.adapterId));
  const top = candidates[0];
  if (!top || top.confidence <= 0) return { adapter: null, detection: GENERIC_DETECTION, candidates, diagnostics: ["generic-fallback"] };
  const diagnostics: string[] = [];
  const conflicts = candidates.filter((candidate) => candidate.adapterId !== top.adapterId && candidate.confidence === top.confidence);
  if (conflicts.length) diagnostics.push(`adapter-conflict:${[top, ...conflicts].map((candidate) => candidate.adapterId).join(",")}`);
  return { adapter: adapters.find((adapter) => adapter.id === top.adapterId) ?? null, detection: top, candidates, diagnostics };
}

/** Enforce the adapter boundary: adapters may provide hints or validated IR, never Gutenberg markup. */
export function validateAdapterExtraction(extraction: AdapterExtraction): void {
  const forbidden = ["blocks", "gutenberg", "contentBlocks", "blockMarkup"] as const;
  const candidate = extraction as unknown as Record<string, unknown>;
  for (const key of forbidden) {
    if (key in candidate) throw new Error(`Adapter output cannot contain Gutenberg output field ${key}.`);
  }
  if (extraction.semanticDocument) assertValidSemanticDocument(extraction.semanticDocument);
}

export function genericFallback(input: AdapterInput): AdapterExtraction {
  return {
    boilerplateSelectors: [],
    mediaExpansions: [],
    structuredPageHints: {},
    evidence: [`generic-fallback:${input.url}`],
    diagnostics: ["No CMS-specific adapter selected; generic extraction remains authoritative."],
  };
}
