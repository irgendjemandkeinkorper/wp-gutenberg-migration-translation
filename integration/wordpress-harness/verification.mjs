import { createHash } from "node:crypto";

export const MIGRATION_ID_META_KEY = "_blockify_migration_id";

export class VerificationError extends Error {
  constructor(message, report) {
    super(message);
    this.name = "VerificationError";
    this.report = report;
  }
}

function decodeXmlText(value) {
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function xmlValue(xml, tagName) {
  const match = String(xml ?? "").match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXmlText(match[1]).trim() : "";
}

function xmlValuePreserveWhitespace(xml, tagName) {
  const match = String(xml ?? "").match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXmlText(match[1]) : "";
}

function stableHash(value) {
  return createHash("sha256")
    .update(String(value ?? ""))
    .digest("hex");
}

function stripSerializedPlaceholderBlocks(value) {
  return String(value ?? "").replace(
    /<!--\s+wp:html\s+(\{[\s\S]*?\})\s*-->([\s\S]*?)<!--\s+\/wp:html\s*-->/gi,
    (markup, rawAttributes) => {
      try {
        return JSON.parse(rawAttributes)?.blockifyAsset === true ? " " : markup;
      } catch {
        return markup;
      }
    },
  );
}

function meaningfulTextSequence(value) {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    rdquo: "”",
    rsquo: "’",
  };
  const text = stripSerializedPlaceholderBlocks(value)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z][a-z\d]+);/gi, (entity, code) => {
      if (code[0] !== "#") return namedEntities[code.toLowerCase()] ?? entity;
      const radix = code[1].toLowerCase() === "x" ? 16 : 10;
      const codePoint = Number.parseInt(radix === 16 ? code.slice(2) : code.slice(1), radix);
      try {
        return codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
      } catch {
        return entity;
      }
    })
    .replace(/[\u200B-\u200D\uFEFF]/gu, " ");
  return text.match(/[\p{L}\p{N}](?:[\p{L}\p{M}\p{N}]|['’.-](?=[\p{L}\p{N}]))*/gu) ?? [];
}

function linkEvidenceFromHtml(value) {
  const hrefs = [...String(value ?? "").matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)]
    .map((match) => decodeXmlText(match[2]).trim())
    .filter(Boolean);
  const isInternal = (href) => {
    if (href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href)) return false;
    return true;
  };
  return {
    hashes: hrefs.map((href) => stableHash(href)),
    count: hrefs.length,
    internalCount: hrefs.filter(isInternal).length,
  };
}

function placeholderIdsFromContent(value) {
  return [...String(value ?? "").matchAll(/MIGRATION\s+PLACEHOLDER\s+(\d+)/gi)].map((match) => match[1]);
}

function placeholderManifestEvidence(entries) {
  const ids = [];
  const issues = [];
  for (const [position, entry] of (Array.isArray(entries) ? entries : []).entries()) {
    const labelId = String(entry?.label ?? "").match(/MIGRATION\s+PLACEHOLDER\s+(\d+)/i)?.[1] ?? null;
    const indexId = Number.isInteger(entry?.index) && entry.index >= 0 ? String(entry.index + 1) : null;
    if (labelId && indexId && labelId !== indexId)
      issues.push({
        kind: "placeholder-id-disagreement",
        position,
        message: `Placeholder manifest entry ${position + 1} has conflicting label and index IDs.`,
      });
    const id = labelId || indexId;
    if (!id)
      issues.push({
        kind: "missing-placeholder-id",
        position,
        message: `Placeholder manifest entry ${position + 1} has no stable placeholder ID.`,
      });
    else ids.push(id);
  }
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].sort();
  if (duplicateIds.length)
    issues.push({
      kind: "duplicate-placeholder-id",
      ids: duplicateIds,
      message: `Placeholder manifest repeats ID${duplicateIds.length === 1 ? "" : "s"} ${duplicateIds.join(", ")}.`,
    });
  return { ids, issues };
}

function countsFor(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function isSubsequence(expected, actual) {
  let cursor = 0;
  for (const value of expected) {
    while (cursor < actual.length && actual[cursor] !== value) cursor += 1;
    if (cursor === actual.length) return false;
    cursor += 1;
  }
  return true;
}

function firstDifferenceIndex(expected, actual) {
  const length = Math.max(expected.length, actual.length);
  for (let index = 0; index < length; index += 1) if (expected[index] !== actual[index]) return index;
  return null;
}

function reconcileTextSequences(expected, actual) {
  const expectedCounts = countsFor(expected);
  const actualCounts = countsFor(actual);
  let matchedTokenCount = 0;
  let missingTokenCount = 0;
  let duplicatedTokenCount = 0;
  let unexpectedTokenCount = 0;
  for (const [token, count] of expectedCounts) {
    const actualCount = actualCounts.get(token) ?? 0;
    matchedTokenCount += Math.min(count, actualCount);
    missingTokenCount += Math.max(0, count - actualCount);
    duplicatedTokenCount += Math.max(0, actualCount - count);
  }
  for (const [token, count] of actualCounts) if (!expectedCounts.has(token)) unexpectedTokenCount += count;
  const orderPreserved = isSubsequence(expected, actual);
  return {
    expectedTokenCount: expected.length,
    actualTokenCount: actual.length,
    matchedTokenCount,
    recall: expected.length ? Number((matchedTokenCount / expected.length).toFixed(6)) : 1,
    orderPreserved,
    exactSequence: expected.length === actual.length && firstDifferenceIndex(expected, actual) === null,
    missingTokenCount,
    duplicatedTokenCount,
    unexpectedTokenCount,
    firstDifferenceIndex: firstDifferenceIndex(expected, actual),
    expectedSequenceSha256: stableHash(JSON.stringify(expected)),
    actualSequenceSha256: stableHash(JSON.stringify(actual)),
  };
}

function duplicateValues(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))].sort();
}

function reconcilePlaceholderIds(expected, actual) {
  const expectedCounts = countsFor(expected);
  const actualCounts = countsFor(actual);
  const missingIds = [...expectedCounts]
    .filter(([id, count]) => (actualCounts.get(id) ?? 0) < count)
    .map(([id]) => id)
    .sort();
  const unexpectedIds = [...actualCounts]
    .filter(([id, count]) => count > (expectedCounts.get(id) ?? 0))
    .map(([id]) => id)
    .sort();
  return {
    expectedIds: [...expected],
    actualIds: [...actual],
    expectedCount: expected.length,
    actualCount: actual.length,
    duplicateManifestIds: duplicateValues(expected),
    duplicateDestinationIds: duplicateValues(actual),
    missingIds,
    unexpectedIds,
    orderPreserved:
      missingIds.length === 0 &&
      unexpectedIds.length === 0 &&
      expected.length === actual.length &&
      expected.every((id, index) => id === actual[index]),
    exactMatch: expected.length === actual.length && expected.every((id, index) => id === actual[index]),
  };
}

