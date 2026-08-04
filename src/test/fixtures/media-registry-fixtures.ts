import type { MediaObservation } from "../../lib/media/registry";

export const MEDIA_FIXTURE_PAGE_A = "https://legacy.example.test/golf";
export const MEDIA_FIXTURE_PAGE_B = "https://legacy.example.test/clubhouse";

export const SAME_BYTES_HASH = "sha256:same-image-bytes";
export const CHANGED_BYTES_HASH = "sha256:changed-image-bytes";

export function duplicateUrlFixture(): MediaObservation[] {
  return [
    observation(MEDIA_FIXTURE_PAGE_A, "https://cdn.example.test/photos/logo.jpg", SAME_BYTES_HASH),
    observation(MEDIA_FIXTURE_PAGE_B, "https://cdn.example.test/photos/logo.jpg", SAME_BYTES_HASH),
  ];
}

export function sameBytesDifferentUrlFixture(): MediaObservation[] {
  return [
    observation(MEDIA_FIXTURE_PAGE_A, "https://cdn.example.test/photos/hero.jpg?w=1600&fit=crop", SAME_BYTES_HASH),
    observation(MEDIA_FIXTURE_PAGE_B, "https://images.example.test/hero-original.jpg", SAME_BYTES_HASH),
    observation(MEDIA_FIXTURE_PAGE_B, "https://images.example.test/hero-original.jpg?w=2", SAME_BYTES_HASH),
  ];
}

export function sameUrlChangedBytesFixture(): MediaObservation[] {
  return [
    observation(MEDIA_FIXTURE_PAGE_A, "https://cdn.example.test/photos/hero.jpg", SAME_BYTES_HASH),
    observation(MEDIA_FIXTURE_PAGE_B, "https://cdn.example.test/photos/hero.jpg", CHANGED_BYTES_HASH),
  ];
}

function observation(pageUrl: string, sourceUrl: string, contentHash: string): MediaObservation {
  return {
    pageUrl,
    sourceUrl,
    baseUrl: pageUrl,
    nodeIndex: 0,
    alt: "Clubhouse hero",
    caption: "A preserved caption",
    title: "Clubhouse",
    credit: "Blockify fixture",
    linkTarget: "https://legacy.example.test/gallery",
    contentHash,
    mime: "image/jpeg",
    byteLength: 128,
    dimensions: { width: 1600, height: 900 },
    filename: "hero.jpg",
    acquisition: {
      requestedUrl: sourceUrl,
      finalUrl: sourceUrl,
      status: 200,
      mime: "image/jpeg",
      byteLength: 128,
      dimensions: { width: 1600, height: 900 },
      filename: "hero.jpg",
      content: {
        sha256: contentHash,
        byteLength: 128,
        storageKey: `blobs/${contentHash}`,
      },
      archiveRecordId: `asset-${contentHash}`,
      errors: [],
    },
  };
}
