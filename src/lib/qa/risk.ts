export type RiskSeverity = "info" | "warning" | "blocking";
export type RiskStatus = "open" | "in-progress" | "resolved" | "rejected";

export interface RiskFindingInput {
  id: string;
  pageId?: string;
  code: string;
  severity: RiskSeverity;
  status: RiskStatus;
  confidence?: number;
  sourceEvidenceCount?: number;
  unresolved?: boolean;
  owner?: string | null;
  message: string;
}

export interface RiskFinding extends RiskFindingInput {
  score: number;
  factors: string[];
}

export interface RiskQueueFilters {
  minimumScore?: number;
  severities?: readonly RiskSeverity[];
  statuses?: readonly RiskStatus[];
  owner?: string | null;
  pageId?: string;
}

export function scoreRiskFinding(input: RiskFindingInput): RiskFinding {
  const factors: string[] = [];
  let score = input.severity === "blocking" ? 70 : input.severity === "warning" ? 40 : 10;
  if (input.unresolved ?? input.status === "open") {
    score += 15;
    factors.push("unresolved");
  }
  if ((input.confidence ?? 1) < 0.75) {
    score += 10;
    factors.push("low-confidence");
  }
  if ((input.sourceEvidenceCount ?? 1) === 0) {
    score += 5;
    factors.push("missing-source-evidence");
  }
  if (input.severity === "blocking") factors.push("blocking-severity");
  return { ...input, score: Math.min(100, score), factors };
}

export function buildRiskQueue(findings: readonly RiskFindingInput[], filters: RiskQueueFilters = {}): RiskFinding[] {
  const allowedSeverities = filters.severities ? new Set(filters.severities) : null;
  const allowedStatuses = filters.statuses ? new Set(filters.statuses) : null;
  return findings.map(scoreRiskFinding)
    .filter((finding) => filters.minimumScore === undefined || finding.score >= filters.minimumScore)
    .filter((finding) => !allowedSeverities || allowedSeverities.has(finding.severity))
    .filter((finding) => !allowedStatuses || allowedStatuses.has(finding.status))
    .filter((finding) => filters.owner === undefined || finding.owner === filters.owner)
    .filter((finding) => filters.pageId === undefined || finding.pageId === filters.pageId)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
}
