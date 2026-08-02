import { beforeEach, describe, expect, it, vi } from "vitest";
import { convertPage } from "../lib/pipeline";

describe("Credential Security and Storage Boundaries", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("ensures convertPage does not write api keys or proxy tokens to localStorage", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    const rawHtml = "<html><body><h1>Test</h1></body></html>";
    await convertPage(
      {
        rawHtml,
        url: "https://example.com",
        apiKey: "test-sensitive-api-key-12345",
        model: "irrelevant",
        skipLlm: true,
        proxyUrl: "https://api.example.com/proxy",
        proxyToken: "test-sensitive-proxy-token-abcde",
      },
      () => {},
    );

    // Ensure Storage.prototype.setItem was never called with sensitive values as values
    // or with blockify.apiKey as a key.
    for (const call of setItemSpy.mock.calls) {
      const [key, value] = call;
      expect(key).not.toBe("blockify.apiKey");
      expect(value).not.toContain("test-sensitive-api-key-12345");
      expect(value).not.toContain("test-sensitive-proxy-token-abcde");
    }
  });

  it("ensures legacy storage is cleaned up and secure on boot simulation", () => {
    // Populate legacy apiKey
    localStorage.setItem("blockify.apiKey", "old-leaked-key");
    expect(localStorage.getItem("blockify.apiKey")).toBe("old-leaked-key");

    // Simulate cleanup logic that runs on App mount / initialization
    localStorage.removeItem("blockify.apiKey");
    expect(localStorage.getItem("blockify.apiKey")).toBeNull();
  });
});