function reconcileLinkHashes(expected, actual) {
  const expectedCounts = countsFor(expected);
  const actualCounts = countsFor(actual);
  let matchedCount = 0;
  for (const [hash, count] of expectedCounts) matchedCount += Math.min(count, actualCounts.get(hash) ?? 0);
  return {
    expectedCount: expected.length,
    actualCount: actual.length,
    matchedCount,
    missingCount: expected.length - matchedCount,
    unexpectedCount: actual.length - matchedCount,
    exactSequence: expected.length === actual.length && expected.every((hash, index) => hash === actual[index]),
    expectedSequenceSha256: stableHash(JSON.stringify(expected)),
    actualSequenceSha256: stableHash(JSON.stringify(actual)),
  };
}

function htmlSummary(value) {
  const html = String(value ?? "");
  const tags = [...html.matchAll(/<([a-z][a-z0-9:-]*)\b/gi)].map((match) => match[1].toLowerCase());
  return {
    length: html.length,
    sha256: stableHash(html),
    tags: [...new Set(tags)].sort(),
  };
}

function normalizeBlockName(name) {
  const value = String(name ?? "");
  return value.includes("/") ? value : `core/${value}`;
}

/**
 * Read the stable migration IDs that the fixture promises to import.
 * Keeping this parser local makes the live check and dry-run check use the
 * same deterministic expectation without depending on WordPress or XML deps.
 */
export function extractMigrationIdsFromWxr(xml) {
  const ids = [];
  const postMetaPattern = /<wp:postmeta\b[^>]*>([\s\S]*?)<\/wp:postmeta>/gi;
  for (const match of String(xml ?? "").matchAll(postMetaPattern)) {
    const keyMatch = match[1].match(/<wp:meta_key\b[^>]*>([\s\S]*?)<\/wp:meta_key>/i);
    if (decodeXmlText(keyMatch?.[1]).trim() !== MIGRATION_ID_META_KEY) continue;
    const valueMatch = match[1].match(/<wp:meta_value\b[^>]*>([\s\S]*?)<\/wp:meta_value>/i);
    const migrationId = nonEmptyString(decodeXmlText(valueMatch?.[1]));
    if (migrationId) ids.push(migrationId);
  }
  return ids;
}

/**
 * Extract source-side page evidence from a WXR fixture without retaining it
 * in the machine-readable scorecard. The caller writes sourceHtml to a
 * separate audit artifact and keeps only its hash/path in the report.
 */
export function extractSourceEvidenceFromWxr(xml) {
  const records = [];
  const itemPattern = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  for (const match of String(xml ?? "").matchAll(itemPattern)) {
    const item = match[1];
    const metadata = new Map();
    for (const metaMatch of item.matchAll(/<wp:postmeta\b[^>]*>([\s\S]*?)<\/wp:postmeta>/gi)) {
      const meta = metaMatch[1];
      const key = xmlValue(meta, "wp:meta_key");
      if (key) metadata.set(key, xmlValuePreserveWhitespace(meta, "wp:meta_value"));
    }
    const migrationId = String(metadata.get(MIGRATION_ID_META_KEY) ?? "").trim();
    const contentHtml = xmlValuePreserveWhitespace(item, "content:encoded");
    const sourceHtmlFromMetadata = metadata.get("_blockify_source_html");
    const sourceHtml = sourceHtmlFromMetadata === undefined ? contentHtml : sourceHtmlFromMetadata;
    const placeholderManifest = metadata.get("_blockify_migration_placeholders") ?? "";
    let parsedPlaceholders = null;
    try {
      const parsed = JSON.parse(placeholderManifest);
      if (Array.isArray(parsed)) parsedPlaceholders = parsed;
    } catch {
      // Invalid or absent manifests remain explicit structural evidence.
    }
    const placeholderEvidence =
      parsedPlaceholders === null
        ? {
            ids: [],
            issues: [
              {
                kind: "invalid-placeholder-manifest",
                message: "Placeholder manifest is absent, malformed JSON, or not an array.",
              },
            ],
          }
        : placeholderManifestEvidence(parsedPlaceholders);
    const sourcePostId = xmlValue(item, "wp:post_id");
    if (!migrationId) continue;
    const blockEvidence = analyzeBlockMarkup(contentHtml);
    const linkEvidence = linkEvidenceFromHtml(contentHtml);
    records.push({
      migrationId,
      sourcePostId: sourcePostId || null,
      title: xmlValue(item, "title") || null,
      slug: xmlValue(item, "wp:post_name") || null,
      type: xmlValue(item, "wp:post_type") || null,
      status: xmlValue(item, "wp:status") || null,
      sourceHtml,
      sourceHtmlOrigin: sourceHtmlFromMetadata === undefined ? "content-fallback" : "postmeta",
      textSequence: meaningfulTextSequence(contentHtml),
      blockCount: blockEvidence.blocks.length,
      linkHashes: linkEvidence.hashes,
      linkCount: linkEvidence.count,
      internalLinkCount: linkEvidence.internalCount,
      placeholderIds: placeholderEvidence.ids,
      placeholderManifestIssues: placeholderEvidence.issues,
      postMeta: {
        sourceUrlSha256: stableHash(metadata.get("_blockify_source_url") ?? ""),
        sourceHtmlSha256: stableHash(sourceHtmlFromMetadata ?? ""),
        targetTemplateSha256: stableHash(metadata.get("_blockify_target_template") ?? ""),
        placeholderManifestSha256: stableHash(placeholderManifest),
        placeholderManifestValid: parsedPlaceholders !== null,
        placeholderCount: parsedPlaceholders?.length ?? null,
      },
    });
  }
  return records.sort((left, right) => left.migrationId.localeCompare(right.migrationId));
}

/**
 * Deterministically inspect serialized Gutenberg comments without requiring a
 * running WordPress. This catches malformed delimiters and root-level HTML;
 * the live verifier augments it with WordPress's parse_blocks output.
 */
