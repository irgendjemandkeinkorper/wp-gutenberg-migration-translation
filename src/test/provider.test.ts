import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateProviderModel,
  sanitizeErrorMessage,
  parseAndCleanProviderError,
  cleanHtml,
  PROVIDER_CATALOG,
  SYSTEM_PROMPT,
} from "../lib/llm";

describe("Model Catalog Validation", () => {
  it("verifies the catalog is loaded with the expected default Google provider", () => {
    const google = PROVIDER_CATALOG.find(p => p.id === "google");
    expect(google).toBeDefined();
    expect(google?.models.length).toBeGreaterThan(0);
  });

  it("allows supported models to pass validation", () => {
    expect(() => validateProviderModel("google", "gemini-3.6-flash")).not.toThrow();
    expect(() => validateProviderModel("google", "gemini-3.5-flash-lite")).not.toThrow();
  });

  it("fails for stale models with clear status, lastVerified date, and action guidance", () => {
    expect(() => validateProviderModel("google", "gemini-2.5-flash")).toThrowError(
      /Model "Gemini 2.5 Flash" is marked as stale \(last verified: 2025-02-21\)\. Please select a supported model/
    );
  });

  it("fails for unsupported models with status, lastVerified date, and action guidance", () => {
    expect(() => validateProviderModel("google", "gemini-2.5-pro")).toThrowError(
      /Model "Gemini 2.5 Pro" is marked as unsupported \(last verified: 2025-02-21\)\. Please select a supported model/
    );
  });

  it("fails for unknown providers or malformed model IDs", () => {
    expect(() => validateProviderModel("nonexistent", "gemini-3.6-flash")).toThrowError(
      /Unknown provider "nonexistent"/
    );
    expect(() => validateProviderModel("google", "gemini-9.9-ultra-pro")).toThrowError(
      /Unknown model "gemini-9.9-ultra-pro" for provider "Google Gemini"/
    );
  });
});

describe("Credential Sanitization", () => {
  it("sanitizes Google API keys (AIzaSy...) from error strings", () => {
    const rawError = "API key AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q is invalid.";
    const cleaned = sanitizeErrorMessage(rawError);
    expect(cleaned).not.toContain("AIzaSy");
    expect(cleaned).toContain("[REDACTED_API_KEY]");
  });

  it("sanitizes api keys from query params and Bearer tokens", () => {
    const urlError = "Failed request to https://generativelanguage.googleapis.com/v1beta/models/gemini?key=AIzaSy_somekey123";
    const cleanedUrl = sanitizeErrorMessage(urlError);
    expect(cleanedUrl).not.toContain("AIzaSy_somekey123");
    expect(cleanedUrl).toContain("key=[REDACTED");

    const bearerError = "Authorization: Bearer my-secret-jwt-token-here";
    const cleanedBearer = sanitizeErrorMessage(bearerError);
    expect(cleanedBearer).not.toContain("my-secret-jwt-token-here");
    expect(cleanedBearer).toContain("Bearer [REDACTED]");
  });
});

describe("Provider Error Translation & Actionable Recovery Guidance", () => {
  it("translates 401/403 unauthorized errors into invalid API key guidance", () => {
    const errorObj = {
      status: 403,
      message: "API key expired or invalid key AIzaSySecretKey",
    };
    const parsed = parseAndCleanProviderError(errorObj, "google");
    expect(parsed.message).toContain("Provider Error (Google Gemini)");
    expect(parsed.message).toContain("[REDACTED_API_KEY]");
    expect(parsed.message).toContain("Status: 403");
    expect(parsed.message).toContain("Your API key appears to be invalid or unauthorized");
  });

  it("translates 404 errors into model retired or selection guidance", () => {
    const errorObj = new Error("Model gemini-1.0-pro was not found or is no longer available.");
    // Simulate error status code by parsing it from message or custom property
    (errorObj as any).status = 404;
    const parsed = parseAndCleanProviderError(errorObj, "google");
    expect(parsed.message).toContain("Status: 404");
    expect(parsed.message).toContain("The requested model was not found or has been retired by the provider");
  });

  it("translates 429 errors into rate limit recovery guidance", () => {
    const errorObj = new Error("Resource has been exhausted (e.g. queries per minute).");
    (errorObj as any).statusCode = 429;
    const parsed = parseAndCleanProviderError(errorObj, "google");
    expect(parsed.message).toContain("Status: 429");
    expect(parsed.message).toContain("Rate limit exceeded. Please wait a moment before trying again");
  });

  it("translates 500/503 errors into internal server / try later guidance", () => {
    const errorObj = {
      status: 503,
      message: "Service Unavailable",
    };
    const parsed = parseAndCleanProviderError(errorObj, "google");
    expect(parsed.message).toContain("Status: 503");
    expect(parsed.message).toContain("The provider is currently experiencing internal server issues");
  });
});

describe("API Contract Verification (Stubbed Requests)", () => {
  let originalFetch: typeof globalThis.fetch;
  let lastRequestUrl: string | undefined;
  let lastRequestOptions: RequestInit | undefined;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    lastRequestUrl = undefined;
    lastRequestOptions = undefined;

    // Stub globalThis.fetch to intercept SDK requests
    globalThis.fetch = vi.fn(async (url, options) => {
      lastRequestUrl = typeof url === "string" ? url : (url as any).url || String(url);
      lastRequestOptions = options;

      // Return a successful mocked response
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "<h2>Cleaned HTML</h2>",
                },
              ],
            },
          },
        ],
      };

      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      } as Response;
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("verifies the SDK sends request to correct URL containing the model and with appropriate headers/payload", async () => {
    const result = await cleanHtml({
      apiKey: "AIzaSyFakeKey1234567890",
      model: "gemini-3.6-flash",
      title: "Test Page",
      html: "<div><h1>Dirty title</h1><p>Clean text</p></div>",
    });

    expect(result).toBe("<h2>Cleaned HTML</h2>");

    // Check request URL
    expect(lastRequestUrl).toBeDefined();
    expect(lastRequestUrl).toContain("https://generativelanguage.googleapis.com");
    expect(lastRequestUrl).toContain("/models/gemini-3.6-flash:generateContent");

    // Check request options and payload
    expect(lastRequestOptions).toBeDefined();
    expect(lastRequestOptions?.method).toBe("POST");

    // Assert that headers contain the API key (redacted or configured)
    const headers = lastRequestOptions?.headers as any;
    expect(headers).toBeDefined();
    let apiKeyHeader: string | null = null;
    if (headers) {
      if (typeof headers.get === "function") {
        apiKeyHeader = headers.get("x-goog-api-key") || headers.get("Authorization");
      } else {
        apiKeyHeader = headers["x-goog-api-key"] || headers["Authorization"] || headers["x-goog-api-key".toLowerCase()] || headers["Authorization".toLowerCase()];
      }
    }
    expect(apiKeyHeader || lastRequestUrl).toContain("AIzaSyFakeKey1234567890");

    // Assert that request body matches expectations
    expect(lastRequestOptions?.body).toBeDefined();
    const bodyStr = lastRequestOptions?.body as string;
    const body = JSON.parse(bodyStr);

    // Verify systemPrompt/systemInstruction rules are passed
    expect(body.systemInstruction?.parts?.[0]?.text).toContain(SYSTEM_PROMPT);

    // Verify contents contain user prompt with title & html
    const contents = body.contents;
    expect(contents).toBeDefined();
    const promptText = contents[0]?.parts?.[0]?.text;
    expect(promptText).toContain("Test Page");
    expect(promptText).toContain("Dirty title");
  });
});
