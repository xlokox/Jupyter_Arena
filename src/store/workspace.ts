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
}

interface WorkspaceStore {
  activeChallengeId: string | null;
  view: WorkspaceView;
  sidebarTab: SidebarTab;
  sidebarOpen: boolean;
  sectorFilter: SectorFilter;
  difficultyFilter: DifficultyFilter;
  searchQuery: string;
  attempts: Record<string, AttemptState>;
  stats: GameStats;
  lastReward: Reward | null;

  openMission: (challengeId: string) => void;
  openTutorial: (challengeId: string) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setSidebarOpen: (open: boolean) => void;
  setSectorFilter: (filter: SectorFilter) => void;
  setDifficultyFilter: (filter: DifficultyFilter) => void;
  setSearchQuery: (query: string) => void;
  selectOption: (challengeId: string, option: OptionKey) => void;
  startRun: (challengeId: string) => void;
  completeRun: (challengeId: string, wasCorrect: boolean) => void;
  /** Returns an in-flight run to idle (e.g. the server rejected/failed). */
  abortRun: (challengeId: string) => void;
  /** Authed path: the server decided; apply its outcome verbatim. */
  applyServerOutcome: (challengeId: string, result: ServerOutcome) => void;
  /** Sign-in hydration: replace local progress with the account's. */
  hydrateFromServer: (stats: GameStats, solved: ServerSolvedEntry[]) => void;
  /** Sign-out: clear in-memory account progress back to a fresh state. */
  resetProgress: () => void;
  revealHint: (challengeId: string) => void;
  dismissReward: () => void;
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

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activeChallengeId: null,
      view: "mission",
      sidebarTab: "missions",
      sidebarOpen: false,
      sectorFilter: "all",
      difficultyFilter: "all",
      searchQuery: "",
      attempts: {},
      stats: INITIAL_STATS,
      lastReward: null,

      openMission: (challengeId) =>
        set({ activeChallengeId: challengeId, view: "mission", sidebarOpen: false }),

      openTutorial: (challengeId) =>
        set({ activeChallengeId: challengeId, view: "tutorial", sidebarOpen: false }),

      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSectorFilter: (sectorFilter) => set({ sectorFilter }),
      setDifficultyFilter: (difficultyFilter) => set({ difficultyFilter }),
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

          const outcome = wasCorrect
            ? applyCorrectSolve(state.stats, {
                alreadySolved: attempt.solved,
                wrongAttempts: attempt.wrongAttempts,
                hintsUsed: attempt.hintsRevealed,
                now: new Date(),
              })
            : applyWrongAttempt(state.stats);

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
            stats: outcome.stats,
            lastReward: {
              id: rewardCounter,
              events: outcome.events,
              total: outcome.events.reduce((sum, e) => sum + e.delta, 0),
              leveledUp: outcome.leveledUp,
              newLevel: levelForXp(outcome.stats.xp),
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
              lastActiveDay: dailyTicked ? utcDayOf(new Date()) : state.stats.lastActiveDay,
              totalAttempts: state.stats.totalAttempts + (counted ? 1 : 0),
              correctAttempts: state.stats.correctAttempts + (counted && result.is_correct ? 1 : 0),
            },
            lastReward:
              result.events.length === 0
                ? state.lastReward
                : {
                    id: rewardCounter,
                    events: result.events,
                    total: result.xp_delta,
                    leveledUp: result.level > levelForXp(state.stats.xp),
                    newLevel: result.level,
                  },
          };
        }),

      hydrateFromServer: (stats, solved) =>
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
        })),

      resetProgress: () =>
        set({ attempts: {}, stats: INITIAL_STATS, lastReward: null, activeChallengeId: null }),

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
    }),
    {
      name: "jupyter-arena-progress-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ attempts: state.attempts, stats: state.stats }),
      // SSR-safe: AppShell calls persist.rehydrate() in an effect.
      skipHydration: true,
      merge: (persisted, current) => {
        const incoming = (persisted ?? {}) as Partial<WorkspaceStore>;
        return {
          ...current,
          stats: { ...INITIAL_STATS, ...(incoming.stats ?? {}) },
          attempts: sanitizeAttempts(incoming.attempts ?? {}),
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
}

/** Pure filter used by the sidebar; exported for tests and reuse. */
export function filterChallenges<T extends FilterableChallenge>(
  challenges: readonly T[],
  filters: { sector: SectorFilter; difficulty: DifficultyFilter; query: string },
): T[] {
  const query = filters.query.trim().toLowerCase();
  return challenges.filter((challenge) => {
    if (filters.sector !== "all" && challenge.sector !== filters.sector) return false;
    if (filters.difficulty !== "all" && challenge.difficulty !== filters.difficulty) return false;
    if (query === "") return true;
    return (
      challenge.title.toLowerCase().includes(query) ||
      challenge.conceptTags.some((tag) => tag.toLowerCase().includes(query))
    );
  });
}
