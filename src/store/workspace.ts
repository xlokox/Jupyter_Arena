import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Difficulty, SectorId } from "@/lib/content/schema";
import {
  applyCorrectSolve,
  applyWrongAttempt,
  INITIAL_STATS,
  levelForXp,
  utcDayOf,
  type GameStats,
  type XpEvent,
} from "@/lib/game/xp";
import {
  applyDailyStreakTick,
  DAILY_GOAL_TARGET,
  tickDailyGoal,
  type DailyGoalState,
} from "@/lib/game/streak";
import type { BadgeId } from "@/lib/game/badges";

/**
 * Session/game state — Zustand with localStorage persistence for anonymous
 * users (MASTER_BRIEF.md Phase 3). Attempts + stats persist; navigation and
 * filters are session-only. Phase 4 moves authed writes to the submit_attempt
 * RPC; this store keeps powering anonymous play.
 */

export type OptionKey = "a" | "b" | "c";
export type RunState = "idle" | "running" | "solved" | "failed";
export type SectorFilter = SectorId | "all";
export type DifficultyFilter = Difficulty | "all";
export type TrackFilter = "all" | "debugging" | "reasoning";
export type SidebarTab = "missions" | "tutorials";
export type WorkspaceView = "mission" | "tutorial";

export interface AttemptState {
  selectedOption: OptionKey | null;
  runState: RunState;
  /** Option whose patch/result is currently displayed (last executed). */
  lastRunOption: OptionKey | null;
  wrongAttempts: number;
  hintsRevealed: number;
  solved: boolean;
}

export const EMPTY_ATTEMPT: AttemptState = {
  selectedOption: null,
  runState: "idle",
  lastRunOption: null,
  wrongAttempts: 0,
  hintsRevealed: 0,
  solved: false,
};

export const MAX_HINTS = 2;

/** XP feedback for the toast layer; `id` retriggers the animation. */
export interface Reward {
  id: number;
  events: XpEvent[];
  total: number;
  leveledUp: boolean;
  newLevel: number;
  /** Level before this reward, so the toast can compute newly unlocked content. */
  prevLevel: number;
}

/** A just-earned badge for the toast layer; `n` retriggers the animation. */
export interface BadgeReward {
  id: BadgeId;
  n: number;
}

/** A fresh daily goal carrying no day yet — rolls over on the first solve. */
export const EMPTY_DAILY_GOAL: DailyGoalState = {
  date: "",
  progress: 0,
  target: DAILY_GOAL_TARGET,
  completedDates: [],
};

interface WorkspaceStore {
  activeChallengeId: string | null;
  view: WorkspaceView;
  sidebarTab: SidebarTab;
  sidebarOpen: boolean;
  sectorFilter: SectorFilter;
  difficultyFilter: DifficultyFilter;
  /** All / Debugging / Reasoning. UI surfaces it only when the active sector has both tracks. */
  trackFilter: TrackFilter;
  searchQuery: string;
  attempts: Record<string, AttemptState>;
  stats: GameStats;
  lastReward: Reward | null;
  /** Streak-protection tokens (5.6b); persisted; server-authoritative when authed. */
  freezeTokens: number;
  /** Today's solve goal; `completedDates` drives the Daily Devoted badge. */
  dailyGoal: DailyGoalState;
  /** Badge ids earned so far; persisted; the diff baseline for new awards. */
  earnedBadges: BadgeId[];
  /** Most recent badge earned — drives a toast; session-only. */
  lastBadge: BadgeReward | null;
  /** Opt-in audio cues — off by default, persisted, toggled by the user. */
  soundEnabled: boolean;

  openMission: (challengeId: string) => void;
  openTutorial: (challengeId: string) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setSidebarOpen: (open: boolean) => void;
  setSectorFilter: (filter: SectorFilter) => void;
  setDifficultyFilter: (filter: DifficultyFilter) => void;
  setTrackFilter: (filter: TrackFilter) => void;
  setSearchQuery: (query: string) => void;
  selectOption: (challengeId: string, option: OptionKey) => void;
  startRun: (challengeId: string) => void;
  completeRun: (challengeId: string, wasCorrect: boolean) => void;
  /** Returns an in-flight run to idle (e.g. the server rejected/failed). */
  abortRun: (challengeId: string) => void;
  /** Authed path: the server decided; apply its outcome verbatim. */
  applyServerOutcome: (challengeId: string, result: ServerOutcome) => void;
  /** Sign-in hydration: replace local progress with the account's. */
  hydrateFromServer: (
    stats: GameStats,
    solved: ServerSolvedEntry[],
    extras?: AccountExtras,
  ) => void;
  /** Anonymous badge eval (AppShell): replace the set and surface new earns. */
  awardBadges: (fullSet: BadgeId[], newly: BadgeId[]) => void;
  /** Sign-out: clear in-memory account progress back to a fresh state. */
  resetProgress: () => void;
  revealHint: (challengeId: string) => void;
  dismissReward: () => void;
  dismissBadge: () => void;
  /** Flip the opt-in sound preference (this click also unlocks the AudioContext). */
  toggleSound: () => void;
}

