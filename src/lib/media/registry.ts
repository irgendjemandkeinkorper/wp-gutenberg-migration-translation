import type {
  AcquisitionRecord,
  ContentReference,
  RedirectHop,
} from "../acquisition/contract";
import type { BundlePage } from "../types";

export const MEDIA_REGISTRY_CONTRACT_VERSION = "1.0.0" as const;

export type MediaImportState =
  | "unresolved"
  | "ready"
  | "queued"
  | "imported"
  | "reconciled"
  | "failed";

export type MediaFindingCode =
  | "relative-url-without-context"
  | "unsupported-media-url"
  | "unresolved-media"
  | "source-url-content-conflict"
  | "acquisition-failed"
  | "destination-not-reconciled"
  | "destination-source-ambiguous"
  | "destination-mismatch"
  | "unapproved-source-reference";

export type MediaFindingSeverity = "warning" | "blocking";

export interface MediaFinding {
  code: MediaFindingCode;
  severity: MediaFindingSeverity;
  message: string;
  recordId?: string;
  pageUrl?: string;
  sourceUrl?: string;
}

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface MediaProvenance {
  value: string;
  source: "page" | "acquisition" | "manifest" | "operator";
  sourceRef?: string;
}

export interface MediaUse {
  pageUrl: string;
  pageTitle?: string;
  nodeIndex: number | null;
  sourceUrl: string;
  normalizedSourceUrl: string | null;
  fields: Array<"src" | "srcset" | "lazy-src" | "picture" | "other">;
}

/** Asset-level acquisition evidence derived from the versioned archive contract. */
export interface MediaAcquisitionEvidence {
  requestedUrl: string;
  finalUrl: string | null;
  redirectChain: RedirectHop[];
  status: number | null;
  mime: string | null;
  byteLength: number | null;
  dimensions: MediaDimensions | null;
  filename: string | null;
  content: ContentReference | null;
  archiveRecordId: string | null;
  errors: string[];
}

export interface MediaObservation {
  pageUrl: string;
  pageTitle?: string;
  sourceUrl: string;
  baseUrl?: string;
  nodeIndex?: number;
  alt?: string;
  caption?: string;
  title?: string;
  credit?: string;
  linkTarget?: string;
  /** Hash and acquisition evidence are normally supplied by B1/archive consumers. */
  contentHash?: string | null;
  mime?: string | null;
  byteLength?: number | null;
  dimensions?: MediaDimensions | null;
  filename?: string | null;
  acquisition?: Partial<MediaAcquisitionEvidence> & {
    contentHash?: string | null;
  };
  field?: MediaUse["fields"][number];
}

export interface MediaAlias {
  url: string;
  kind: "observed" | "redirect" | "content-hash" | "cdn-transformation";
}

export interface MediaImportStateRecord {
  state: MediaImportState;
  attempts: number;
  attachmentId: number | null;
  destinationUrl: string | null;
  generatedSizes: Record<string, string>;
  lastError: string | null;
}

export interface MediaRegistryRecord {
  recordId: string;
  canonicalUrl: string;
  observedUrls: string[];
  sourceUrls: string[];
  aliases: MediaAlias[];
  contentHash: string | null;
  acquisition: MediaAcquisitionEvidence | null;
  mime: string | null;
  byteLength: number | null;
  dimensions: MediaDimensions | null;
  filename: string | null;
  provenance: {
    alt: MediaProvenance[];
    caption: MediaProvenance[];
    title: MediaProvenance[];
    credit: MediaProvenance[];
    linkTarget: MediaProvenance[];
  };
  uses: MediaUse[];
  import: MediaImportStateRecord;
}

export interface MediaRegistry {
  contractVersion: typeof MEDIA_REGISTRY_CONTRACT_VERSION;
  records: MediaRegistryRecord[];
  findings: MediaFinding[];
}

export interface MediaRegistryBuildOptions {
  /** Require asset bytes/acquisition evidence instead of allowing a preflight warning. */
  requireAcquisition?: boolean;
}

