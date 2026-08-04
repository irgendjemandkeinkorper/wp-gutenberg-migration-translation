import { createException } from "../../lib/exceptions/lifecycle";
import { createPageQaRecord, type OperationAuthorization, type PageQaRecord } from "../../lib/qa/workbench";

const RECORDED_AT = "2026-08-03T12:00:00.000Z";

export function pageQaRecordFixture(): PageQaRecord {
  const unsupportedWidget = createException({
    id: "exception:widget",
    placeholderId: "placeholder:widget",
    sourceNodeId: "node:widget",
    evidence: ["snapshot:42#node:widget"],
    severity: "blocking",
    remediation: "Replace the unsupported widget with a supported Gutenberg block.",
    owner: "migration-operator",
    createdAt: RECORDED_AT,
  });

  return createPageQaRecord({
    pageId: "page:42",
    current: {
      revisionId: "revision:1",
      recordedAt: RECORDED_AT,
      source: {
        sourceSiteId: "site:example",
        snapshotId: "snapshot:42",
        canonicalUrl: "https://example.test/about",
        contentSha256: "a".repeat(64),
        storageKey: "archive/pages/page-42.html",
        locator: { kind: "structural-path", value: "main/article" },
        range: { startOffset: 10, endOffset: 250 },
      },
      semantic: {
        documentId: "semantic:42",
        schemaVersion: "1.0.0",
        nodeCount: 2,
        summary: "One paragraph and one unsupported source widget.",
      },
      placement: {
        planId: "placement:42",
        profileId: "profile:default",
        profileVersion: "1.0.0",
        basis: "authoritative",
        basisLabel: "Authoritative default profile",
        evidence: ["profile:default@1.0.0"],
        slots: [
          {
            slotId: "content",
            sourceNodeIds: ["node:paragraph", "node:widget"],
            destinationPath: "post_content",
          },
        ],
      },
      blockMappings: [
        {
          sourceNodeId: "node:paragraph",
          destinationPath: "post_content/0",
          blockName: "core/paragraph",
          status: "mapped",
          findingIds: ["finding:spacing"],
          exceptionId: null,
        },
        {
          sourceNodeId: "node:widget",
          destinationPath: "post_content/1",
          blockName: "blockify/unsupported-placeholder",
          status: "placeholder",
          findingIds: ["finding:widget"],
          exceptionId: unsupportedWidget.id,
        },
      ],
      destination: {
        conversionRunId: "conversion:42",
        deliveryRecordId: "delivery:42",
        status: "preview",
        referenceUrl: "https://destination.test/about-preview",
        preview: {
          sha256: "b".repeat(64),
          excerpt: "<!-- wp:paragraph --><p>About us</p><!-- /wp:paragraph -->",
        },
      },
      findings: [
        {
          id: "finding:widget",
          pageId: "page:42",
          code: "unsupported-widget",
          severity: "blocking",
          status: "open",
          confidence: 1,
          sourceEvidenceCount: 1,
          owner: "migration-operator",
          message: "Unsupported widget requires manual replacement.",
        },
        {
          id: "finding:spacing",
          pageId: "page:42",
          code: "spacing-normalized",
          severity: "warning",
          status: "resolved",
          confidence: 1,
          sourceEvidenceCount: 1,
          owner: null,
          message: "Paragraph spacing was normalized.",
        },
      ],
      exceptions: [unsupportedWidget],
    },
    history: [],
    audit: [],
  });
}

export function operationAuthorizations(): OperationAuthorization[] {
  return [
    {
      grantId: "grant:recrawl:42",
      operation: "recrawl",
      actor: "release-manager",
      grantedAt: "2026-08-03T12:05:00.000Z",
      reason: "Source owner approved a fresh capture.",
    },
    {
      grantId: "grant:publish:42",
      operation: "publish",
      actor: "release-manager",
      grantedAt: "2026-08-03T12:05:00.000Z",
      reason: "Destination owner approved publication.",
    },
  ];
}
