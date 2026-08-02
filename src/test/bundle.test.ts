import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadBundle, saveBundle, addOrReplaceBundleEntry } from "../lib/bundle";
import type { BundlePage } from "../lib/types";

describe("WXR Bundle Operations", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockPage1: BundlePage = {
    title: "Page One",
    link: "https://example.com/one",
    contentBlocks: "<!-- wp:paragraph --><p>One</p>",
    images: [],
  };

  const mockPage2: BundlePage = {
    title: "Page Two",
    link: "https://example.com/two",
    contentBlocks: "<!-- wp:paragraph --><p>Two</p>",
    images: [],
  };

  it("loads an empty bundle when nothing is in localStorage", () => {
    const loaded = loadBundle();
    expect(loaded).toEqual([]);
  });

  it("saves and loads bundle pages correctly", () => {
    const success = saveBundle([mockPage1, mockPage2]);
    expect(success).toBe(true);

    const loaded = loadBundle();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].title).toBe("Page One");
    expect(loaded[1].title).toBe("Page Two");
  });

  it("handles storage full or unavailable gracefully", () => {
    // Force localStorage.setItem to throw a QuotaExceededError
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const pages = [mockPage1];
    // saveBundle should catch the error and return false
    const success = saveBundle(pages);
    expect(success).toBe(false);

    // Ensure the in-memory array is unaffected by the failure
    expect(pages).toEqual([mockPage1]);

    setItemSpy.mockRestore();
  });

  describe("addOrReplaceBundleEntry (Duplicate Handling by URL)", () => {
    it("appends a new entry when the URL does not exist", () => {
      const initial: BundlePage[] = [mockPage1];
      const result = addOrReplaceBundleEntry(initial, mockPage2);
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(mockPage2);
    });

    it("replaces/updates an existing entry when the URL matches", () => {
      const initial: BundlePage[] = [mockPage1];
      const updatedPage: BundlePage = {
        title: "Page One (Updated)",
        link: "https://example.com/one",
        contentBlocks: "<!-- wp:paragraph --><p>Updated content</p>",
        images: [{ src: "https://example.com/img.jpg", alt: "Image" }],
      };

      const result = addOrReplaceBundleEntry(initial, updatedPage);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Page One (Updated)");
      expect(result[0].contentBlocks).toContain("Updated content");
      expect(result[0].images).toHaveLength(1);
    });
  });
});
