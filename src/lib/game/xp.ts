/**
 * Gamification math — MASTER_BRIEF.md Section 9, implemented exactly:
 *   +10 correct first solve · −5 wrong (XP floored at 0)
 *   +5 first-try clean solve (no wrong attempts, ≤1 hint)
 *   +5 first solve of the UTC day (streak tick)
 *   0 for re-solving an already-solved challenge (review mode, no farming)
 *   level = floor(xp/50) + 1 · ranks per the locked tiers
 * Pure functions only — the store calls these; Phase 4 re-implements the same
 * rules inside the submit_attempt RPC and the client just renders the result.
 */

export const XP_PER_LEVEL = 50;
export const XP_CORRECT = 10;
export const XP_WRONG = -5;
export const XP_FIRST_TRY_BONUS = 5;
export const XP_DAILY_FIRST_SOLVE = 5;
export const FIRST_TRY_MAX_HINTS = 1;

export type RankKey = "compileRookie" | "tracebackHunter" | "kernelEngineer" | "overlordCompiler";

export type XpReason = "correct_fix" | "wrong_fix" | "first_try_bonus" | "daily_first_solve";

export interface XpEvent {
  reason: XpReason;
  /** The delta actually applied (a floored wrong attempt may be > -5). */
  delta: number;
}

export interface GameStats {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  /** UTC day ("YYYY-MM-DD") of the most recent solve; null before any solve. */
  lastActiveDay: string | null;
  correctAttempts: number;
  totalAttempts: number;
}

export const INITIAL_STATS: GameStats = {
  xp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDay: null,
  correctAttempts: 0,
  totalAttempts: 0,
};

export interface Outcome {
  stats: GameStats;
  events: XpEvent[];
  leveledUp: boolean;
}

export const levelForXp = (xp: number): number => Math.floor(xp / XP_PER_LEVEL) + 1;

export const xpIntoLevel = (xp: number): number => xp % XP_PER_LEVEL;

export function rankForLevel(level: number): RankKey {
  if (level <= 5) return "compileRookie";
  if (level <= 15) return "tracebackHunter";
  if (level <= 30) return "kernelEngineer";
  return "overlordCompiler";
}

export const utcDayOf = (date: Date): string => date.toISOString().slice(0, 10);

function previousUtcDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return utcDayOf(date);
}

/**
 * The streak to render right now: a streak whose last solve is older than
 * yesterday has lapsed and displays as 0 (the next solve restarts it at 1).
 */
export function displayStreak(stats: GameStats, now: Date): number {
  if (stats.lastActiveDay === null) return 0;
  const today = utcDayOf(now);
  if (stats.lastActiveDay === today || stats.lastActiveDay === previousUtcDay(today)) {
    return stats.currentStreak;
  }
  return 0;
}

/** Correct attempts / total attempts; null before any attempt. */
export function accuracy(stats: GameStats): number | null {
  return stats.totalAttempts === 0 ? null : stats.correctAttempts / stats.totalAttempts;
}

export function applyWrongAttempt(stats: GameStats): Outcome {
  // `|| 0` normalizes the -0 that Math.max(-5, -0) produces at the floor.
  const delta = Math.max(XP_WRONG, -stats.xp) || 0;
  return {
    stats: { ...stats, xp: stats.xp + delta, totalAttempts: stats.totalAttempts + 1 },
    events: [{ reason: "wrong_fix", delta }],
    leveledUp: false,
  };
}

export interface SolveContext {
  /** True when this challenge was already solved before this run. */
  alreadySolved: boolean;
  wrongAttempts: number;
  hintsUsed: number;
  now: Date;
}

export function applyCorrectSolve(stats: GameStats, context: SolveContext): Outcome {
  if (context.alreadySolved) {
    return { stats, events: [], leveledUp: false };
  }

  const events: XpEvent[] = [{ reason: "correct_fix", delta: XP_CORRECT }];
  if (context.wrongAttempts === 0 && context.hintsUsed <= FIRST_TRY_MAX_HINTS) {
    events.push({ reason: "first_try_bonus", delta: XP_FIRST_TRY_BONUS });
  }

  const today = utcDayOf(context.now);
  let { currentStreak, longestStreak, lastActiveDay } = stats;
  if (lastActiveDay !== today) {
    events.push({ reason: "daily_first_solve", delta: XP_DAILY_FIRST_SOLVE });
    currentStreak = lastActiveDay === previousUtcDay(today) ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    lastActiveDay = today;
  }

  const xp = stats.xp + events.reduce((sum, event) => sum + event.delta, 0);
  return {
    stats: {
      xp,
      currentStreak,
      longestStreak,
      lastActiveDay,
      correctAttempts: stats.correctAttempts + 1,
      totalAttempts: stats.totalAttempts + 1,
    },
    events,
    leveledUp: levelForXp(xp) > levelForXp(stats.xp),
  };
}
