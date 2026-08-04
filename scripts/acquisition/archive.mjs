import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

export const ACQUISITION_CONTRACT_VERSION = "1.0.0";
export const ACQUISITION_SEMANTIC_VERSION = "1.0.0";

const COMPATIBILITY = {
  reader: "forward-compatible",
  minimumReaderVersion: ACQUISITION_CONTRACT_VERSION,
  unknownFields: "ignore",
};

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function contentReference(storageKey, bytes) {
  return {
    sha256: sha256(bytes),
    byteLength: bytes.byteLength,
    storageKey,
  };
}

export function createRecord({
  recordId,
  recordKind,
  outcome,
  requestedUrl,
  finalUrl = null,
  redirectChain = [],
  retrieval,
  status = null,
  encoding = null,
  parentUrl = null,
  depth = 0,
  policy,
  errors = [],
  content = null,
}) {
  return {
    contractVersion: ACQUISITION_CONTRACT_VERSION,
    semanticVersion: ACQUISITION_SEMANTIC_VERSION,
    recordId,
    recordKind,
    outcome,
    requestedUrl,
    finalUrl,
    redirectChain,
    retrieval,
    status,
    encoding,
    discovery: { parentUrl, depth },
    policy,
    errors,
    content,
    compatibility: { ...COMPATIBILITY },
  };
}

async function writeOnce(path, data) {
  try {
    await writeFile(path, data, { flag: "wx" });
    return "created";
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    return "preserved";
  }
}

/**
 * Persist one evidence record without replacing anything from an earlier run.
 * Blobs are content addressed; metadata records are identified by recordId.
 */
export async function appendArchive(root, record, { rawBytes, decodedHtml } = {}) {
  const recordsDir = join(root, "records");
  const rawDir = join(root, "blobs", "raw");
  const htmlDir = join(root, "blobs", "html");
  await Promise.all([mkdir(recordsDir, { recursive: true }), mkdir(rawDir, { recursive: true }), mkdir(htmlDir, { recursive: true })]);

  if (record.recordKind === "page-snapshot") {
    if (!rawBytes || decodedHtml === undefined) {
      throw new Error("Successful page snapshots require raw bytes and decoded HTML.");
    }
    const rawHash = sha256(rawBytes);
    const htmlBytes = Buffer.from(decodedHtml, "utf8");
    const htmlHash = sha256(htmlBytes);
    if (record.content?.rawBytes?.sha256 !== rawHash || record.content?.decodedHtml?.sha256 !== htmlHash) {
      throw new Error("Archive content hashes do not match the acquisition record.");
    }
    await writeOnce(join(rawDir, rawHash), rawBytes);
    await writeOnce(join(htmlDir, htmlHash + ".html"), htmlBytes);
  }

  const recordPath = join(recordsDir, `${record.recordId}.json`);
  const result = await writeOnce(recordPath, JSON.stringify(record, null, 2) + "\n");
  if (result === "created") {
    await appendFile(join(root, "manifest.jsonl"), JSON.stringify({ ...record, recordPath: `records/${record.recordId}.json` }) + "\n");
  }
  return { recordPath, result };
}

export async function readArchivedHtml(root, record) {
  if (record.recordKind !== "page-snapshot" || !record.content) {
    throw new Error("Only page snapshots have archived HTML.");
  }
  const html = await readFile(join(root, "blobs", "html", record.content.decodedHtml.sha256 + ".html"), "utf8");
  if (sha256(Buffer.from(html, "utf8")) !== record.content.decodedHtml.sha256) {
    throw new Error(`Archived HTML hash mismatch for ${record.recordId}.`);
  }
  return html;
}