/** Server-derived achievement state applied at sign-in hydration. */
export interface AccountExtras {
  freezeTokens: number;
  earnedBadges: BadgeId[];
  dailyGoal: DailyGoalState;
}

/** Shape of the submit_attempt RPC response the store consumes. */
export interface ServerOutcome {
  is_correct: boolean;
  xp_delta: number;
  new_xp: number;
  level: number;
  streak: number;
  already_solved: boolean;
  events: XpEvent[];
  // 5.6b additive fields (older callers/tests may omit them).
  streak_freeze_tokens?: number;
  streak_freeze_spent?: boolean;
  daily_goal?: { progress: number; target: number; completed: boolean } | null;
  newly_awarded?: BadgeId[];
}

export interface ServerSolvedEntry {
  challengeId: string;
  attempts: number;
  hintsUsed: number;
  solved: boolean;
}

export const getAttempt = (
  attempts: Record<string, AttemptState>,
  challengeId: string,
): AttemptState => attempts[challengeId] ?? EMPTY_ATTEMPT;

/**
 * A tab killed mid-simulation persists a "running" attempt that no timer
 * will ever complete; rehydration returns those to idle.
 */
export function sanitizeAttempts(
  attempts: Record<string, AttemptState>,
): Record<string, AttemptState> {
  return Object.fromEntries(
    Object.entries(attempts).map(([id, attempt]) => [
      id,
      attempt.runState === "running" ? { ...attempt, runState: "idle" } : attempt,
    ]),
  );
}

