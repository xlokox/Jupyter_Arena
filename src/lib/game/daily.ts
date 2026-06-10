/**
 * Daily challenge selection — one featured challenge per UTC day at a stable
 * URL (MASTER_BRIEF.md Section 3). Deterministic: the same UTC date and the
 * same catalog always pick the same challenge, regardless of input order.
 */
export function dailyChallengeId(ids: readonly string[], utcDay: string): string | null {
  if (ids.length === 0) return null;
  // FNV-1a over the date string for a stable, well-spread index.
  let hash = 0x811c9dc5;
  for (let i = 0; i < utcDay.length; i++) {
    hash ^= utcDay.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const sorted = [...ids].sort();
  return sorted[hash % sorted.length] ?? null;
}