export function analyzeBlockMarkup(markup) {
  const source = String(markup ?? "");
  const roots = [];
  const stack = [];
  const parserFailures = [];
  const unexpectedFreeformHtml = [];
  const tokenPattern = /<!--\s*(?:\/\s*)?wp:([a-z0-9_-]+(?:\/[a-z0-9_-]+)?)(?:\s+[^>]*?)?\s*(\/?)\s*-->/gi;
  let cursor = 0;

  const addFreeform = (value, path) => {
    if (!/\S/.test(value)) return;
    unexpectedFreeformHtml.push({ path, ...htmlSummary(value) });
  };

  for (const match of source.matchAll(tokenPattern)) {
    const token = match[0];
    const name = normalizeBlockName(match[1]);
    const start = match.index ?? 0;
    const textBefore = source.slice(cursor, start);
    if (stack.length === 0) addFreeform(textBefore, "root");
    cursor = start + token.length;

    const isClosing = /^<!--\s*\/\s*wp:/i.test(token);
    const isSelfClosing = /\/\s*-->\s*$/i.test(token);
    if (isClosing) {
      if (!stack.length) {
        parserFailures.push({
          kind: "unmatched-closing-block",
          name,
          path: "root",
          message: `Closing ${name} has no matching opening block.`,
        });
        continue;
      }
      const open = stack[stack.length - 1];
      if (open.name !== name) {
        parserFailures.push({
          kind: "mismatched-closing-block",
          name,
          path: open.path,
          message: `Expected closing ${open.name}, found closing ${name}.`,
        });
        stack.pop();
        continue;
      }
      stack.pop();
      continue;
    }

    const parent = stack.at(-1) ?? null;
    const path = parent ? `${parent.path}.${parent.children.length + 1}` : `root.${roots.length + 1}`;
    const node = { name, path, children: [] };
    if (parent) parent.children.push(node);
    else roots.push(node);
    if (!isSelfClosing) stack.push(node);
  }

  if (stack.length === 0) addFreeform(source.slice(cursor), "root");
  for (const node of stack.toReversed()) {
    parserFailures.push({
      kind: "unclosed-block",
      name: node.name,
      path: node.path,
      message: `Block ${node.name} was not closed.`,
    });
  }

  const blockMarkerCount = [...source.matchAll(/<!--\s*\/?\s*wp:/gi)].length;
  const recognizedMarkerCount = [...source.matchAll(tokenPattern)].length;
  if (blockMarkerCount > recognizedMarkerCount) {
    parserFailures.push({
      kind: "malformed-block-marker",
      path: "root",
      message: "A Gutenberg block marker is not a complete WordPress comment.",
    });
  }

  const blocks = [];
  const flatten = (nodes) => {
    for (const node of nodes) {
      blocks.push({ name: node.name, path: node.path });
      flatten(node.children);
    }
  };
  flatten(roots);
  return {
    blockNames: blocks.map((block) => block.name),
    blocks,
    parserFailures,
    unexpectedFreeformHtml,
    invalidBlocks: [],
    recoveredBlocks: [],
  };
}

function flattenWordPressBlocks(blocks, path = "root") {
  const flattened = [];
  for (const [index, block] of (Array.isArray(blocks) ? blocks : []).entries()) {
    const blockPath = nonEmptyString(block?.path) || `${path}.${index + 1}`;
    const name = nonEmptyString(block?.name ?? block?.blockName);
    const children = Array.isArray(block?.children) ? block.children : block?.innerBlocks;
    const freeform =
      block?.freeformHtml || (block?.freeform && typeof block.freeform === "object" ? block.freeform : null);
    flattened.push({
      name,
      path: blockPath,
      registered: block?.registered,
      invalid: block?.invalid === true || (name !== null && block?.registered === false),
      recovered: block?.recovered === true,
      freeformHtml: freeform || (name === null && block?.innerHtml ? htmlSummary(block.innerHtml) : null),
    });
    flattened.push(...flattenWordPressBlocks(children, blockPath));
  }
  return flattened;
}

function diagnosticList(value) {
  return Array.isArray(value) ? value.map((item) => ({ ...item })) : [];
}

