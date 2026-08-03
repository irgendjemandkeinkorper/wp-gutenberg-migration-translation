export type ExceptionSeverity = "info" | "warning" | "blocking";
export type ExceptionStatus = "open" | "in-progress" | "resolved" | "rejected";

export interface MigrationException {
  id: string;
  placeholderId: string;
  sourceNodeId: string;
  evidence: string[];
  severity: ExceptionSeverity;
  remediation: string;
  owner: string | null;
  status: ExceptionStatus;
  createdAt: string;
  updatedAt: string;
  resolution?: {
    actor: string;
    at: string;
    method: string;
    destinationArtifactId: string;
  };
}

export function createException(input: Omit<MigrationException, "status" | "updatedAt"> & { updatedAt?: string }): MigrationException {
  return { ...input, status: "open", updatedAt: input.updatedAt ?? input.createdAt };
}

export function transitionException(
  exception: MigrationException,
  next: ExceptionStatus,
  at: string,
  resolution?: MigrationException["resolution"],
): MigrationException {
  if (!allowedTransition(exception.status, next)) throw new Error(`Invalid exception transition ${exception.status} -> ${next}.`);
  if (next === "resolved" && !resolution) throw new Error("Resolved exceptions require actor, method, timestamp, and destination artifact.");
  return { ...exception, status: next, updatedAt: at, ...(resolution ? { resolution } : {}) };
}

export function assertReleaseReady(exceptions: readonly MigrationException[]): void {
  const blocking = exceptions.filter((exception) => exception.severity === "blocking" && exception.status !== "resolved");
  if (blocking.length) throw new Error(`Release blocked by unresolved exceptions: ${blocking.map((exception) => exception.id).join(", ")}.`);
}

function allowedTransition(from: ExceptionStatus, to: ExceptionStatus): boolean {
  if (from === to) return true;
  if (from === "open") return to === "in-progress" || to === "rejected";
  if (from === "in-progress") return to === "resolved" || to === "rejected";
  if (from === "resolved" || from === "rejected") return to === "open";
  return false;
}
