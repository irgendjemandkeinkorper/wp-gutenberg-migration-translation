import { LLM_PROVIDERS, type LlmProvider, type LlmProviderConfig } from "../lib/llm";

interface SettingsPanelProps {
  visible: boolean;
  provider: LlmProvider;
  providerConfig: LlmProviderConfig;
  apiKey: string;
  model: string;
  onClose: () => void;
  onProviderChange: (provider: LlmProvider) => void;
  onApiKeyChange: (apiKey: string) => void;
  onModelChange: (model: string) => void;
}

export function SettingsPanel({
  visible,
  provider,
  providerConfig,
  apiKey,
  model,
  onClose,
  onProviderChange,
  onApiKeyChange,
  onModelChange,
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
            <a href={providerConfig.keyUrl} target="_blank" rel="noreferrer">
              Open {providerConfig.shortName} key settings
            </a>
          </span>
        </label>
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
        <strong>Private-browser mode.</strong> Keys are kept only for this browser tab, never included in an export, and
        sent directly to the selected provider. For a public production deployment, route AI requests through a backend
        so credentials never reach the browser.
        {provider === "openai" && <> Use an OpenAI Platform API key; a ChatGPT subscription is separate.</>}
      </div>
    </section>
  );
}
