import type { AcquisitionRecord, ArchivedPageSnapshot } from "./contract";
import { assertCompatibleRecord } from "./contract";

/**
 * Append-only in-memory archive used by browser consumers and tests. The Node
 * crawler uses the same record contract with content-addressed filesystem
 * persistence (scripts/acquisition/archive.mjs).
 */
export class ImmutableSourceArchive {
  private readonly entries: AcquisitionRecord[];
  private readonly htmlByRecordId: Map<string, string>;

  constructor(
    records: readonly AcquisitionRecord[] = [],
    htmlByRecordId: ReadonlyMap<string, string> = new Map(),
  ) {
    records.forEach(assertCompatibleRecord);
    this.entries = records.map((record) => structuredClone(record));
    this.htmlByRecordId = new Map(htmlByRecordId);
  }

  append(record: AcquisitionRecord, decodedHtml?: string): ImmutableSourceArchive {
    assertCompatibleRecord(record);
    if (this.entries.some((entry) => entry.recordId === record.recordId)) {
      throw new Error(`Acquisition record already exists: ${record.recordId}`);
    }
    const htmlByRecordId = new Map(this.htmlByRecordId);
    if (decodedHtml !== undefined) htmlByRecordId.set(record.recordId, decodedHtml);
    return new ImmutableSourceArchive([...this.entries, record], htmlByRecordId);
  }

  appendSnapshot(snapshot: ArchivedPageSnapshot): ImmutableSourceArchive {
    return this.append(snapshot.record, snapshot.decodedHtml);
  }

  records(): readonly AcquisitionRecord[] {
    return this.entries.map((record) => structuredClone(record));
  }

  forUrl(requestedUrl: string): readonly AcquisitionRecord[] {
    return this.records().filter((record) => record.requestedUrl === requestedUrl);
  }

  latestSnapshot(requestedUrl: string): ArchivedPageSnapshot | null {
    const record = [...this.entries]
      .reverse()
      .find(
        (entry) =>
          entry.requestedUrl === requestedUrl &&
          entry.recordKind === "page-snapshot" &&
          entry.content !== null &&
          entry.finalUrl !== null,
      );
    const decodedHtml = record && this.htmlByRecordId.get(record.recordId);
    return record && decodedHtml !== undefined
      ? {
          record: structuredClone(record) as ArchivedPageSnapshot["record"],
          decodedHtml,
        }
      : null;
  }
}
