import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Challenge, Difficulty, SectorId } from "@/lib/content/schema";
import {
  applyCorrectSolve,
  applyWrongAttempt,
  INITIAL_STATS,
  levelForXp,
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
  revealHint: (challengeId: string) => void;
  dismissReward: () => void;
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

/** Pure filter used by the sidebar; exported for tests and reuse. */
export function filterChallenges(
  challenges: readonly Challenge[],
  filters: { sector: SectorFilter; difficulty: DifficultyFilter; query: string },
): Challenge[] {
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
