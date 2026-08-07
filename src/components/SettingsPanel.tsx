import { LLM_PROVIDERS, type LlmProvider, type LlmProviderConfig } from "../lib/llm";
import type { ConnectionMode } from "../hooks/useProviderSettings";

interface SettingsPanelProps {
  visible: boolean;
  provider: LlmProvider;
  providerConfig: LlmProviderConfig;
  apiKey: string;
  model: string;
  connectionMode: ConnectionMode;
  proxyUrl: string;
  proxyToken: string;
  onClose: () => void;
  onProviderChange: (provider: LlmProvider) => void;
  onApiKeyChange: (apiKey: string) => void;
  onModelChange: (model: string) => void;
  onConnectionModeChange: (mode: ConnectionMode) => void;
  onProxyUrlChange: (url: string) => void;
  onProxyTokenChange: (token: string) => void;
}

export function SettingsPanel({
  visible,
  provider,
  providerConfig,
  apiKey,
  model,
  connectionMode,
  proxyUrl,
  proxyToken,
  onClose,
  onProviderChange,
  onApiKeyChange,
  onModelChange,
  onConnectionModeChange,
  onProxyUrlChange,
  onProxyTokenChange,
}: SettingsPanelProps) {
  if (!visible) return null;

  return (
    <section className="panel settings settings-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">AI cleanup</p>
          <h2>Choose your provider</h2>
          <p>Each provider uses the same guarded normalization prompt and deterministic token validation.</p>
        </div>
        <button type="button" className="icon-button" aria-label="Close AI settings" onClick={onClose}>
          ×
        </button>
      </div>

      <fieldset className="connection-mode">
        <legend>API connection / deployment mode</legend>
        <label>
          <input
            type="radio"
            name="connection-mode"
            value="pilot"
            checked={connectionMode === "pilot"}
            onChange={() => onConnectionModeChange("pilot")}
          />
          <span>
            <strong>Private Pilot Mode</strong>
            <small>Call the selected provider directly with a tab-scoped key.</small>
          </span>
        </label>
        <label>
          <input
            type="radio"
            name="connection-mode"
            value="proxy"
            checked={connectionMode === "proxy"}
            onChange={() => onConnectionModeChange("proxy")}
          />
          <span>
            <strong>Production Proxy Mode</strong>
            <small>Route provider-compatible requests through an operator-managed relay.</small>
          </span>
        </label>
      </fieldset>

      <div className="provider-switcher" role="group" aria-label="AI provider">
        {LLM_PROVIDERS.map((option) => (
          <button
            type="button"
            key={option.id}
            className={option.id === provider ? "provider-option active" : "provider-option"}
            aria-pressed={option.id === provider}
            onClick={() => onProviderChange(option.id)}
          >
            <span>{option.shortName}</span>
            <small>{option.models[0].label}</small>
          </button>
        ))}
      </div>

      <div className="settings-grid">
        {connectionMode === "pilot" ? (
          <label>
            {providerConfig.keyLabel}
            <input
              type="password"
              value={apiKey}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => onApiKeyChange(event.target.value)}
              placeholder={providerConfig.keyPlaceholder}
            />
            <span className="field-help">
              Need one?{" "}
              <a href={providerConfig.keyUrl} target="_blank" rel="noopener noreferrer">
                Open {providerConfig.shortName} key settings
              </a>
            </span>
          </label>
        ) : (
          <>
            <label>
              Proxy endpoint URL
              <input
                type="url"
                value={proxyUrl}
                autoComplete="url"
                onChange={(event) => onProxyUrlChange(event.target.value)}
                placeholder="https://api.example.com/provider-proxy/"
              />
            </label>
            <label>
              Proxy access token <span className="muted">(optional)</span>
              <input
                type="password"
                value={proxyToken}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => onProxyTokenChange(event.target.value)}
                placeholder="Bearer or authorization token"
              />
            </label>
          </>
        )}
        <label>
          Model
          <select value={model} onChange={(event) => onModelChange(event.target.value)}>
            {providerConfig.models.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} · {option.note}
              </option>
            ))}
          </select>
          <span className="field-help">Requests go only to {providerConfig.apiHost}.</span>
        </label>
      </div>

      <div className="security-note" role="note">
        <strong>{connectionMode === "pilot" ? "Private Pilot Mode." : "Production Proxy Mode."}</strong>{" "}
        {connectionMode === "pilot"
          ? "Keys are kept only for this browser tab, never included in an export, and sent directly to the selected provider."
          : "The relay URL is retained locally, but its optional access token is kept only for this browser tab and never exported."}
        {provider === "openai" && <> Use an OpenAI Platform API key; a ChatGPT subscription is separate.</>}
      </div>
    </section>
  );
}
