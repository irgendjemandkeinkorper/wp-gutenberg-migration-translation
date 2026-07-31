import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanHtml,
  getProviderConfig,
  LLM_PROVIDERS,
  SYSTEM_PROMPT,
} from "../lib/llm";

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Unauthorized",
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("LLM providers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("offers current model choices for every provider", () => {
    expect(LLM_PROVIDERS.map((provider) => provider.id)).toEqual([
      "gemini",
      "anthropic",
      "openai",
    ]);
    expect(getProviderConfig("gemini").defaultModel).toBe("gemini-3.6-flash");
    expect(getProviderConfig("anthropic").defaultModel).toBe("claude-sonnet-5");
    expect(getProviderConfig("openai").models.map((model) => model.id)).toContain(
      "gpt-5.6-sol",
    );
  });

  it("uses the OpenAI Responses API and extracts output text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        output: [
          {
            content: [{ type: "output_text", text: "```html\n<p>Clean</p>\n```" }],
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await cleanHtml({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-5.6-terra",
      title: "Example",
      html: "<div>Clean</div>",
    });

    expect(result).toBe("<p>Clean</p>");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init.headers).toMatchObject({
      authorization: "Bearer sk-test",
      "content-type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "gpt-5.6-terra",
      instructions: SYSTEM_PROMPT,
      store: false,
    });
  });

  it("uses Claude Messages with the browser-access and version headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        content: [
          { type: "text", text: "<p>One</p>" },
          { type: "text", text: "<p>Two</p>" },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await cleanHtml({
      provider: "anthropic",
      apiKey: "sk-ant-test",
      model: "claude-sonnet-5",
      title: "Example",
      html: "<div>One</div><div>Two</div>",
    });

    expect(result).toBe("<p>One</p><p>Two</p>");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init.headers).toMatchObject({
      "anthropic-dangerous-direct-browser-access": "true",
      "anthropic-version": "2023-06-01",
      "x-api-key": "sk-ant-test",
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "claude-sonnet-5",
      max_tokens: 32_768,
      system: SYSTEM_PROMPT,
    });
  });

  it("surfaces provider error messages without exposing credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse({ error: { message: "Invalid API key" } }, 401),
      ),
    );

    await expect(
      cleanHtml({
        provider: "openai",
        apiKey: "do-not-print-this-key",
        model: "gpt-5.6-terra",
        title: "Example",
        html: "<p>Example</p>",
      }),
    ).rejects.toThrow("OpenAI API error 401: Invalid API key");
  });
});