export interface MediaRegistryBuildResult {
  registry: MediaRegistry;
  findings: MediaFinding[];
}

export interface DestinationAttachment {
  attachmentId: number;
  destinationUrl: string;
  sourceUrls?: string[];
  contentHash?: string | null;
  generatedSizes?: Record<string, string>;
}

export interface MediaReconciliationResult {
  registry: MediaRegistry;
  findings: MediaFinding[];
}

export interface RewriteMediaOptions {
  baseUrl?: string;
  requireDestination?: boolean;
  allowedSourceHosts?: readonly string[];
}

export interface RewriteMediaResult {
  content: string;
  findings: MediaFinding[];
}

export class MediaPreflightError extends Error {
  readonly findings: MediaFinding[];

  constructor(findings: MediaFinding[]) {
    super(
      `Media preflight failed with ${findings.length} blocking finding${
        findings.length === 1 ? "" : "s"
      }.`,
    );
    this.name = "MediaPreflightError";
    this.findings = findings;
  }
}

/** Normalize URL spelling without treating CDN transformations as equivalent by guesswork. */
export function normalizeMediaUrl(sourceUrl: string, baseUrl?: string): string {
  const raw = decodeHtmlEntities(sourceUrl.trim());
  if (!raw) throw new MediaUrlError("relative-url-without-context", sourceUrl);

  let parsed: URL;
  try {
    parsed = new URL(raw, baseUrl);
  } catch {
    throw new MediaUrlError("relative-url-without-context", sourceUrl);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new MediaUrlError("unsupported-media-url", sourceUrl);
  }

  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  if ((parsed.protocol === "http:" && parsed.port === "80") ||
      (parsed.protocol === "https:" && parsed.port === "443")) {
    parsed.port = "";
  }
  // Parameter order is not resource identity. Parameter values are retained so
  // width/format/crop transformations cannot be collapsed without same-byte proof.
  parsed.searchParams.sort();
  return parsed.href;
}

export function isCdnTransformationAlias(url: string): boolean {
  return /(?:[?&](?:w|width|h|height|fit|crop|format|auto|q|quality|rect|resize|ixlib)=)|\/(?:resize|fit|crop)\//i.test(
    url,
  );
}

/** Adapt a page snapshot acquisition record to the media evidence shape. */
export function mediaEvidenceFromAcquisition(
  record: AcquisitionRecord,
  overrides: Partial<MediaAcquisitionEvidence> = {},
): MediaAcquisitionEvidence {
  const headerMime = record.retrieval.responseHeaders["content-type"]?.split(";", 1)[0] ?? null;
  return {
    requestedUrl: record.requestedUrl,
    finalUrl: record.finalUrl,
    redirectChain: [...record.redirectChain],
    status: record.status,
    mime: headerMime,
    byteLength: record.content?.rawBytes.byteLength ?? null,
    dimensions: null,
    filename: filenameFromUrl(record.finalUrl ?? record.requestedUrl),
    content: record.content?.rawBytes ?? null,
    archiveRecordId: record.recordId,
    errors: record.errors.map((error) => `${error.code}: ${error.message}`),
    ...overrides,
  };
}

