# Security

Blockify can process private migration source and provider credentials. Never commit API keys, cookies, authorization headers, raw private exports, or generated workspace packages. Source/workspace package exporters redact credential-like headers and logs, but operators must review artifacts before sharing them.

The browser build stores provider settings in browser storage and may call third-party providers or CORS proxies. Treat those boundaries as untrusted: use short-lived, least-privilege keys and a server-side proxy for production deployments. Report suspected credential exposure or unsafe sanitization privately to the repository maintainers rather than opening a public issue.
