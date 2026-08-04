import { classifyUrl } from "./url-map";

export interface DestinationRecord {
  sourceUrl: string;
  destinationUrl: string;
  stableId: string;
  anchors: ReadonlySet<string>;
}

export interface LinkFinding {
  code: "unresolved-internal" | "missing-anchor" | "malformed-url";
  message: string;
  sourceHref: string;
}

export interface LinkRewriteResult {
  html: string;
  rewritten: number;
  unchanged: number;
  findings: LinkFinding[];
}

export interface LinkRewriteOptions {
  sourcePageUrl: string;
  destinations: readonly DestinationRecord[];
}

/** Rewrite from authoritative destination records; never infer destination slugs. */
export function rewriteInternalLinks(html: string, options: LinkRewriteOptions): LinkRewriteResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  const findings: LinkFinding[] = [];
  const bySource = new Map(options.destinations.map((destination) => [normalize(destination.sourceUrl), destination]));
  let rewritten = 0;
  let unchanged = 0;
  for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
    const sourceHref = anchor.getAttribute("href") ?? "";
    const record = classifyUrl(sourceHref, options.sourcePageUrl);
    if (["external", "mailto", "tel", "download"].includes(record.kind)) {
      unchanged += 1;
      continue;
    }
    if (record.kind === "malformed" || !record.target) {
      findings.push({ code: "malformed-url", message: `Malformed internal URL ${sourceHref}.`, sourceHref });
      unchanged += 1;
      continue;
    }
    const destination = bySource.get(normalize(record.target));
    if (!destination) {
      findings.push({
        code: "unresolved-internal",
        message: `No destination record exists for ${record.target}.`,
        sourceHref,
      });
      unchanged += 1;
      continue;
    }
    let target = destination.destinationUrl;
    if (record.fragment) {
      if (!destination.anchors.has(record.fragment)) {
        findings.push({
          code: "missing-anchor",
          message: `Destination ${destination.stableId} has no anchor ${record.fragment}.`,
          sourceHref,
        });
      } else {
        target += `#${encodeURIComponent(record.fragment)}`;
      }
    }
    anchor.setAttribute("href", target);
    anchor.setAttribute("data-blockify-destination-id", destination.stableId);
    rewritten += 1;
  }
  return {
    html: document.body.innerHTML,
    rewritten,
    unchanged,
    findings,
  };
}

function normalize(value: string): string {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}