export function buildMediaRegistry(
  pages: readonly BundlePage[],
  options: MediaRegistryBuildOptions = {},
): MediaRegistryBuildResult {
  const observations: MediaObservation[] = [];
  for (const page of pages) {
    const imageInputs = page.images as Array<{
      src: string;
      alt: string;
      caption?: string;
      title?: string;
      credit?: string;
      linkTarget?: string;
      sourceUrls?: string[];
      contentHash?: string | null;
      mime?: string | null;
      byteLength?: number | null;
      dimensions?: MediaDimensions | null;
      filename?: string | null;
      acquisition?: MediaObservation["acquisition"];
    }>;

    for (const [nodeIndex, image] of imageInputs.entries()) {
      for (const [sourceIndex, sourceUrl] of [image.src, ...(image.sourceUrls ?? [])].entries()) {
        observations.push({
          pageUrl: page.link,
          pageTitle: page.title,
          sourceUrl,
          baseUrl: page.link,
          nodeIndex,
          alt: image.alt,
          caption: image.caption,
          title: image.title,
          credit: image.credit,
          linkTarget: image.linkTarget,
          contentHash: image.contentHash,
          mime: image.mime,
          byteLength: image.byteLength,
          dimensions: image.dimensions,
          filename: image.filename,
          acquisition: image.acquisition,
          field: sourceIndex === 0 ? "src" : "srcset",
        });
      }
    }

    // Content can contain picture/source/srcset references not represented in
    // the legacy BundlePage.images shape. Add only new normalized URLs so the
    // page use count stays one use per actual reference.
    for (const reference of extractContentMediaReferences(page.contentBlocks)) {
      const known = imageInputs.some((image) => {
        try {
          return normalizeMediaUrl(image.src, page.link) ===
            normalizeMediaUrl(reference.sourceUrl, page.link);
        } catch {
          return image.src === reference.sourceUrl;
        }
      });
      if (!known || reference.field !== "src") {
        observations.push({
          pageUrl: page.link,
          pageTitle: page.title,
          sourceUrl: reference.sourceUrl,
          baseUrl: page.link,
          field: reference.field,
        });
      }
    }
  }
  return createMediaRegistry(observations, options);
}

export function createMediaRegistry(
  observations: readonly MediaObservation[],
  options: MediaRegistryBuildOptions = {},
): MediaRegistryBuildResult {
  const records: MediaRegistryRecord[] = [];
  const findings: MediaFinding[] = [];
  const byHash = new Map<string, MediaRegistryRecord>();
  const byUrl = new Map<string, MediaRegistryRecord[]>();

  for (const observation of observations) {
    let canonicalUrl: string | null = null;
    try {
      canonicalUrl = normalizeMediaUrl(observation.sourceUrl, observation.baseUrl);
    } catch (error) {
      const code = error instanceof MediaUrlError ? error.code : "unsupported-media-url";
      const recordId = `media-unresolved-${records.length + 1}`;
      const record = newRecord(recordId, observation, null, null);
      records.push(record);
      addFinding(findings, {
        code,
        severity: "blocking",
        message:
          code === "relative-url-without-context"
            ? `Relative media URL ${JSON.stringify(observation.sourceUrl)} on ${observation.pageUrl} has no usable source context.`
            : `Media URL ${JSON.stringify(observation.sourceUrl)} is not fetchable by the migration pipeline.`,
        recordId,
        pageUrl: observation.pageUrl,
        sourceUrl: observation.sourceUrl,
      });
      continue;
    }

    const evidence = normalizeEvidence(observation, canonicalUrl);
    const contentHash = observation.contentHash ?? evidence.content?.sha256 ?? evidence.contentHash;
    const sameUrl = byUrl.get(canonicalUrl) ?? [];
    const conflict = sameUrl.find((candidate) =>
      candidate.contentHash !== null && contentHash !== null && candidate.contentHash !== contentHash,
    );
    let record = contentHash ? byHash.get(contentHash) : sameUrl[0];

    if (conflict) {
      record = undefined;
      addFinding(findings, {
        code: "source-url-content-conflict",
        severity: "blocking",
        message:
          `Source URL ${canonicalUrl} was acquired with multiple content hashes ` +
          `(${conflict.contentHash} and ${contentHash}); the references remain separate and must be reconciled.`,
        recordId: conflict.recordId,
        pageUrl: observation.pageUrl,
        sourceUrl: observation.sourceUrl,
      });
    }

    if (!record) {
      record = newRecord(
        contentHash ? `media-hash-${safeId(contentHash)}` : `media-url-${stableId(canonicalUrl)}`,
        observation,
        canonicalUrl,
        evidence,
      );
      if (contentHash) {
        record.contentHash = contentHash;
        if (record.import.state === "unresolved") record.import.state = "ready";
      }
      records.push(record);
      if (contentHash) byHash.set(contentHash, record);
      byUrl.set(canonicalUrl, [...sameUrl, record]);
    } else {
      mergeObservation(record, observation, canonicalUrl, evidence, contentHash);
      if (contentHash && !byHash.has(contentHash)) byHash.set(contentHash, record);
    }

    if (contentHash && sameUrl.length && !sameUrl.some((candidate) => candidate.recordId === record?.recordId)) {
      addFinding(findings, {
        code: "source-url-content-conflict",
        severity: "blocking",
        message: `Source URL ${canonicalUrl} maps to more than one acquired content identity; no URL guess is permitted.`,
        recordId: record?.recordId,
        pageUrl: observation.pageUrl,
        sourceUrl: observation.sourceUrl,
      });
    }

    if (record.import.state === "unresolved" && options.requireAcquisition) {
      addFinding(findings, {
        code: "unresolved-media",
        severity: "blocking",
        message: `Media ${canonicalUrl} has no successful acquired bytes in the archive manifest.`,
        recordId: record.recordId,
        pageUrl: observation.pageUrl,
        sourceUrl: observation.sourceUrl,
      });
    }
    if (evidence.errors.length || (evidence.status !== null && evidence.status >= 400)) {
      record.import.state = "failed";
      record.import.lastError = evidence.errors.join("; ") || `HTTP ${evidence.status}`;
      addFinding(findings, {
        code: "acquisition-failed",
        severity: "blocking",
        message: `Acquisition failed for ${canonicalUrl}: ${record.import.lastError}.`,
        recordId: record.recordId,
        pageUrl: observation.pageUrl,
        sourceUrl: observation.sourceUrl,
      });
    }
  }

  const registry: MediaRegistry = {
    contractVersion: MEDIA_REGISTRY_CONTRACT_VERSION,
    records,
    findings,
  };
  return { registry, findings };
}

