export type UrlKind =
  "requested" | "canonical" | "redirected" | "fragment" | "download" | "mailto" | "tel" | "external" | "malformed";

export interface UrlObservation {
  requestedUrl: string;
  finalUrl?: string;
  canonicalUrl?: string;
  status?: number;
  contentType?: string;
}

export interface UrlRecord {
  requested: string;
  normalized: string | null;
  target: string | null;
  fragment: string | null;
  kind: UrlKind;
  redirectChain: string[];
}

export interface UrlMapFinding {
  code: "malformed-url" | "redirect-cycle" | "redirect-conflict";
  message: string;
  url: string;
}

export interface CanonicalUrlMap {
  records: UrlRecord[];
  findings: UrlMapFinding[];
}

export function classifyUrl(raw: string, baseUrl: string): UrlRecord {
  const requested = raw.trim();
  if (/^mailto:/i.test(requested)) return simple(requested, "mailto");
  if (/^tel:/i.test(requested)) return simple(requested, "tel");
  if (/%(?![0-9a-f]{2})/i.test(requested))
    return { requested, normalized: null, target: null, fragment: null, kind: "malformed", redirectChain: [] };
  let parsed: URL;
  let base: URL;
  try {
    base = new URL(baseUrl);
    parsed = new URL(requested, base);
  } catch {
    return { requested, normalized: null, target: null, fragment: null, kind: "malformed", redirectChain: [] };
  }
  const fragment = parsed.hash ? decodeURIComponent(parsed.hash.slice(1)) : null;
  parsed.hash = "";
  const target = parsed.toString();
  const kind: UrlKind = fragment
    ? "fragment"
    : parsed.origin !== base.origin
      ? "external"
      : isDownload(parsed)
        ? "download"
        : "requested";
  return { requested, normalized: target, target, fragment, kind, redirectChain: [] };
}

export function buildCanonicalUrlMap(observations: readonly UrlObservation[], baseUrl: string): CanonicalUrlMap {
  const findings: UrlMapFinding[] = [];
  const byRequested = new Map<string, UrlRecord>();
  const redirectTargets = new Map<string, string>();
  for (const observation of observations) {
    const initial = classifyUrl(observation.requestedUrl, baseUrl);
    if (initial.kind === "malformed") {
      findings.push({
        code: "malformed-url",
        message: `Malformed URL: ${observation.requestedUrl}`,
        url: observation.requestedUrl,
      });
      byRequested.set(observation.requestedUrl, initial);
      continue;
    }
    const final = observation.finalUrl ? classifyUrl(observation.finalUrl, baseUrl) : initial;
    const canonical = observation.canonicalUrl ? classifyUrl(observation.canonicalUrl, baseUrl) : final;
    const redirectChain = [
      initial.target,
      ...(observation.finalUrl && final.target !== initial.target ? [final.target] : []),
    ].filter((value): value is string => value !== null);
    const record: UrlRecord = {
      ...initial,
      normalized: canonical.target,
      target: canonical.target,
      kind:
        observation.finalUrl && final.target !== initial.target
          ? "redirected"
          : canonical.kind === "fragment"
            ? "fragment"
            : initial.kind,
      redirectChain,
    };
    const existing = byRequested.get(observation.requestedUrl);
    if (existing && existing.target !== record.target) {
      findings.push({
        code: "redirect-conflict",
        message: `URL has conflicting targets: ${existing.target} and ${record.target}.`,
        url: observation.requestedUrl,
      });
    }
    byRequested.set(observation.requestedUrl, record);
    if (initial.target && record.target) {
      const prior = redirectTargets.get(initial.target);
      if (prior && prior !== record.target)
        findings.push({
          code: "redirect-conflict",
          message: `Redirect target conflict for ${initial.target}.`,
          url: initial.target,
        });
      redirectTargets.set(initial.target, record.target);
    }
  }
  const records = [...byRequested.values()].sort((left, right) => left.requested.localeCompare(right.requested));
  for (const record of records) {
    if (record.redirectChain.length > 1 && new Set(record.redirectChain).size !== record.redirectChain.length) {
      findings.push({
        code: "redirect-cycle",
        message: `Redirect chain contains a cycle: ${record.redirectChain.join(" -> ")}.`,
        url: record.requested,
      });
    }
  }
  return { records, findings: dedupeFindings(findings) };
}

function simple(requested: string, kind: UrlKind): UrlRecord {
  return { requested, normalized: requested, target: requested, fragment: null, kind, redirectChain: [] };
}

function isDownload(url: URL): boolean {
  return (
    /\.(?:pdf|docx?|xlsx?|zip|csv|txt|json|xml)(?:$|\?)/i.test(url.pathname + url.search) ||
    /(?:download|attachment)=/i.test(url.search)
  );
}

function dedupeFindings(findings: UrlMapFinding[]): UrlMapFinding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.code}:${finding.url}:${finding.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
