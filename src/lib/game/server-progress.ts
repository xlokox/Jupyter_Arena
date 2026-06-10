import type { GameStats, XpEvent } from "@/lib/game/xp";
import type { AttemptState } from "@/store/workspace";

/**
 * Authed progress service — wraps the Supabase RPCs. The supabase client is
 * imported lazily inside each function so this module can be statically
 * imported by UI code without pulling supabase-js into the initial bundle.
 * For authed users the SERVER is the only XP authority (Section 9 math runs
 * inside submit_attempt); these functions just transport its decisions.
 */

export interface ServerSubmitResult {
  is_correct: boolean;
  xp_delta: number;
  new_xp: number;
  level: number;
  streak: number;
  already_solved: boolean;
  events: XpEvent[];
}

export interface ServerProgressRow {
  challenge_id: string;
  solved_at: string | null;
  attempts: number;
  hints_used: number;
}

export interface AccountState {
  merged: boolean;
  stats: GameStats;
  progress: ServerProgressRow[];
}

async function requireClient() {
  const { getBrowserClient } = await import("@/lib/supabase/client");
  const client = getBrowserClient();
  if (!client) throw new Error("supabase_not_configured");
  return client;
}

export async function submitAttemptServer(
  challengeId: string,
  optionKey: string,
  hintsUsed: number,
): Promise<ServerSubmitResult> {
  const client = await requireClient();
  const { data, error } = await client.rpc("submit_attempt", {
    p_challenge_id: challengeId,
    p_option_key: optionKey,
    p_hints_used: hintsUsed,
  });
  if (error) throw new Error(error.message);
  return data as ServerSubmitResult;
}

export interface MergeItem {
  challenge_id: string;
  solved: boolean;
  wrong_attempts: number;
  hints_used: number;
}

/** Derives the merge payload from locally persisted attempts. */
export function collectMergeItems(attempts: Record<string, AttemptState>): MergeItem[] {
  return Object.entries(attempts)
    .filter(([, attempt]) => attempt.solved || attempt.wrongAttempts > 0)
    .map(([challengeId, attempt]) => ({
      challenge_id: challengeId,
      solved: attempt.solved,
      wrong_attempts: attempt.wrongAttempts,
      hints_used: attempt.hintsRevealed,
    }));
}

export async function mergeLocalProgress(items: MergeItem[]): Promise<void> {
  const client = await requireClient();
  const { error } = await client.rpc("merge_local_progress", { p_items: items });
  if (error) throw new Error(error.message);
}

export async function fetchAccountState(): Promise<AccountState> {
  const client = await requireClient();
  const [profileRes, statsRes, progressRes, totalRes, correctRes] = await Promise.all([
    client.from("profiles").select("local_merged_at").maybeSingle(),
    client.from("user_stats").select("*").maybeSingle(),
    client.from("user_challenge_progress").select("challenge_id, solved_at, attempts, hints_used"),
    client.from("attempts").select("*", { count: "exact", head: true }),
    client.from("attempts").select("*", { count: "exact", head: true }).eq("is_correct", true),
  ]);

  const stats = statsRes.data;
  return {
    merged: Boolean(profileRes.data?.local_merged_at),
    stats: {
      xp: stats?.xp ?? 0,
      currentStreak: stats?.current_streak ?? 0,
      longestStreak: stats?.longest_streak ?? 0,
      lastActiveDay: stats?.last_active ?? null,
      totalAttempts: totalRes.count ?? 0,
      correctAttempts: correctRes.count ?? 0,
    },
    progress: (progressRes.data ?? []) as ServerProgressRow[],
  };
}

export async function signOut(): Promise<void> {
  const client = await requireClient();
  await client.auth.signOut();
}
