import { beforeEach, describe, expect, it } from "vitest";
import {
  cleanCacheKey,
  cleanCacheSize,
  clearCleanCache,
  readCleanCache,
  writeCleanCache,
} from "../lib/cache";

describe("clean cache", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips an entry under a content key", () => {
    const key = cleanCacheKey("model-a", "prompt v1", "<p>hi</p>");
    expect(readCleanCache(key)).toBeNull();

    writeCleanCache(key, { html: "<p>hi</p>", lostPositions: [2] });
    const entry = readCleanCache(key);
    expect(entry?.html).toBe("<p>hi</p>");
    expect(entry?.lostPositions).toEqual([2]);
  });

  it("keys diverge when model, prompt, or content differ", () => {
    const base = cleanCacheKey("m", "p", "<p>x</p>");
    expect(cleanCacheKey("m2", "p", "<p>x</p>")).not.toBe(base);
    expect(cleanCacheKey("m", "p2", "<p>x</p>")).not.toBe(base);
    expect(cleanCacheKey("m", "p", "<p>y</p>")).not.toBe(base);
    expect(cleanCacheKey("m", "p", "<p>x</p>")).toBe(base);
  });

  it("ignores corrupt entries", () => {
    const key = cleanCacheKey("m", "p", "c");
    localStorage.setItem(key, "{not json");
    expect(readCleanCache(key)).toBeNull();
    localStorage.setItem(key, JSON.stringify({ html: 5 }));
    expect(readCleanCache(key)).toBeNull();
  });

  it("evicts down to the cap and clears fully", () => {
    for (let i = 0; i < 45; i++) {
      writeCleanCache(cleanCacheKey("m", "p", `page-${i}`), {
        html: `<p>${i}</p>`,
        lostPositions: [],
      });
    }
    expect(cleanCacheSize()).toBeLessThanOrEqual(40);
    clearCleanCache();
    expect(cleanCacheSize()).toBe(0);
  });
});
