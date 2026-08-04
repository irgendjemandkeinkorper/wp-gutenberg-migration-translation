import type { NodeKind, StableNodeIdInput } from "./types";

const FNV_OFFSET = 14695981039346656037n;
const FNV_PRIME = 1099511628211n;
const UINT64_MASK = 0xffffffffffffffffn;

/**
 * Return a deterministic ID for a node's source identity. Structural paths
 * must be unique within a snapshot; changing a path or kind intentionally
 * produces a new ID rather than silently aliasing two semantic nodes.
 */
export function stableNodeId(input: StableNodeIdInput): string {
  return `ir-node-v1-${fnv1a64(canonicalIdentity(input))}`;
}

function canonicalIdentity({ snapshotId, structuralPath, kind }: StableNodeIdInput): string {
  return [snapshotId, structuralPath, kind].map((part) => `${part.length}:${part}`).join("|");
}

function fnv1a64(value: string): string {
  let hash = FNV_OFFSET;
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;
    hash ^= BigInt(codePoint);
    hash = (hash * FNV_PRIME) & UINT64_MASK;
  }
  return hash.toString(16).padStart(16, "0");
}

/** A small helper for callers that need the input shape without repeating the kind cast. */
export function stableNodeIdFor(snapshotId: string, structuralPath: string, kind: NodeKind): string {
  return stableNodeId({ snapshotId, structuralPath, kind });
}
