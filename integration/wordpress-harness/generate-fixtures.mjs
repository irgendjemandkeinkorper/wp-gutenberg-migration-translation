#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const harnessDir = dirname(fileURLToPath(import.meta.url));
const repoDir = resolve(harnessDir, "../..");
const outputPath = join(harnessDir, "fixtures", "known-media.wxr.xml");

export const KNOWN_MEDIA_PRIMARY_URL = "http://wordpress/blockify-fixture.png?fit=crop&width=600";
export const KNOWN_MEDIA_ALIAS_URL = "http://wordpress/blockify-fixture.png?fit=crop&width=900";
export const KNOWN_MEDIA_MIGRATION_IDS = ["a1-generated-page-9101", "a1-generated-page-9102"];
export const KNOWN_MEDIA_GENERATED_AT = "2025-01-15T12:00:00.000Z";
const fixtureHash = "431ced6916a2a21a156e38701afe55bbd7f88969fbbfc56d7fe099d47f265460";

function imageBlock(sourceUrl) {
  return (
    '<!-- wp:image {"sizeSlug":"full"} -->\n' +
    `<figure class="wp-block-image size-full"><img src="${sourceUrl.replaceAll("&", "&amp;")}" alt="Blockify shared fixture"/></figure>\n` +
    "<!-- /wp:image -->"
  );
}

function paragraphBlock(text) {
  return `<!-- wp:paragraph -->\n<p>${text}</p>\n<!-- /wp:paragraph -->`;
}

function unsupportedBlock() {
  return (
    '<!-- wp:html {"blockifyAsset":true,"assetIndex":0,"assetType":"iframe"} -->\n' +
    '<div class="blockify-unsupported-placeholder" data-asset-index="0" data-asset-type="iframe">' +
    "MIGRATION PLACEHOLDER 1: iframe — https://booking.example.test/tee-times" +
    "</div>\n" +
    "<!-- /wp:html -->"
  );
}

function groupBlock(children) {
  return `<!-- wp:group -->\n<div class="wp-block-group">\n${children.join("\n")}\n</div>\n<!-- /wp:group -->`;
}

export async function buildKnownMediaFixture() {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: repoDir,
    logLevel: "silent",
    appType: "custom",
    server: { middlewareMode: true },
  });

  try {
    const [{ buildWxrPackage }, { createMediaRegistry }] = await Promise.all([
      vite.ssrLoadModule("/src/lib/wxr.ts"),
      vite.ssrLoadModule("/src/lib/media/registry.ts"),
    ]);
    const pageAUrl = "https://source.example.test/generated-media-a";
    const pageBUrl = "https://source.example.test/generated-media-b";
    const placeholder = {
      index: 0,
      kind: "iframe",
      source: "https://booking.example.test/tee-times",
      label: "MIGRATION PLACEHOLDER 1: iframe — https://booking.example.test/tee-times",
    };
    const pages = [
      {
        migrationId: KNOWN_MEDIA_MIGRATION_IDS[0],
        title: "Blockify Generated Media A",
        link: pageAUrl,
        contentBlocks: groupBlock([
          paragraphBlock("Generated fixture A preserves its first meaningful paragraph."),
          imageBlock(KNOWN_MEDIA_PRIMARY_URL),
          unsupportedBlock(),
          paragraphBlock("Generated fixture A preserves its closing meaningful paragraph."),
        ]),
        images: [{ src: KNOWN_MEDIA_PRIMARY_URL, alt: "Blockify shared fixture" }],
        sourceHtml:
          `<main><p>Generated fixture A preserves its first meaningful paragraph.</p>` +
          `<img src="${KNOWN_MEDIA_PRIMARY_URL}" alt="Blockify shared fixture">` +
          '<iframe src="https://booking.example.test/tee-times"></iframe>' +
          "<p>Generated fixture A preserves its closing meaningful paragraph.</p></main>",
        targetTemplate: "synthetic-harness-profile",
        placeholders: [placeholder],
      },
      {
        migrationId: KNOWN_MEDIA_MIGRATION_IDS[1],
        title: "Blockify Generated Media B",
        link: pageBUrl,
        contentBlocks: groupBlock([
          paragraphBlock("Generated fixture B preserves its meaningful paragraph."),
          imageBlock(KNOWN_MEDIA_ALIAS_URL),
        ]),
        images: [{ src: KNOWN_MEDIA_ALIAS_URL, alt: "Blockify shared fixture" }],
        sourceHtml:
          `<main><p>Generated fixture B preserves its meaningful paragraph.</p>` +
          `<img src="${KNOWN_MEDIA_ALIAS_URL}" alt="Blockify shared fixture"></main>`,
        targetTemplate: "synthetic-harness-profile",
        placeholders: [],
      },
    ];
    const { registry, findings } = createMediaRegistry([
      {
        pageUrl: pageAUrl,
        pageTitle: pages[0].title,
        sourceUrl: KNOWN_MEDIA_PRIMARY_URL,
        alt: "Blockify shared fixture",
        contentHash: fixtureHash,
        mime: "image/png",
        byteLength: 68,
        dimensions: { width: 1, height: 1 },
        filename: "blockify-fixture.png",
        acquisition: {
          requestedUrl: KNOWN_MEDIA_PRIMARY_URL,
          finalUrl: "http://wordpress/blockify-fixture.png",
          redirectChain: [],
          status: 200,
          mime: "image/png",
          byteLength: 68,
          dimensions: { width: 1, height: 1 },
          filename: "blockify-fixture.png",
          content: {
            sha256: fixtureHash,
            byteLength: 68,
            storageKey: "fixtures/blockify-fixture.png",
          },
          archiveRecordId: "blockify-generated-fixture-media",
          errors: [],
        },
      },
      {
        pageUrl: pageBUrl,
        pageTitle: pages[1].title,
        sourceUrl: KNOWN_MEDIA_ALIAS_URL,
        alt: "Blockify shared fixture",
        contentHash: fixtureHash,
        mime: "image/png",
        byteLength: 68,
        dimensions: { width: 1, height: 1 },
        filename: "blockify-fixture.png",
      },
    ]);
    const blocking = findings.filter((finding) => finding.severity === "blocking");
    if (blocking.length) throw new Error(`Generated fixture media registry has ${blocking.length} blocking finding(s).`);

    const result = buildWxrPackage(pages, {
      author: "blockify-harness",
      postType: "page",
      status: "publish",
      siteTitle: "Blockify Generated Integration Fixture",
      generatedAt: KNOWN_MEDIA_GENERATED_AT,
      emitAttachments: true,
      mediaRegistry: registry,
      strictMedia: true,
      requireAcquisition: true,
    });
    if (result.findings.some((finding) => finding.severity === "blocking")) {
      throw new Error("Generated fixture WXR contains a blocking media finding.");
    }
    return result.xml;
  } finally {
    await vite.close();
  }
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const mode = process.argv[2] || "--check";
  if (!new Set(["--check", "--write"]).has(mode)) {
    throw new Error("Usage: node integration/wordpress-harness/generate-fixtures.mjs [--check|--write]");
  }
  const generated = await buildKnownMediaFixture();
  if (mode === "--write") {
    writeFileSync(outputPath, generated);
    console.log(`WROTE ${outputPath} sha256=${digest(generated)}`);
    return;
  }
  const current = readFileSync(outputPath, "utf8");
  if (current !== generated) {
    throw new Error("Generated WordPress fixture is stale; run npm run fixtures:wordpress.");
  }
  console.log(`CHECKED ${outputPath} sha256=${digest(generated)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
