import { assertCompatibleRecord } from "../acquisition/contract";
import type { ArchivedPageSnapshot } from "../acquisition/contract";
import type { SourceEvidence, SourceLocator } from "./types";

export interface EvidenceRange {
  startOffset?: number;
  endOffset?: number;
}

/**
 * Build an IR evidence reference from the existing immutable acquisition
 * snapshot. The IR stores the archive identity and content reference; it does
 * not copy or mutate the acquisition record.
 */
export function sourceEvidenceFromSnapshot(
  snapshot: ArchivedPageSnapshot,
  locator: SourceLocator,
  range: EvidenceRange = {},
): SourceEvidence {
  assertCompatibleRecord(snapshot.record);
  const content = snapshot.record.content.decodedHtml;
  const startOffset = range.startOffset ?? 0;
  const endOffset = range.endOffset ?? snapshot.decodedHtml.length;
  if (!Number.isInteger(startOffset) || !Number.isInteger(endOffset) || startOffset < 0 || endOffset < startOffset) {
    throw new Error("IR evidence offsets must be ordered, non-negative integers.");
  }

  return {
    snapshotId: snapshot.record.recordId,
    locator,
    htmlExcerpt: {
      contentKind: "decoded-html",
      contentSha256: content.sha256,
      storageKey: content.storageKey,
      startOffset,
      endOffset,
    },
  };
}