export function validateMediaRegistry(
  registry: MediaRegistry,
  options: { requireAcquisition?: boolean; requireDestination?: boolean } = {},
): MediaFinding[] {
  const findings = [...registry.findings];
  for (const record of registry.records) {
    if (options.requireAcquisition && !record.contentHash) {
      addFinding(findings, {
        code: "unresolved-media",
        severity: "blocking",
        message: `Media ${record.canonicalUrl} has no acquired content hash.`,
        recordId: record.recordId,
      });
    }
    if (options.requireDestination && record.import.state !== "reconciled") {
      addFinding(findings, {
        code: "destination-not-reconciled",
        severity: "blocking",
        message: `Media ${record.canonicalUrl} has no WordPress attachment identity and destination URL.`,
        recordId: record.recordId,
        sourceUrl: record.canonicalUrl,
      });
    }
  }
  return findings;
}

export function lookupMediaRecord(
  registry: MediaRegistry,
  sourceUrl: string,
  baseUrl?: string,
): { record: MediaRegistryRecord | null; reason?: MediaFindingCode } {
  let canonicalUrl: string;
  try {
    canonicalUrl = normalizeMediaUrl(sourceUrl, baseUrl);
  } catch (error) {
    return {
      record: null,
      reason: error instanceof MediaUrlError ? error.code : "unsupported-media-url",
    };
  }
  const matches = registry.records.filter((record) => record.sourceUrls.includes(canonicalUrl));
  if (matches.length === 1) return { record: matches[0] };
  if (matches.length > 1) return { record: null, reason: "destination-source-ambiguous" };
  return { record: null, reason: "unresolved-media" };
}

