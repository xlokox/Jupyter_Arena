/**
 * Streak-freeze + daily-goal logic (MASTER_BRIEF Phase 5.6b) — the pure
 * anonymous twin of migration 014's submit_attempt blocks A/B/C. Section 9 XP
 * is untouched: `applyDailyStreakTick` only changes the streak COUNTER (never an
 * XP amount), and at zero tokens it is byte-identical to the frozen
 * `applyCorrectSolve` streak rule (extend on yesterday, else reset to 1). The
 * bridge — surviving a single missed UTC day by spending a token — is the
 * sanctioned extension; a token is earned each time the streak hits a multiple
 * of 7 (capped). Keep in lockstep with award/streak SQL in 014.
 */
import { previousUtcDay } from "@/lib/game/xp";

export const DAILY_GOAL_TARGET = 3;
export const MAX_FREEZE_TOKENS = 2;
export const FREEZE_EARN_INTERVAL = 7;

export interface StreakInput {
  currentStreak: number;
  longestStreak: number;
  /** UTC day ("YYYY-MM-DD") of the most recent solve; null before any solve. */
  lastActiveDay: string | null;
  freezeTokens: number;
  /** Today as utcDayOf(now). */
  today: string;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string;
  freezeTokens: number;
  freezeSpent: boolean;
  freezeEarned: boolean;
  /** True when this solve is the first of `today` (a daily tick happened). */
  ticked: boolean;
}

/**
 * Advance the streak for a correct first solve, applying freeze-token spend
 * (bridge a single missed day) and earn (every 7th day, capped). Re-solving on
 * a day already active is a no-op tick.
 */
export function applyDailyStreakTick(input: StreakInput): StreakResult {
  const { currentStreak, longestStreak, lastActiveDay, freezeTokens, today } = input;

  if (lastActiveDay === today) {
    return {
      currentStreak,
      longestStreak,
      lastActiveDay: today,
      freezeTokens,
      freezeSpent: false,
      freezeEarned: false,
      ticked: false,
    };
  }

  const yesterday = previousUtcDay(today);
  const dayBefore = previousUtcDay(yesterday);

  let nextStreak: number;
  let tokens = freezeTokens;
  let freezeSpent = false;

  if (lastActiveDay === yesterday) {
    nextStreak = currentStreak + 1; // continuous
  } else if (lastActiveDay === dayBefore && freezeTokens > 0) {
    nextStreak = currentStreak + 1; // bridge the single missed day
    tokens -= 1;
    freezeSpent = true;
  } else {
    nextStreak = 1; // lapsed (or first ever solve)
  }

  let freezeEarned = false;
  if (nextStreak % FREEZE_EARN_INTERVAL === 0 && tokens < MAX_FREEZE_TOKENS) {
    tokens += 1;
    freezeEarned = true;
  }

  return {
    currentStreak: nextStreak,
    longestStreak: Math.max(longestStreak, nextStreak),
    lastActiveDay: today,
    freezeTokens: tokens,
    freezeSpent,
    freezeEarned,
    ticked: true,
  };
}

export interface DailyGoalState {
  /** UTC day this goal tracks. */
  date: string;
  progress: number;
  target: number;
  /** UTC days on which the goal was completed — drives the Daily Devoted badge. */
  completedDates: string[];
}

export const initialDailyGoal = (today: string): DailyGoalState => ({
  date: today,
  progress: 0,
  target: DAILY_GOAL_TARGET,
  completedDates: [],
});

/**
 * Count one correct first solve toward today's goal, rolling over to a fresh
 * day when needed and recording the completion date the first time the target
 * is reached. Pure and content-free.
 */
export function tickDailyGoal(goal: DailyGoalState, today: string): DailyGoalState {
  const base: DailyGoalState =
    goal.date === today
      ? goal
      : { date: today, progress: 0, target: goal.target || DAILY_GOAL_TARGET, completedDates: goal.completedDates };

  const progress = base.progress + 1;
  const justCompleted = base.progress < base.target && progress >= base.target;
  const completedDates =
    justCompleted && !base.completedDates.includes(today)
      ? [...base.completedDates, today]
      : base.completedDates;

  return { ...base, progress, completedDates };
}
