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

function stableHash(value) {
  return createHash("sha256")
    .update(String(value ?? ""))
    .digest("hex");
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
    let migrationId = "";
    for (const metaMatch of item.matchAll(/<wp:postmeta\b[^>]*>([\s\S]*?)<\/wp:postmeta>/gi)) {
      const meta = metaMatch[1];
      if (xmlValue(meta, "wp:meta_key") === MIGRATION_ID_META_KEY) {
        migrationId = xmlValue(meta, "wp:meta_value");
        break;
      }
    }
    const sourceHtml = xmlValue(item, "content:encoded");
    const sourcePostId = xmlValue(item, "wp:post_id");
    if (!migrationId) continue;
    records.push({
      migrationId,
      sourcePostId: sourcePostId || null,
      title: xmlValue(item, "title") || null,
      slug: xmlValue(item, "wp:post_name") || null,
      type: xmlValue(item, "wp:post_type") || null,
      status: xmlValue(item, "wp:status") || null,
      sourceHtml,
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
    blockNames: blocks.map((block) => block.name),
    blocks: blocks.map(({ name, path }) => ({ name, path })),
    parserFailures,
    unexpectedFreeformHtml,
    invalidBlocks,
    recoveredBlocks,
  };
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

export function verifyImportedPages({ pages, expectedMigrationIds }) {
  const records = Array.isArray(pages) ? pages : [];
  const expected = uniqueSorted(
    (Array.isArray(expectedMigrationIds) ? expectedMigrationIds : []).map(nonEmptyString).filter(Boolean),
  );
  const failures = [];
  const seen = new Map();
  const pageReports = records.map(pageDiagnostics);

  if (!expected.length)
    failures.push({ kind: "missing-fixture-migration-ids", message: "The fixture declares no stable migration IDs." });
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

  const orderedPages = [...pageReports].sort((left, right) =>
    (left.migrationId || "").localeCompare(right.migrationId || ""),
  );
  return {
    schemaVersion: "1.0.0",
    pass: failures.length === 0,
    expectedMigrationIds: expected,
    actualMigrationIds: actual,
    pages: orderedPages,
    failures,
  };
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
    $records[] = array(
        'migrationId' => (string) get_post_meta($post->ID, $meta_key, true),
        'postId' => (int) $post->ID,
        'title' => (string) $post->post_title,
        'slug' => (string) $post->post_name,
        'status' => (string) $post->post_status,
        'blocks' => function_exists('parse_blocks') ? $walk(parse_blocks($content)) : array(),
        'parserFailures' => function_exists('parse_blocks') ? $markup_failures($content) : array(array('kind' => 'missing-wordpress-parser', 'message' => 'WordPress parse_blocks() is unavailable.')),
    );
}
echo wp_json_encode($records, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
`;