export function reconcileMediaRegistry(
  registry: MediaRegistry,
  destinations: readonly DestinationAttachment[],
): MediaReconciliationResult {
  const next: MediaRegistry = structuredClone(registry);
  const findings = [...next.findings];
  const usedAttachments = new Map<number, string>();

  for (const destination of destinations) {
    const candidates = destination.contentHash
      ? next.records.filter((record) => record.contentHash === destination.contentHash)
      : next.records.filter((record) =>
          (destination.sourceUrls ?? []).some((source) => {
            try {
              return record.sourceUrls.includes(normalizeMediaUrl(source));
            } catch {
              return false;
            }
          }),
        );
    if (candidates.length !== 1) {
      addFinding(findings, {
        code: candidates.length > 1 ? "destination-source-ambiguous" : "destination-mismatch",
        severity: "blocking",
        message:
          candidates.length > 1
            ? `Destination attachment ${destination.attachmentId} matches multiple media records.`
            : `Destination attachment ${destination.attachmentId} could not be matched to a registry record by hash or source alias.`,
      });
      continue;
    }
    const record = candidates[0];
    const prior = usedAttachments.get(destination.attachmentId);
    if (prior && prior !== record.recordId) {
      addFinding(findings, {
        code: "destination-mismatch",
        severity: "blocking",
        message: `WordPress attachment ${destination.attachmentId} was assigned to multiple media records.`,
        recordId: record.recordId,
      });
      continue;
    }
    usedAttachments.set(destination.attachmentId, record.recordId);
    record.import = {
      state: "reconciled",
      attempts: Math.max(1, record.import.attempts),
      attachmentId: destination.attachmentId,
      destinationUrl: destination.destinationUrl,
      generatedSizes: { ...(destination.generatedSizes ?? {}) },
      lastError: null,
    };
  }

  next.findings = uniqueFindings(findings);
  return { registry: next, findings: next.findings };
}