function pageDiagnostics(page) {
  const blocks = flattenWordPressBlocks(page.blocks);
  const parserFailures = diagnosticList(page.parserFailures);
  const unexpectedFreeformHtml = diagnosticList(page.unexpectedFreeformHtml);
  const invalidBlocks = diagnosticList(page.invalidBlocks);
  const recoveredBlocks = diagnosticList(page.recoveredBlocks);
  const textEvidencePresent = Array.isArray(page.textSequence) || page.meaningfulHtml !== undefined;
  const textSequence = Array.isArray(page.textSequence)
    ? page.textSequence.map((token) => String(token)).filter(Boolean)
    : meaningfulTextSequence(page.meaningfulHtml ?? "");
  const placeholderEvidencePresent = Array.isArray(page.placeholderIds) || page.content !== undefined;
  const placeholderIds = Array.isArray(page.placeholderIds)
    ? page.placeholderIds.map((id) => String(id)).filter(Boolean)
    : placeholderIdsFromContent(page.content);
  const linkEvidencePresent =
    Array.isArray(page.linkHashes) &&
    Number.isInteger(page.linkCount) &&
    Number.isInteger(page.internalLinkCount) &&
    Number.isInteger(page.brokenInternalLinkCount);
  const linkHashes = Array.isArray(page.linkHashes) ? page.linkHashes.map(String).filter(Boolean) : [];

  if (!Array.isArray(page.blocks)) {
    parserFailures.push({
      kind: "missing-wordpress-block-output",
      message: "WordPress did not return parsed block data for this page.",
    });
  }

  for (const block of blocks) {
    if (block.invalid)
      invalidBlocks.push({
        name: block.name,
        path: block.path,
        message: `Block ${block.name} is not registered or was marked invalid by WordPress.`,
      });
    if (block.recovered)
      recoveredBlocks.push({
        name: block.name,
        path: block.path,
        message: `Block ${block.name} was recovered by the parser.`,
      });
    if (block.freeformHtml) unexpectedFreeformHtml.push({ path: block.path, ...block.freeformHtml });
  }

  if (page.content !== undefined) {
    const markup = analyzeBlockMarkup(page.content);
    parserFailures.push(...markup.parserFailures);
    unexpectedFreeformHtml.push(...markup.unexpectedFreeformHtml);
  }

  return {
    migrationId: nonEmptyString(page.migrationId),
    postId: page.postId ?? page.ID ?? null,
    slug: page.slug ?? page.postName ?? null,
    title: page.title ?? page.postTitle ?? null,
    status: page.status ?? page.postStatus ?? null,
    postType: page.postType ?? null,
    postMeta: {
      sourceUrlSha256: nonEmptyString(page.postMeta?.sourceUrlSha256),
      sourceHtmlSha256: nonEmptyString(page.postMeta?.sourceHtmlSha256),
      targetTemplateSha256: nonEmptyString(page.postMeta?.targetTemplateSha256),
      placeholderManifestSha256: nonEmptyString(page.postMeta?.placeholderManifestSha256),
      placeholderManifestValid: page.postMeta?.placeholderManifestValid === true,
      placeholderCount: Number.isInteger(page.postMeta?.placeholderCount) ? page.postMeta.placeholderCount : null,
    },
    blockNames: blocks.map((block) => block.name),
    blocks: blocks.map(({ name, path }) => ({ name, path })),
    parserFailures,
    unexpectedFreeformHtml,
    invalidBlocks,
    recoveredBlocks,
    _textEvidencePresent: textEvidencePresent,
    _textSequence: textSequence,
    _placeholderEvidencePresent: placeholderEvidencePresent,
    _placeholderIds: placeholderIds,
    _linkEvidencePresent: linkEvidencePresent,
    _linkHashes: linkHashes,
    _linkCount: Number.isInteger(page.linkCount) ? page.linkCount : null,
    _internalLinkCount: Number.isInteger(page.internalLinkCount) ? page.internalLinkCount : null,
    _brokenInternalLinkCount: Number.isInteger(page.brokenInternalLinkCount) ? page.brokenInternalLinkCount : null,
  };
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

export function verifyImportedPages({ pages, expectedMigrationIds, expectedSourceRecords = [] }) {
  const records = Array.isArray(pages) ? pages : [];
  const expected = uniqueSorted(
    (Array.isArray(expectedMigrationIds) ? expectedMigrationIds : []).map(nonEmptyString).filter(Boolean),
  );
  const failures = [];
  const seen = new Map();
  const expectedRecords = new Map(
    (Array.isArray(expectedSourceRecords) ? expectedSourceRecords : [])
      .filter((record) => nonEmptyString(record?.migrationId))
      .map((record) => [record.migrationId, record]),
  );
  const pageReports = records.map(pageDiagnostics);

  if (!expected.length)
    failures.push({ kind: "missing-fixture-migration-ids", message: "The fixture declares no stable migration IDs." });
  if (expectedRecords.size)
    for (const migrationId of expected) {
      if (!expectedRecords.has(migrationId))
        failures.push({
          kind: "missing-source-reconciliation-record",
          migrationId,
          message: `Fixture page ${migrationId} has no saved source record for text and placeholder reconciliation.`,
        });
    }
  for (const page of pageReports) {
    if (!page.migrationId) {
      failures.push({
        kind: "missing-migration-id",
        postId: page.postId,
        message: "Imported page has no stable migration ID.",
      });
      continue;
    }
    if (seen.has(page.migrationId)) {
      failures.push({
        kind: "duplicate-migration-id",
        migrationId: page.migrationId,
        message: `Migration ID ${page.migrationId} was returned more than once.`,
      });
    }
    seen.set(page.migrationId, page);
    const sourceRecord = expectedRecords.get(page.migrationId);
    if (
      sourceRecord &&
      ((sourceRecord.slug && page.slug !== sourceRecord.slug) ||
        (sourceRecord.type && page.postType !== sourceRecord.type) ||
        (sourceRecord.status && page.status !== sourceRecord.status))
    ) {
      failures.push({
        kind: "page-metadata-mismatch",
        migrationId: page.migrationId,
        message: "Imported slug, type, or status differs from the generated fixture record.",
      });
    }
    if (sourceRecord?.postMeta) {
      for (const key of [
        "sourceUrlSha256",
        "sourceHtmlSha256",
        "targetTemplateSha256",
        "placeholderManifestSha256",
        "placeholderManifestValid",
        "placeholderCount",
      ]) {
        if (page.postMeta[key] !== sourceRecord.postMeta[key]) {
          failures.push({
            kind: "post-meta-mismatch",
            migrationId: page.migrationId,
            metadataKey: key,
            message: `Imported Blockify post metadata does not match generated fixture evidence for ${key}.`,
          });
        }
      }
    }
    if (sourceRecord) {
      if (!Array.isArray(sourceRecord.textSequence))
        failures.push({
          kind: "invalid-source-text-evidence",
          migrationId: page.migrationId,
          message: "Saved source evidence has no normalized meaningful-text sequence.",
        });
      else if (!page._textEvidencePresent)
        failures.push({
          kind: "missing-destination-text-evidence",
          migrationId: page.migrationId,
          message: "WordPress returned no normalized meaningful-text sequence for the imported page.",
        });
      else {
        const textReconciliation = reconcileTextSequences(sourceRecord.textSequence, page._textSequence);
        page.textReconciliation = textReconciliation;
        if (textReconciliation.missingTokenCount)
          failures.push({
            kind: "text-recall-loss",
            migrationId: page.migrationId,
            message:
              `Imported meaningful text matched ${textReconciliation.matchedTokenCount} of ` +
              `${textReconciliation.expectedTokenCount} expected tokens (recall ${textReconciliation.recall}).`,
          });
        if (textReconciliation.duplicatedTokenCount)
          failures.push({
            kind: "text-duplication",
            migrationId: page.migrationId,
            message: `Imported meaningful text duplicates ${textReconciliation.duplicatedTokenCount} expected token occurrence(s).`,
          });
        if (textReconciliation.unexpectedTokenCount)
          failures.push({
            kind: "unexpected-meaningful-text",
            migrationId: page.migrationId,
            message: `Imported page contains ${textReconciliation.unexpectedTokenCount} unexpected meaningful token(s).`,
          });
        if (!textReconciliation.orderPreserved && textReconciliation.missingTokenCount === 0)
          failures.push({
            kind: "text-order-mismatch",
            migrationId: page.migrationId,
            message: `Meaningful text order diverges at normalized token index ${textReconciliation.firstDifferenceIndex}.`,
          });
      }

      if (!Array.isArray(sourceRecord.linkHashes))
        failures.push({
          kind: "invalid-source-link-evidence",
          migrationId: page.migrationId,
          message: "Saved source evidence has no hashed link sequence.",
        });
      else if (!page._linkEvidencePresent)
        failures.push({
          kind: "missing-destination-link-evidence",
          migrationId: page.migrationId,
          message: "WordPress returned no hashed link or internal-link health evidence for the imported page.",
        });
      else {
        const linkReconciliation = {
          ...reconcileLinkHashes(sourceRecord.linkHashes, page._linkHashes),
          expectedInternalCount: Number(sourceRecord.internalLinkCount) || 0,
          actualInternalCount: page._internalLinkCount,
          brokenInternalCount: page._brokenInternalLinkCount,
        };
        page.linkReconciliation = linkReconciliation;
        if (!linkReconciliation.exactSequence)
          failures.push({
            kind: "link-reconciliation-mismatch",
            migrationId: page.migrationId,
            message:
              `Imported links do not match source order and identity ` +
              `(expected ${linkReconciliation.expectedCount}, actual ${linkReconciliation.actualCount}; ` +
              `missing ${linkReconciliation.missingCount}, unexpected ${linkReconciliation.unexpectedCount}).`,
          });
        if (linkReconciliation.brokenInternalCount > 0)
          failures.push({
            kind: "broken-internal-link",
            migrationId: page.migrationId,
            message: `Imported page contains ${linkReconciliation.brokenInternalCount} unresolved internal link(s).`,
          });
      }

      const manifestIssues = Array.isArray(sourceRecord.placeholderManifestIssues)
        ? sourceRecord.placeholderManifestIssues
        : [{ message: "Saved source evidence has no validated placeholder manifest." }];
      if (manifestIssues.length)
        failures.push({
          kind: "placeholder-manifest-invalid",
          migrationId: page.migrationId,
          message: manifestIssues.map((issue) => issue.message).join(" "),
        });
      if (!Array.isArray(sourceRecord.placeholderIds))
        failures.push({
          kind: "invalid-source-placeholder-evidence",
          migrationId: page.migrationId,
          message: "Saved source evidence has no placeholder ID sequence.",
        });
      else if (!page._placeholderEvidencePresent)
        failures.push({
          kind: "missing-destination-placeholder-evidence",
          migrationId: page.migrationId,
          message: "WordPress returned no placeholder ID sequence for the imported page.",
        });
      else {
        const placeholderReconciliation = reconcilePlaceholderIds(sourceRecord.placeholderIds, page._placeholderIds);
        page.placeholderReconciliation = placeholderReconciliation;
        if (!placeholderReconciliation.exactMatch)
          failures.push({
            kind: "placeholder-mismatch",
            migrationId: page.migrationId,
            message:
              `Placeholder IDs do not reconcile one-to-one in content order ` +
              `(expected ${placeholderReconciliation.expectedCount}, actual ${placeholderReconciliation.actualCount}; ` +
              `missing ${placeholderReconciliation.missingIds.join(", ") || "none"}; ` +
              `unexpected or duplicated ${placeholderReconciliation.unexpectedIds.join(", ") || "none"}).`,
          });
      }
    }
    if (page.status && page.status !== "publish") {
      failures.push({
        kind: "unexpected-page-status",
        migrationId: page.migrationId,
        message: `Imported page has status ${page.status}, expected publish.`,
      });
    }
    for (const diagnostic of page.parserFailures)
      failures.push({
        ...diagnostic,
        kind: "parser-failure",
        diagnosticKind: diagnostic.kind,
        migrationId: page.migrationId,
      });
    for (const diagnostic of page.invalidBlocks)
      failures.push({ kind: "invalid-block", migrationId: page.migrationId, ...diagnostic });
    for (const diagnostic of page.recoveredBlocks)
      failures.push({ kind: "recovered-block", migrationId: page.migrationId, ...diagnostic });
    for (const diagnostic of page.unexpectedFreeformHtml)
      failures.push({ kind: "unexpected-freeform-html", migrationId: page.migrationId, ...diagnostic });
  }

  const actual = uniqueSorted(pageReports.map((page) => page.migrationId).filter(Boolean));
  for (const migrationId of expected) {
    if (!seen.has(migrationId))
      failures.push({
        kind: "missing-imported-page",
        migrationId,
        message: `Fixture page ${migrationId} was not returned by WordPress.`,
      });
  }
  for (const migrationId of actual) {
    if (!expected.includes(migrationId))
      failures.push({
        kind: "unexpected-imported-page",
        migrationId,
        message: `WordPress returned page ${migrationId}, which is not declared by the fixture.`,
      });
  }

  const reconciliationRecords = expected.map((migrationId) => expectedRecords.get(migrationId)).filter(Boolean);
  const textReconciliations = pageReports.map((page) => page.textReconciliation).filter(Boolean);
  const placeholderReconciliations = pageReports.map((page) => page.placeholderReconciliation).filter(Boolean);
  const linkReconciliations = pageReports.map((page) => page.linkReconciliation).filter(Boolean);
  const textExpectedTokenCount = reconciliationRecords.reduce(
    (count, record) => count + (Array.isArray(record.textSequence) ? record.textSequence.length : 0),
    0,
  );
  const textMatchedTokenCount = textReconciliations.reduce(
    (count, reconciliation) => count + reconciliation.matchedTokenCount,
    0,
  );
  const textReconciliation = expectedRecords.size
    ? {
        expectedPageCount: reconciliationRecords.length,
        reconciledPageCount: textReconciliations.length,
        exactPageCount: textReconciliations.filter((item) => item.exactSequence).length,
        expectedTokenCount: textExpectedTokenCount,
        actualTokenCount: pageReports.reduce((count, page) => count + page._textSequence.length, 0),
        matchedTokenCount: textMatchedTokenCount,
        recall: textExpectedTokenCount ? Number((textMatchedTokenCount / textExpectedTokenCount).toFixed(6)) : 1,
        allOrderPreserved:
          reconciliationRecords.length === textReconciliations.length &&
          textReconciliations.every((item) => item.orderPreserved),
      }
    : null;
  const placeholderExpectedCount = reconciliationRecords.reduce(
    (count, record) => count + (Array.isArray(record.placeholderIds) ? record.placeholderIds.length : 0),
    0,
  );
  const placeholderReconciliation = expectedRecords.size
    ? {
        expectedPageCount: reconciliationRecords.length,
        reconciledPageCount: placeholderReconciliations.length,
        exactPageCount: placeholderReconciliations.filter((item) => item.exactMatch).length,
        expectedPlaceholderCount: placeholderExpectedCount,
        actualPlaceholderCount: pageReports.reduce((count, page) => count + page._placeholderIds.length, 0),
      }
    : null;
  const linkReconciliation = expectedRecords.size
    ? {
        expectedPageCount: reconciliationRecords.length,
        reconciledPageCount: linkReconciliations.length,
        exactPageCount: linkReconciliations.filter((item) => item.exactSequence).length,
        expectedLinkCount: reconciliationRecords.reduce(
          (count, record) => count + (Array.isArray(record.linkHashes) ? record.linkHashes.length : 0),
          0,
        ),
        actualLinkCount: pageReports.reduce((count, page) => count + (page._linkCount ?? 0), 0),
        expectedInternalLinkCount: reconciliationRecords.reduce(
          (count, record) => count + (Number(record.internalLinkCount) || 0),
          0,
        ),
        actualInternalLinkCount: pageReports.reduce((count, page) => count + (page._internalLinkCount ?? 0), 0),
        brokenInternalLinkCount: pageReports.reduce((count, page) => count + (page._brokenInternalLinkCount ?? 0), 0),
      }
    : null;
  for (const page of pageReports) {
    delete page._textEvidencePresent;
    delete page._textSequence;
    delete page._placeholderEvidencePresent;
    delete page._placeholderIds;
    delete page._linkEvidencePresent;
    delete page._linkHashes;
    delete page._linkCount;
    delete page._internalLinkCount;
    delete page._brokenInternalLinkCount;
  }
  const orderedPages = [...pageReports].sort((left, right) =>
    (left.migrationId || "").localeCompare(right.migrationId || ""),
  );
  return {
    schemaVersion: "1.2.0",
    pass: failures.length === 0,
    expectedMigrationIds: expected,
    actualMigrationIds: actual,
    textReconciliation,
    placeholderReconciliation,
    linkReconciliation,
    pages: orderedPages,
    failures,
  };
}

function normalizedHttpUrl(value) {
  try {
    const url = new URL(String(value));
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    url.searchParams.sort();
    return url.href;
  } catch {
    return null;
  }
}

export function verifyImportedMedia({
  inspection,
  expectedMigrationIds,
  expectedAttachmentCount,
  forbiddenSourceUrls = [],
}) {
  const expected = uniqueSorted(
    (Array.isArray(expectedMigrationIds) ? expectedMigrationIds : []).map(nonEmptyString).filter(Boolean),
  );
  const attachments = Array.isArray(inspection?.attachments) ? inspection.attachments : [];
  const pages = Array.isArray(inspection?.pages) ? inspection.pages : [];
  const failures = [];
  const expectedCount = Number(expectedAttachmentCount);
  if (!Number.isInteger(expectedCount) || expectedCount < 0) {
    failures.push({ kind: "invalid-media-expectation", message: "Expected attachment count must be non-negative." });
  } else if (attachments.length !== expectedCount) {
    failures.push({
      kind: "attachment-count-mismatch",
      message: `WordPress imported ${attachments.length} attachment(s), expected ${expectedCount}.`,
    });
  }

  const destinationUrls = new Set();
  const attachmentIds = new Set();
  for (const attachment of attachments) {
    const attachmentId = Number(attachment?.attachmentId);
    const destinationUrl = normalizedHttpUrl(attachment?.destinationUrl);
    if (!Number.isInteger(attachmentId) || attachmentId < 1) {
      failures.push({
        kind: "missing-destination-attachment-identity",
        message: "WordPress attachment evidence is missing a positive attachment ID.",
      });
    } else if (attachmentIds.has(attachmentId)) {
      failures.push({
        kind: "duplicate-destination-attachment-identity",
        message: `WordPress attachment ID ${attachmentId} was returned more than once.`,
      });
    } else attachmentIds.add(attachmentId);
    if (!destinationUrl) {
      failures.push({
        kind: "missing-destination-attachment-url",
        message: `WordPress attachment ${attachmentId || "(unknown)"} has no safe destination URL.`,
      });
    } else destinationUrls.add(destinationUrl);
  }

  const forbidden = new Set(forbiddenSourceUrls.map(normalizedHttpUrl).filter(Boolean));
  const seenPages = new Set();
  const pageReports = pages.map((page) => {
    const migrationId = nonEmptyString(page?.migrationId);
    const mediaUrls = uniqueSorted((Array.isArray(page?.mediaUrls) ? page.mediaUrls : []).map(String));
    if (migrationId) seenPages.add(migrationId);
    if (!migrationId || !expected.includes(migrationId)) {
      failures.push({
        kind: "unexpected-media-page",
        migrationId,
        message: `Media inspection returned undeclared page ${migrationId || "(missing migration ID)"}.`,
      });
    }
    if (!mediaUrls.length) {
      failures.push({
        kind: "missing-page-media",
        migrationId,
        message: `Imported page ${migrationId || "(unknown)"} has no media URL to reconcile.`,
      });
    }
    for (const mediaUrl of mediaUrls) {
      const normalized = normalizedHttpUrl(mediaUrl);
      if (!normalized) {
        failures.push({
          kind: "invalid-destination-media-url",
          migrationId,
          message: `Imported page contains an unsafe or invalid media URL: ${mediaUrl}.`,
        });
      } else if (forbidden.has(normalized)) {
        failures.push({
          kind: "source-media-alias-remains",
          migrationId,
          message: `Imported page still references acquired source alias ${mediaUrl}.`,
        });
      } else if (!destinationUrls.has(normalized)) {
        failures.push({
          kind: "destination-media-mismatch",
          migrationId,
          message: `Imported page media URL ${mediaUrl} does not match a WordPress attachment response.`,
        });
      }
    }
    return {
      migrationId,
      postId: page?.postId ?? null,
      contentSha256: nonEmptyString(page?.contentSha256),
      mediaUrls,
    };
  });
  for (const migrationId of expected) {
    if (!seenPages.has(migrationId))
      failures.push({
        kind: "missing-media-page",
        migrationId,
        message: `Expected media page ${migrationId} was not returned by WordPress.`,
      });
  }

  return {
    schemaVersion: "1.0.0",
    pass: failures.length === 0,
    expectedMigrationIds: expected,
    expectedAttachmentCount: Number.isInteger(expectedCount) && expectedCount >= 0 ? expectedCount : null,
    attachmentCount: attachments.length,
    attachments: attachments.map((attachment) => ({
      attachmentId: Number(attachment?.attachmentId) || null,
      destinationUrl: nonEmptyString(attachment?.destinationUrl),
      parentId: Number(attachment?.parentId) || null,
      mime: nonEmptyString(attachment?.mime),
      sourceFileSha256: nonEmptyString(attachment?.sourceFileSha256),
      width: Number(attachment?.width) || null,
      height: Number(attachment?.height) || null,
    })),
    pages: pageReports.sort((left, right) => (left.migrationId || "").localeCompare(right.migrationId || "")),
    destinationUrls: [...destinationUrls].sort(),
    failures,
  };
}

export function assertMediaVerificationPass(report) {
  if (report?.pass) return report;
  const details = (report?.failures || [])
    .slice(0, 8)
    .map(
      (failure) =>
        `${failure.kind}${failure.migrationId ? ` [${failure.migrationId}]` : ""}: ${failure.message || "diagnostic recorded"}`,
    )
    .join("; ");
  throw new VerificationError(
    `Media verification failed with ${(report?.failures || []).length} diagnostic(s). ${details}`,
    report,
  );
}

export function assertVerificationPass(report) {
  if (report?.pass) return report;
  const details = (report?.failures || [])
    .slice(0, 8)
    .map(
      (failure) =>
        `${failure.kind}${failure.migrationId ? ` [${failure.migrationId}]` : ""}: ${failure.message || "diagnostic recorded"}`,
    )
    .join("; ");
  throw new VerificationError(
    `Gutenberg verification failed with ${(report?.failures || []).length} diagnostic(s). ${details}`,
    report,
  );
}

/**
 * Executed by WP-CLI inside the disposable WordPress container. It emits only
 * diagnostics and hashes, never post content, so retained failure artifacts
 * preserve the harness's redaction/privacy behavior.
 */
export const WORDPRESS_VERIFICATION_EVAL = String.raw`
$meta_key = '${MIGRATION_ID_META_KEY}';
$registry = class_exists('WP_Block_Type_Registry') ? WP_Block_Type_Registry::get_instance() : null;
$freeform_summary = function ($html) {
    $html = (string) $html;
    preg_match_all('/<([a-z][a-z0-9:-]*)\\b/i', $html, $matches);
    $tags = array_values(array_unique(array_map('strtolower', $matches[1] ?? array())));
    sort($tags);
    return array(
        'length' => strlen($html),
        'sha256' => hash('sha256', $html),
        'tags' => $tags,
    );
};
$walk = function ($blocks, $path = 'root') use (&$walk, $registry, $freeform_summary) {
    $result = array();
    foreach ((array) $blocks as $index => $block) {
        $block_path = $path . '.' . ((int) $index + 1);
        $name = isset($block['blockName']) && $block['blockName'] !== null ? (string) $block['blockName'] : null;
        $inner_html = isset($block['innerHTML']) ? (string) $block['innerHTML'] : '';
        $registered = $name !== null && $registry !== null && $registry->is_registered($name);
        $result[] = array(
            'name' => $name,
            'path' => $block_path,
            'registered' => $registered,
            'invalid' => $name !== null && !$registered,
            'recovered' => $name !== null && !$registered,
            'freeformHtml' => $name === null && trim($inner_html) !== '' ? $freeform_summary($inner_html) : null,
            'children' => $walk($block['innerBlocks'] ?? array(), $block_path),
        );
    }
    return $result;
};
$collect_meaningful_html = function ($blocks) use (&$collect_meaningful_html) {
    $html = '';
    foreach ((array) $blocks as $block) {
        $attributes = isset($block['attrs']) && is_array($block['attrs']) ? $block['attrs'] : array();
        if (!empty($attributes['blockifyAsset'])) continue;
        $inner_blocks = isset($block['innerBlocks']) && is_array($block['innerBlocks']) ? $block['innerBlocks'] : array();
        $inner_content = isset($block['innerContent']) && is_array($block['innerContent'])
            ? $block['innerContent']
            : null;
        if ($inner_content !== null) {
            $child_index = 0;
            foreach ($inner_content as $fragment) {
                if (is_string($fragment)) {
                    $html .= $fragment;
                } elseif (isset($inner_blocks[$child_index])) {
                    $html .= $collect_meaningful_html(array($inner_blocks[$child_index]));
                    $child_index++;
                }
            }
            while (isset($inner_blocks[$child_index])) {
                $html .= $collect_meaningful_html(array($inner_blocks[$child_index]));
                $child_index++;
            }
        } else {
            $html .= isset($block['innerHTML']) ? (string) $block['innerHTML'] : '';
        }
    }
    return $html;
};
$normalized_text_sequence = function ($html) {
    $text = html_entity_decode(wp_strip_all_tags((string) $html, true), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', ' ', $text);
    preg_match_all("/[\p{L}\p{N}](?:[\p{L}\p{M}\p{N}]|['’.-](?=[\p{L}\p{N}]))*/u", (string) $text, $matches);
    return array_values($matches[0] ?? array());
};
$link_evidence = function ($html) {
    $hrefs = array();
    if (class_exists('WP_HTML_Tag_Processor')) {
        $processor = new WP_HTML_Tag_Processor((string) $html);
        while ($processor->next_tag('A')) {
            $href = $processor->get_attribute('href');
            if (is_string($href) && trim($href) !== '') $hrefs[] = html_entity_decode(trim($href), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
    } else {
        preg_match_all('/<a\\b[^>]*\\bhref\\s*=\\s*["\x27]([^"\x27]+)["\x27]/i', (string) $html, $matches);
        $hrefs = array_map(function ($href) {
            return html_entity_decode(trim((string) $href), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }, $matches[1] ?? array());
    }
    $hashes = array();
    $internal_count = 0;
    $broken_internal_count = 0;
    $home_host = strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST));
    foreach ($hrefs as $href) {
        $hashes[] = hash('sha256', $href);
        if (strpos($href, '#') === 0) continue;
        $scheme = strtolower((string) wp_parse_url($href, PHP_URL_SCHEME));
        $host = strtolower((string) wp_parse_url($href, PHP_URL_HOST));
        $is_relative = $scheme === '' && $host === '';
        $is_same_host = $host !== '' && $host === $home_host && ($scheme === 'http' || $scheme === 'https');
        if (!$is_relative && !$is_same_host) continue;
        $internal_count++;
        $parts = wp_parse_url($href);
        $query = array();
        if (!empty($parts['query'])) parse_str($parts['query'], $query);
        $target = !empty($query['page_id']) ? get_post((int) $query['page_id']) : null;
        $path = rawurldecode(trim((string) ($parts['path'] ?? ''), '/'));
        if (!$target && $path !== '') $target = get_page_by_path($path, OBJECT, array('page', 'post'));
        if (!$target && $path !== '') $broken_internal_count++;
    }
    return array(
        'hashes' => $hashes,
        'count' => count($hashes),
        'internalCount' => $internal_count,
        'brokenInternalCount' => $broken_internal_count,
    );
};
$markup_failures = function ($content) {
    $failures = array();
    $stack = array();
    $pattern = '/<!--\\s*(?:\\/\\s*)?wp:([a-z0-9_-]+(?:\\/[a-z0-9_-]+)?)(?:\\s+[^>]*?)?\\s*(\\/?)\\s*-->/i';
    preg_match_all($pattern, (string) $content, $matches, PREG_OFFSET_CAPTURE);
    foreach ($matches[0] as $index => $token_match) {
        $token = $token_match[0];
        $name = $matches[1][$index][0];
        if (strpos($name, '/') === false) $name = 'core/' . $name;
        $is_closing = preg_match('/<!--\\s*\\//', $token) === 1;
        $is_self_closing = preg_match('/\\/\\s*-->\\s*$/', $token) === 1;
        if ($is_closing) {
            if (!$stack) {
                $failures[] = array('kind' => 'unmatched-closing-block', 'name' => $name, 'message' => 'Closing block has no matching opening block.');
                continue;
            }
            $open = array_pop($stack);
            if ($open['name'] !== $name) {
                $failures[] = array('kind' => 'mismatched-closing-block', 'name' => $name, 'path' => $open['path'], 'message' => 'Closing block does not match the most recent opening block.');
            }
        } elseif (!$is_self_closing) {
            $stack[] = array('name' => $name, 'path' => 'root.' . (count($stack) + 1));
        }
    }
    foreach (array_reverse($stack) as $open) {
        $failures[] = array('kind' => 'unclosed-block', 'name' => $open['name'], 'path' => $open['path'], 'message' => 'Block was not closed.');
    }
    $marker_count = preg_match_all('/<!--\\s*\\/?\\s*wp:/i', (string) $content);
    $recognized_count = count($matches[0]);
    if ($marker_count > $recognized_count) {
        $failures[] = array('kind' => 'malformed-block-marker', 'message' => 'A Gutenberg block marker is not a complete WordPress comment.');
    }
    return $failures;
};
$posts = get_posts(array(
    'post_type' => 'page',
    'post_status' => 'any',
    'numberposts' => -1,
    'orderby' => 'ID',
    'order' => 'ASC',
    'suppress_filters' => true,
    'meta_query' => array(array('key' => $meta_key, 'compare' => 'EXISTS')),
));
$records = array();
foreach ($posts as $post) {
    $content = (string) $post->post_content;
    $parsed_blocks = function_exists('parse_blocks') ? parse_blocks($content) : null;
    $meaningful_html = $parsed_blocks !== null ? $collect_meaningful_html($parsed_blocks) : '';
    $links = $link_evidence($meaningful_html);
    preg_match_all('/MIGRATION\\s+PLACEHOLDER\\s+(\\d+)/i', $content, $placeholder_matches);
    $source_url = (string) get_post_meta($post->ID, '_blockify_source_url', true);
    $source_html = (string) get_post_meta($post->ID, '_blockify_source_html', true);
    $target_template = (string) get_post_meta($post->ID, '_blockify_target_template', true);
    $placeholder_manifest = (string) get_post_meta($post->ID, '_blockify_migration_placeholders', true);
    $decoded_placeholders = json_decode($placeholder_manifest, true);
    $placeholder_manifest_valid = JSON_ERROR_NONE === json_last_error() && is_array($decoded_placeholders);
    $records[] = array(
        'migrationId' => (string) get_post_meta($post->ID, $meta_key, true),
        'postId' => (int) $post->ID,
        'title' => (string) $post->post_title,
        'slug' => (string) $post->post_name,
        'status' => (string) $post->post_status,
        'postType' => (string) $post->post_type,
        'postMeta' => array(
            'sourceUrlSha256' => hash('sha256', $source_url),
            'sourceHtmlSha256' => hash('sha256', $source_html),
            'targetTemplateSha256' => hash('sha256', $target_template),
            'placeholderManifestSha256' => hash('sha256', $placeholder_manifest),
            'placeholderManifestValid' => $placeholder_manifest_valid,
            'placeholderCount' => $placeholder_manifest_valid ? count($decoded_placeholders) : null,
        ),
        'blocks' => $parsed_blocks !== null ? $walk($parsed_blocks) : array(),
        'parserFailures' => $parsed_blocks !== null ? $markup_failures($content) : array(array('kind' => 'missing-wordpress-parser', 'message' => 'WordPress parse_blocks() is unavailable.')),
        'textSequence' => $normalized_text_sequence($meaningful_html),
        'linkHashes' => $links['hashes'],
        'linkCount' => $links['count'],
        'internalLinkCount' => $links['internalCount'],
        'brokenInternalLinkCount' => $links['brokenInternalCount'],
        'placeholderIds' => array_values($placeholder_matches[1] ?? array()),
    );
}
echo wp_json_encode($records, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
`;

/** Structural media evidence emitted by WP-CLI; no post content is returned. */
export const WORDPRESS_MEDIA_VERIFICATION_EVAL = String.raw`
$meta_key = '${MIGRATION_ID_META_KEY}';
$extract_media_urls = function ($content) {
    $urls = array();
    preg_match_all('/\\s(?:src|data-src|data-lazy-src|data-original)\\s*=\\s*(["\\x27])([^"\\x27]+)\\1/i', (string) $content, $matches);
    foreach ($matches[2] ?? array() as $value) {
        $decoded = html_entity_decode((string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        if ($decoded !== '') $urls[] = $decoded;
    }
    preg_match_all('/\\ssrcset\\s*=\\s*(["\\x27])([^"\\x27]+)\\1/i', (string) $content, $srcset_matches);
    foreach ($srcset_matches[2] ?? array() as $srcset) {
        foreach (explode(',', html_entity_decode((string) $srcset, ENT_QUOTES | ENT_HTML5, 'UTF-8')) as $candidate) {
            $parts = preg_split('/\\s+/', trim($candidate));
            if (!empty($parts[0])) $urls[] = $parts[0];
        }
    }
    $urls = array_values(array_unique($urls));
    sort($urls);
    return $urls;
};
$pages = get_posts(array(
    'post_type' => 'page',
    'post_status' => 'any',
    'numberposts' => -1,
    'orderby' => 'ID',
    'order' => 'ASC',
    'suppress_filters' => true,
    'meta_query' => array(array('key' => $meta_key, 'compare' => 'EXISTS')),
));
$page_records = array();
foreach ($pages as $post) {
    $content = (string) $post->post_content;
    $page_records[] = array(
        'migrationId' => (string) get_post_meta($post->ID, $meta_key, true),
        'postId' => (int) $post->ID,
        'contentSha256' => hash('sha256', $content),
        'mediaUrls' => $extract_media_urls($content),
    );
}
$attachment_posts = get_posts(array('post_type' => 'attachment', 'post_status' => 'any', 'numberposts' => -1, 'orderby' => 'ID', 'order' => 'ASC', 'suppress_filters' => true));
$attachment_records = array();
foreach ($attachment_posts as $attachment) {
    $file = get_attached_file($attachment->ID);
    $metadata = wp_get_attachment_metadata($attachment->ID);
    $attachment_records[] = array(
        'attachmentId' => (int) $attachment->ID,
        'destinationUrl' => (string) wp_get_attachment_url($attachment->ID),
        'parentId' => (int) $attachment->post_parent,
        'mime' => (string) $attachment->post_mime_type,
        'sourceFileSha256' => $file && is_file($file) ? hash_file('sha256', $file) : null,
        'width' => isset($metadata['width']) ? (int) $metadata['width'] : null,
        'height' => isset($metadata['height']) ? (int) $metadata['height'] : null,
    );
}
echo wp_json_encode(array('pages' => $page_records, 'attachments' => $attachment_records), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
`;
