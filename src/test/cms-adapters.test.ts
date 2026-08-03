import { describe, expect, it } from "vitest";
import { createDrupalSourceAdapter, createJoomlaSourceAdapter } from "../lib/adapters/cms";
import { createWordPressSourceAdapter } from "../lib/adapters/wordpress";
import { selectSourceAdapter, validateAdapterExtraction } from "../lib/adapters/interface";

describe("CMS source adapters", () => {
  it("detects WordPress and emits bounded extraction hints", () => {
    const adapter = createWordPressSourceAdapter();
    const input = { url: "https://example.test/wp", html: '<meta name="generator" content="WordPress 6.8"><article class="entry-content"><img data-src="/hero.jpg"></article>' };
    const detection = adapter.detect(input);
    expect(detection.confidence).toBeGreaterThan(0.9);
    const extraction = adapter.extract(input, detection);
    expect(extraction.contentRoot).toBe("article");
    expect(extraction.mediaExpansions[0].attributes).toContain("data-src");
    expect(extraction.structuredPageHints.serializedBlocks).toBe("false");
    validateAdapterExtraction(extraction);
  });

  it("detects Drupal and Joomla with auditable evidence", () => {
    const drupal = createDrupalSourceAdapter();
    const drupalInput = { url: "https://drupal.test", html: '<meta name="generator" content="Drupal 10"><main class="region-content">Drupal</main>' };
    expect(drupal.detect(drupalInput).confidence).toBeGreaterThan(0.9);
    expect(drupal.extract(drupalInput, drupal.detect(drupalInput)).structuredPageHints.cms).toBe("drupal");

    const joomla = createJoomlaSourceAdapter();
    const joomlaInput = { url: "https://joomla.test", html: '<meta name="generator" content="Joomla"><main class="item-page">Joomla</main>' };
    expect(joomla.detect(joomlaInput).confidence).toBeGreaterThan(0.9);
    expect(joomla.extract(joomlaInput, joomla.detect(joomlaInput)).structuredPageHints.cms).toBe("joomla");
  });

  it("chooses a deterministic adapter and keeps generic fallback available", () => {
    const input = { url: "https://unknown.test", html: "<main>plain</main>" };
    const selected = selectSourceAdapter(input, [createWordPressSourceAdapter(), createDrupalSourceAdapter(), createJoomlaSourceAdapter()]);
    expect(selected.adapter).toBeNull();
    expect(selected.detection.adapterId).toBe("generic");
  });
});
