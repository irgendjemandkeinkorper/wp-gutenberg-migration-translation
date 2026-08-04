import { useEffect, useState } from "react";
import { DEFAULT_PROVIDER, getProviderConfig, isLlmProvider, LLM_PROVIDERS, type LlmProvider } from "../lib/llm";

type ProviderValues = Record<LlmProvider, string>;
export type ConnectionMode = "pilot" | "proxy";

function initialConnectionMode(): ConnectionMode {
  return localStorage.getItem("blockify.connectionMode") === "proxy" ? "proxy" : "pilot";
}

function initialProvider(): LlmProvider {
  const saved = localStorage.getItem("blockify.provider");
  return isLlmProvider(saved) ? saved : DEFAULT_PROVIDER;
}

function initialModels(): ProviderValues {
  const legacyGemini = localStorage.getItem("blockify.model");
  return {
    gemini: localStorage.getItem("blockify.model.gemini") || legacyGemini || getProviderConfig("gemini").defaultModel,
    anthropic: localStorage.getItem("blockify.model.anthropic") || getProviderConfig("anthropic").defaultModel,
    openai: localStorage.getItem("blockify.model.openai") || getProviderConfig("openai").defaultModel,
  };
}

function initialApiKeys(): ProviderValues {
  return {
    gemini: sessionStorage.getItem("blockify.apiKey.gemini") || localStorage.getItem("blockify.apiKey") || "",
    anthropic: sessionStorage.getItem("blockify.apiKey.anthropic") || "",
    openai: sessionStorage.getItem("blockify.apiKey.openai") || "",
  };
}

export function useProviderSettings() {
  const [provider, setProvider] = useState<LlmProvider>(initialProvider);
  const [apiKeys, setApiKeys] = useState<ProviderValues>(initialApiKeys);
  const [models, setModels] = useState<ProviderValues>(initialModels);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(initialConnectionMode);
  const [proxyUrl, setProxyUrl] = useState(() => localStorage.getItem("blockify.proxyUrl") || "");
  const [proxyToken, setProxyToken] = useState(() => sessionStorage.getItem("blockify.proxyToken") || "");

  useEffect(() => {
    localStorage.removeItem("blockify.apiKey");
    localStorage.removeItem("blockify.model");
    localStorage.removeItem("blockify.proxyToken");
  }, []);
  useEffect(() => localStorage.setItem("blockify.provider", provider), [provider]);
  useEffect(() => localStorage.setItem("blockify.connectionMode", connectionMode), [connectionMode]);
  useEffect(() => localStorage.setItem("blockify.proxyUrl", proxyUrl), [proxyUrl]);
  useEffect(() => {
    if (proxyToken) sessionStorage.setItem("blockify.proxyToken", proxyToken);
    else sessionStorage.removeItem("blockify.proxyToken");
  }, [proxyToken]);
  useEffect(() => {
    for (const option of LLM_PROVIDERS) {
      localStorage.setItem(`blockify.model.${option.id}`, models[option.id]);
      const keyName = `blockify.apiKey.${option.id}`;
      if (apiKeys[option.id]) {
        sessionStorage.setItem(keyName, apiKeys[option.id]);
      } else {
        sessionStorage.removeItem(keyName);
      }
    }
  }, [apiKeys, models]);

  const providerConfig = getProviderConfig(provider);
  const apiKey = apiKeys[provider];
  const model = models[provider];

  function setApiKey(value: string) {
    setApiKeys((current) => ({ ...current, [provider]: value }));
  }

  function setModel(value: string) {
    setModels((current) => ({ ...current, [provider]: value }));
  }

  return {
    apiKey,
    model,
    provider,
    providerConfig,
    connectionMode,
    proxyUrl,
    proxyToken,
    setApiKey,
    setModel,
    setProvider,
    setConnectionMode,
    setProxyUrl,
    setProxyToken,
  };
}