export function rewriteMediaReferences(
  content: string,
  registry: MediaRegistry,
  options: RewriteMediaOptions = {},
): RewriteMediaResult {
  const findings: MediaFinding[] = [];
  const attributePattern = /(\s(?:src|data-src|data-lazy-src|data-original|srcset)\s*=\s*)(["'])([\s\S]*?)\2/gi;
  const rewritten = content.replace(attributePattern, (_full, prefix: string, quote: string, value: string) => {
    const attrName = (prefix.match(/(?:data-lazy-src|data-original|data-src|srcset|src)/i)?.[0] ?? "src").toLowerCase();
    if (attrName === "srcset") {
      const nextValue = value
        .split(",")
        .map((candidate) => {
          const match = candidate.trim().match(/^(\S+)(\s+.*)?$/);
          if (!match) return candidate;
          return replaceOneMediaUrl(match[1], registry, options, findings) + (match[2] ?? "");
        })
        .join(",");
      return `${prefix}${quote}${nextValue}${quote}`;
    }
    return `${prefix}${quote}${replaceOneMediaUrl(value, registry, options, findings)}${quote}`;
  });
  return { content: rewritten, findings: uniqueFindings(findings) };
}

function replaceOneMediaUrl(
  sourceUrl: string,
  registry: MediaRegistry,
  options: RewriteMediaOptions,
  findings: MediaFinding[],
): string {
  const lookup = lookupMediaRecord(registry, sourceUrl, options.baseUrl);
  if (!lookup.record) {
    if (lookup.reason) {
      addFinding(findings, {
        code: lookup.reason,
        severity: "blocking",
        message: `Media reference ${JSON.stringify(sourceUrl)} could not be resolved without guessing.`,
        sourceUrl,
      });
    }
    return sourceUrl;
  }
  const record = lookup.record;
  if (options.allowedSourceHosts?.length && !record.import.destinationUrl) {
    const host = safeHost(sourceUrl, options.baseUrl);
    if (host && !options.allowedSourceHosts.includes(host)) {
      addFinding(findings, {
        code: "unapproved-source-reference",
        severity: "blocking",
        message: `Source host ${host} remains in media reference ${sourceUrl}.`,
        recordId: record.recordId,
        sourceUrl,
      });
    }
  }
  if (record.import.destinationUrl) return escapeHtmlAttribute(record.import.destinationUrl);
  if (options.requireDestination) {
    addFinding(findings, {
      code: "destination-not-reconciled",
      severity: "blocking",
      message: `Media ${record.canonicalUrl} has not been reconciled to a WordPress attachment URL.`,
      recordId: record.recordId,
      sourceUrl,
    });
  }
  return sourceUrl;
}

function extractContentMediaReferences(content: string): Array<{ sourceUrl: string; field: MediaUse["fields"][number] }> {
  const refs: Array<{ sourceUrl: string; field: MediaUse["fields"][number] }> = [];
  const attributePattern = /\s(src|data-src|data-lazy-src|data-original|srcset)\s*=\s*(["'])([\s\S]*?)\2/gi;
  for (const match of content.matchAll(attributePattern)) {
    const field = match[1].toLowerCase();
    if (field === "srcset") {
      for (const candidate of match[3].split(",")) {
        const sourceUrl = candidate.trim().split(/\s+/, 1)[0];
        if (sourceUrl) refs.push({ sourceUrl, field: "srcset" });
      }
    } else {
      refs.push({
        sourceUrl: match[3],
        field: field === "src" ? "src" : "lazy-src",
      });
    }
  }
  return refs;
}

function newRecord(
  recordId: string,
  observation: MediaObservation,
  canonicalUrl: string | null,
  evidence: MediaAcquisitionEvidence | null,
): MediaRegistryRecord {
  const contentHash = observation.contentHash ?? evidence?.content?.sha256 ?? null;
  const sourceUrl = canonicalUrl ?? observation.sourceUrl;
  const record: MediaRegistryRecord = {
    recordId,
    canonicalUrl: sourceUrl,
    observedUrls: [observation.sourceUrl],
    sourceUrls: canonicalUrl ? [canonicalUrl] : [],
    aliases: [{ url: sourceUrl, kind: "observed" }],
    contentHash,
    acquisition: evidence,
    mime: observation.mime ?? evidence?.mime ?? null,
    byteLength: observation.byteLength ?? evidence?.byteLength ?? evidence?.content?.byteLength ?? null,
    dimensions: observation.dimensions ?? evidence?.dimensions ?? null,
    filename: observation.filename ?? evidence?.filename ?? filenameFromUrl(sourceUrl),
    provenance: {
      alt: [], caption: [], title: [], credit: [], linkTarget: [],
    },
    uses: [],
    import: {
      state: contentHash && !(evidence?.errors.length) ? "ready" : "unresolved",
      attempts: 0,
      attachmentId: null,
      destinationUrl: null,
      generatedSizes: {},
      lastError: null,
    },
  };
  mergeObservation(record, observation, canonicalUrl, evidence, contentHash);
  return record;
}

function mergeObservation(
  record: MediaRegistryRecord,
  observation: MediaObservation,
  canonicalUrl: string | null,
  evidence: MediaAcquisitionEvidence | null,
  contentHash: string | null | undefined,
): void {
  if (!record.observedUrls.includes(observation.sourceUrl)) record.observedUrls.push(observation.sourceUrl);
  if (canonicalUrl && !record.sourceUrls.includes(canonicalUrl)) {
    record.sourceUrls.push(canonicalUrl);
    record.aliases.push({
      url: canonicalUrl,
      kind: contentHash && record.contentHash === contentHash
        ? (isCdnTransformationAlias(canonicalUrl) ? "cdn-transformation" : "content-hash")
        : "observed",
    });
  }
  if (evidence) {
    record.acquisition ??= evidence;
    if (!record.acquisition.content && evidence.content) record.acquisition.content = evidence.content;
    if (!record.acquisition.finalUrl && evidence.finalUrl) record.acquisition.finalUrl = evidence.finalUrl;
    if (record.acquisition.redirectChain.length === 0 && evidence.redirectChain.length) {
      record.acquisition.redirectChain = [...evidence.redirectChain];
    }
  }
  if (contentHash && !record.contentHash) record.contentHash = contentHash;
  record.mime ??= observation.mime ?? evidence?.mime ?? null;
  record.byteLength ??= observation.byteLength ?? evidence?.byteLength ?? evidence?.content?.byteLength ?? null;
  record.dimensions ??= observation.dimensions ?? evidence?.dimensions ?? null;
  record.filename ??= observation.filename ?? evidence?.filename ?? null;
  const use: MediaUse = {
    pageUrl: observation.pageUrl,
    pageTitle: observation.pageTitle,
    nodeIndex: observation.nodeIndex ?? null,
    sourceUrl: observation.sourceUrl,
    normalizedSourceUrl: canonicalUrl,
    fields: [observation.field ?? "other"],
  };
  const existingUse = record.uses.find((candidate) =>
    candidate.pageUrl === use.pageUrl && candidate.nodeIndex === use.nodeIndex && candidate.sourceUrl === use.sourceUrl,
  );
  if (existingUse) {
    for (const field of use.fields) if (!existingUse.fields.includes(field)) existingUse.fields.push(field);
  } else {
    record.uses.push(use);
  }
  addProvenance(record.provenance.alt, observation.alt, observation.pageUrl, "page");
  addProvenance(record.provenance.caption, observation.caption, observation.pageUrl, "page");
  addProvenance(record.provenance.title, observation.title, observation.pageUrl, "page");
  addProvenance(record.provenance.credit, observation.credit, observation.pageUrl, "page");
  addProvenance(record.provenance.linkTarget, observation.linkTarget, observation.pageUrl, "page");
}

function normalizeEvidence(observation: MediaObservation, canonicalUrl: string): MediaAcquisitionEvidence & { contentHash?: string | null } {
  const input = observation.acquisition ?? {};
  return {
    requestedUrl: input.requestedUrl ?? canonicalUrl,
    finalUrl: input.finalUrl ?? null,
    redirectChain: [...(input.redirectChain ?? [])],
    status: input.status ?? null,
    mime: input.mime ?? observation.mime ?? null,
    byteLength: input.byteLength ?? observation.byteLength ?? null,
    dimensions: input.dimensions ?? observation.dimensions ?? null,
    filename: input.filename ?? observation.filename ?? filenameFromUrl(input.finalUrl ?? canonicalUrl),
    content: input.content ?? null,
    archiveRecordId: input.archiveRecordId ?? null,
    errors: [...(input.errors ?? [])],
    contentHash: input.contentHash ?? null,
  };
}

function addProvenance(
  list: MediaProvenance[],
  value: string | undefined,
  sourceRef: string,
  source: MediaProvenance["source"],
): void {
  const normalized = value?.trim();
  if (!normalized || list.some((item) => item.value === normalized && item.sourceRef === sourceRef)) return;
  list.push({ value: normalized, source, sourceRef });
}

function addFinding(findings: MediaFinding[], finding: MediaFinding): void {
  const key = [finding.code, finding.recordId, finding.pageUrl, finding.sourceUrl, finding.message].join("|");
  if (!findings.some((candidate) => [candidate.code, candidate.recordId, candidate.pageUrl, candidate.sourceUrl, candidate.message].join("|") === key)) {
    findings.push(finding);
  }
}

function uniqueFindings(findings: MediaFinding[]): MediaFinding[] {
  const unique: MediaFinding[] = [];
  for (const finding of findings) addFinding(unique, finding);
  return unique;
}

export class MediaUrlError extends Error {
  readonly code: "relative-url-without-context" | "unsupported-media-url";

  constructor(code: "relative-url-without-context" | "unsupported-media-url", sourceUrl: string) {
    super(`Invalid media URL ${JSON.stringify(sourceUrl)}: ${code}`);
    this.name = "MediaUrlError";
    this.code = code;
  }
}

function safeHost(sourceUrl: string, baseUrl?: string): string | null {
  try {
    return new URL(decodeHtmlEntities(sourceUrl), baseUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function filenameFromUrl(sourceUrl: string): string | null {
  try {
    const name = decodeURIComponent(new URL(sourceUrl).pathname.split("/").pop() ?? "");
    return name || null;
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#x27;|&#39;/gi, "'");
}

function escapeHtmlAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 96) || stableId(value);
}

function stableId(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
