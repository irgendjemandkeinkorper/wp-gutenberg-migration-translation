/**
 * Versioned acquisition evidence shared by the crawler, archive, and offline
 * conversion path. The on-disk archive stores bytes and HTML in content-
 * addressed files; this contract records the immutable references to them.
 */

export const ACQUISITION_CONTRACT_VERSION = "1.0.0" as const;
export const ACQUISITION_SEMANTIC_VERSION = "1.0.0" as const;

export type AcquisitionRecordKind = "page-snapshot" | "attempt";
export type AcquisitionOutcome = "success" | "redirect" | "non-html" | "failure";
export type PolicyDecision = "allow" | "deny" | "skip";

export interface RedirectHop {
  fromUrl: string;
  toUrl: string;
  status: number;
}

export interface RetrievalMetadata {
  retrievedAt: string;
  method: "GET";
  userAgent: string;
  durationMs: number;
  responseHeaders: Record<string, string>;
}

export interface EncodingMetadata {
  declared: string | null;
  used: string;
  source: "content-type" | "default";
}

export interface ContentReference {
  sha256: string;
  byteLength: number;
  storageKey: string;
}

export interface SnapshotContent {
  rawBytes: ContentReference;
  decodedHtml: ContentReference;
}

export interface AcquisitionError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface PolicyMetadata {
  decision: PolicyDecision;
  reason: string;
  robots: "allowed" | "disallowed" | "unknown";
}

export interface CompatibilityPolicy {
  reader: "forward-compatible";
  minimumReaderVersion: string;
  unknownFields: "ignore";
}

export interface DiscoveryMetadata {
  parentUrl: string | null;
  depth: number;
}

export interface AcquisitionRecord {
  contractVersion: typeof ACQUISITION_CONTRACT_VERSION;
  semanticVersion: typeof ACQUISITION_SEMANTIC_VERSION;
  recordId: string;
  recordKind: AcquisitionRecordKind;
  outcome: AcquisitionOutcome;
  requestedUrl: string;
  finalUrl: string | null;
  redirectChain: RedirectHop[];
  retrieval: RetrievalMetadata;
  status: number | null;
  encoding: EncodingMetadata | null;
  discovery: DiscoveryMetadata;
  policy: PolicyMetadata;
  errors: AcquisitionError[];
  content: SnapshotContent | null;
  compatibility: CompatibilityPolicy;
}

/** A successful snapshot plus its decoded HTML for offline conversion. */
export interface ArchivedPageSnapshot {
  record: AcquisitionRecord & {
    recordKind: "page-snapshot";
    outcome: "success" | "redirect";
    content: SnapshotContent;
    finalUrl: string;
  };
  decodedHtml: string;
}

export function assertCompatibleRecord(record: AcquisitionRecord): void {
  if (record.contractVersion !== ACQUISITION_CONTRACT_VERSION) {
    throw new Error(
      `Unsupported acquisition contract ${record.contractVersion}; ` +
        `expected ${ACQUISITION_CONTRACT_VERSION}.`,
    );
  }
  if (record.compatibility.reader !== "forward-compatible") {
    throw new Error("Acquisition record does not declare a compatible reader policy.");
  }
}

export function archivedSnapshotSource(snapshot: ArchivedPageSnapshot): {
  kind: "archive";
  snapshotId: string;
  requestedUrl: string;
  finalUrl: string;
  decodedHtml: string;
} {
  assertCompatibleRecord(snapshot.record);
  if (snapshot.record.recordKind !== "page-snapshot" || !snapshot.decodedHtml) {
    throw new Error("Only successful page snapshots can be used for offline conversion.");
  }
  return {
    kind: "archive",
    snapshotId: snapshot.record.recordId,
    requestedUrl: snapshot.record.requestedUrl,
    finalUrl: snapshot.record.finalUrl,
    decodedHtml: snapshot.decodedHtml,
  };
}