let rewardCounter = 0;
let badgeCounter = 0;

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activeChallengeId: null,
      view: "mission",
      sidebarTab: "missions",
      sidebarOpen: false,
      sectorFilter: "all",
      difficultyFilter: "all",
      trackFilter: "all",
      searchQuery: "",
      attempts: {},
      stats: INITIAL_STATS,
      lastReward: null,
      freezeTokens: 0,
      dailyGoal: EMPTY_DAILY_GOAL,
      earnedBadges: [],
      lastBadge: null,
      soundEnabled: false,

      openMission: (challengeId) =>
        set({ activeChallengeId: challengeId, view: "mission", sidebarOpen: false }),

      openTutorial: (challengeId) =>
        set({ activeChallengeId: challengeId, view: "tutorial", sidebarOpen: false }),

      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSectorFilter: (sectorFilter) => set({ sectorFilter }),
      setDifficultyFilter: (difficultyFilter) => set({ difficultyFilter }),
      setTrackFilter: (trackFilter) => set({ trackFilter }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      selectOption: (challengeId, option) =>
        set((state) => {
          const attempt = getAttempt(state.attempts, challengeId);
          if (attempt.solved || attempt.runState === "running") return state;
          return {
            attempts: {
              ...state.attempts,
              [challengeId]: {
                ...attempt,
                selectedOption: option,
                // Picking a new option after a failed run returns the cell to idle.
                runState: "idle",
              },
            },
          };
        }),

      startRun: (challengeId) =>
        set((state) => {
          const attempt = getAttempt(state.attempts, challengeId);
          if (attempt.solved || attempt.runState === "running" || !attempt.selectedOption) {
            return state;
          }
          return {
            attempts: {
              ...state.attempts,
              [challengeId]: { ...attempt, runState: "running" },
            },
          };
        }),

      completeRun: (challengeId, wasCorrect) =>
        set((state) => {
          const attempt = getAttempt(state.attempts, challengeId);
          if (attempt.runState !== "running" || !attempt.selectedOption) return state;

          const now = new Date();
          const isFirstSolve = wasCorrect && !attempt.solved;
          const outcome = wasCorrect
            ? applyCorrectSolve(state.stats, {
                alreadySolved: attempt.solved,
                wrongAttempts: attempt.wrongAttempts,
                hintsUsed: attempt.hintsRevealed,
                now,
              })
            : applyWrongAttempt(state.stats);

          // A genuine first solve also ticks the freeze-aware streak (the single
          // streak truth) and today's daily goal. Badges are evaluated in
          // AppShell, which has the challenge metadata the store must not import.
          let stats = outcome.stats;
          let freezeTokens = state.freezeTokens;
          let dailyGoal = state.dailyGoal;
          if (isFirstSolve) {
            const today = utcDayOf(now);
            const tick = applyDailyStreakTick({
              currentStreak: state.stats.currentStreak,
              longestStreak: state.stats.longestStreak,
              lastActiveDay: state.stats.lastActiveDay,
              freezeTokens: state.freezeTokens,
              today,
            });
            stats = {
              ...outcome.stats,
              currentStreak: tick.currentStreak,
              longestStreak: tick.longestStreak,
              lastActiveDay: tick.lastActiveDay,
            };
            freezeTokens = tick.freezeTokens;
            dailyGoal = tickDailyGoal(state.dailyGoal, today);
          }

          rewardCounter += 1;
          return {
            attempts: {
              ...state.attempts,
              [challengeId]: {
                ...attempt,
                runState: wasCorrect ? "solved" : "failed",
                solved: wasCorrect,
                lastRunOption: attempt.selectedOption,
                wrongAttempts: attempt.wrongAttempts + (wasCorrect ? 0 : 1),
              },
            },
            stats,
            freezeTokens,
            dailyGoal,
            lastReward: {
              id: rewardCounter,
              events: outcome.events,
              total: outcome.events.reduce((sum, e) => sum + e.delta, 0),
              leveledUp: outcome.leveledUp,
              newLevel: levelForXp(stats.xp),
              prevLevel: levelForXp(state.stats.xp),
            },
          };
        }),

      abortRun: (challengeId) =>
        set((state) => {
          const attempt = getAttempt(state.attempts, challengeId);
          if (attempt.runState !== "running") return state;
          return {
            attempts: {
              ...state.attempts,
              [challengeId]: { ...attempt, runState: "idle" },
            },
          };
        }),

      applyServerOutcome: (challengeId, result) =>
        set((state) => {
          const attempt = getAttempt(state.attempts, challengeId);
          if (attempt.runState !== "running" || !attempt.selectedOption) return state;

          const dailyTicked = result.events.some((e) => e.reason === "daily_first_solve");
          const counted = !(result.is_correct && result.already_solved);
          const today = utcDayOf(new Date());

          let dailyGoal = state.dailyGoal;
          if (result.daily_goal) {
            const completedDates =
              result.daily_goal.completed && !state.dailyGoal.completedDates.includes(today)
                ? [...state.dailyGoal.completedDates, today]
                : state.dailyGoal.completedDates;
            dailyGoal = {
              date: today,
              progress: result.daily_goal.progress,
              target: result.daily_goal.target,
              completedDates,
            };
          }

          const newly = result.newly_awarded ?? [];
          const earnedBadges = newly.length
            ? (Array.from(new Set([...state.earnedBadges, ...newly])) as BadgeId[])
            : state.earnedBadges;
          let lastBadge = state.lastBadge;
          if (newly.length > 0) {
            badgeCounter += 1;
            lastBadge = { id: newly[newly.length - 1]!, n: badgeCounter };
          }

          rewardCounter += 1;
          return {
            attempts: {
              ...state.attempts,
              [challengeId]: {
                ...attempt,
                runState: result.is_correct ? "solved" : "failed",
                solved: result.is_correct,
                lastRunOption: attempt.selectedOption,
                wrongAttempts: attempt.wrongAttempts + (result.is_correct ? 0 : 1),
              },
            },
            stats: {
              ...state.stats,
              xp: result.new_xp,
              currentStreak: result.streak,
              longestStreak: Math.max(state.stats.longestStreak, result.streak),
              lastActiveDay: dailyTicked ? today : state.stats.lastActiveDay,
              totalAttempts: state.stats.totalAttempts + (counted ? 1 : 0),
              correctAttempts: state.stats.correctAttempts + (counted && result.is_correct ? 1 : 0),
            },
            freezeTokens: result.streak_freeze_tokens ?? state.freezeTokens,
            dailyGoal,
            earnedBadges,
            lastBadge,
            lastReward:
              result.events.length === 0
                ? state.lastReward
                : {
                    id: rewardCounter,
                    events: result.events,
                    total: result.xp_delta,
                    leveledUp: result.level > levelForXp(state.stats.xp),
                    newLevel: result.level,
                    prevLevel: levelForXp(state.stats.xp),
                  },
          };
        }),

      hydrateFromServer: (stats, solved, extras) =>
        set(() => ({
          stats,
          attempts: Object.fromEntries(
            solved.map((entry) => [
              entry.challengeId,
              {
                ...EMPTY_ATTEMPT,
                solved: entry.solved,
                runState: entry.solved ? ("solved" as const) : ("idle" as const),
                wrongAttempts: Math.max(0, entry.attempts - (entry.solved ? 1 : 0)),
                hintsRevealed: Math.min(entry.hintsUsed, MAX_HINTS),
              },
            ]),
          ),
          lastReward: null,
          freezeTokens: extras?.freezeTokens ?? 0,
          earnedBadges: extras?.earnedBadges ?? [],
          dailyGoal: extras?.dailyGoal ?? EMPTY_DAILY_GOAL,
          lastBadge: null,
        })),

      awardBadges: (fullSet, newly) =>
        set(() => {
          if (newly.length === 0) return { earnedBadges: fullSet };
          badgeCounter += 1;
          return {
            earnedBadges: fullSet,
            lastBadge: { id: newly[newly.length - 1]!, n: badgeCounter },
          };
        }),

      resetProgress: () =>
        set({
          attempts: {},
          stats: INITIAL_STATS,
          lastReward: null,
          activeChallengeId: null,
          freezeTokens: 0,
          dailyGoal: EMPTY_DAILY_GOAL,
          earnedBadges: [],
          lastBadge: null,
        }),

      revealHint: (challengeId) =>
        set((state) => {
          const attempt = getAttempt(state.attempts, challengeId);
          if (attempt.hintsRevealed >= MAX_HINTS) return state;
          return {
            attempts: {
              ...state.attempts,
              [challengeId]: { ...attempt, hintsRevealed: attempt.hintsRevealed + 1 },
            },
          };
        }),

      dismissReward: () => set({ lastReward: null }),

      dismissBadge: () => set({ lastBadge: null }),

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    }),
    {
      name: "jupyter-arena-progress-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        attempts: state.attempts,
        stats: state.stats,
        freezeTokens: state.freezeTokens,
        dailyGoal: state.dailyGoal,
        earnedBadges: state.earnedBadges,
        soundEnabled: state.soundEnabled,
      }),
      // SSR-safe: AppShell calls persist.rehydrate() in an effect.
      skipHydration: true,
      merge: (persisted, current) => {
        const incoming = (persisted ?? {}) as Partial<WorkspaceStore>;
        return {
          ...current,
          stats: { ...INITIAL_STATS, ...(incoming.stats ?? {}) },
          attempts: sanitizeAttempts(incoming.attempts ?? {}),
          freezeTokens: incoming.freezeTokens ?? 0,
          dailyGoal: incoming.dailyGoal ?? EMPTY_DAILY_GOAL,
          earnedBadges: incoming.earnedBadges ?? [],
          soundEnabled: incoming.soundEnabled ?? false,
        };
      },
    },
  ),
);

/** The fields filtering needs — satisfied by both Challenge and ChallengeMeta. */
export interface FilterableChallenge {
  id: string;
  sector: SectorId;
  difficulty: Difficulty;
  title: string;
  conceptTags: string[];
  /** Optional on the type — debugging is the default for older callers. */
  track?: "debugging" | "reasoning";
}

/** Pure filter used by the sidebar; exported for tests and reuse. */
export function filterChallenges<T extends FilterableChallenge>(
  challenges: readonly T[],
  filters: {
    sector: SectorFilter;
    difficulty: DifficultyFilter;
    query: string;
    track?: TrackFilter;
  },
): T[] {
  const query = filters.query.trim().toLowerCase();
  const trackFilter = filters.track ?? "all";
  return challenges.filter((challenge) => {
    if (filters.sector !== "all" && challenge.sector !== filters.sector) return false;
    if (filters.difficulty !== "all" && challenge.difficulty !== filters.difficulty) return false;
    if (trackFilter !== "all" && (challenge.track ?? "debugging") !== trackFilter) return false;
    if (query === "") return true;
    return (
      challenge.title.toLowerCase().includes(query) ||
      challenge.conceptTags.some((tag) => tag.toLowerCase().includes(query))
    );
  });
}
