import { create } from "zustand";
import type { Challenge, Difficulty, SectorId } from "@/lib/content/schema";

/**
 * Session/game state — MASTER_BRIEF.md Phase 2: local Zustand state only.
 * XP/streak math arrives in Phase 3; persistence and the Supabase RPC in
 * Phases 3–4. Attempt logic lives here so it is unit-testable without the UI.
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

interface WorkspaceStore {
  activeChallengeId: string | null;
  view: WorkspaceView;
  sidebarTab: SidebarTab;
  sidebarOpen: boolean;
  sectorFilter: SectorFilter;
  difficultyFilter: DifficultyFilter;
  searchQuery: string;
  attempts: Record<string, AttemptState>;

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
}

export const getAttempt = (
  attempts: Record<string, AttemptState>,
  challengeId: string,
): AttemptState => attempts[challengeId] ?? EMPTY_ATTEMPT;

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  activeChallengeId: null,
  view: "mission",
  sidebarTab: "missions",
  sidebarOpen: false,
  sectorFilter: "all",
  difficultyFilter: "all",
  searchQuery: "",
  attempts: {},

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
}));

/** Pure filter used by the sidebar; exported for tests and Phase 3 reuse. */
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
