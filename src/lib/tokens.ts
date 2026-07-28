// Image placeholder tokens. Delimiters are U+27E6 / U+27E7 (mathematical white
// square brackets) — they essentially never occur in real page text, so no
// escaping scheme is needed. Keep every regex on these exact codepoints.
export const token = (n: number): string => `⟦IMG_${n}⟧`;

export const TOKEN_RE = /⟦IMG_(\d+)⟧/g;

/** "⟦IMG_" prefix — presence in final output means a token leaked through. */
export const TOKEN_PREFIX = "⟦IMG_";

/** Stateless containment check (TOKEN_RE is g-flagged; .test on it is not). */
export function hasToken(text: string): boolean {
  return /⟦IMG_\d+⟧/.test(text);
}

/** All token indices found in a string, in order, duplicates preserved. */
export function tokenIndices(text: string): number[] {
  return [...text.matchAll(TOKEN_RE)].map((m) => parseInt(m[1], 10));
}

/** True if the string is exactly one token and nothing else. */
export function isLoneToken(text: string): boolean {
  const t = text.trim();
  const m = t.match(TOKEN_RE);
  return m !== null && m.length === 1 && m[0] === t;
}
