"use client";

import { useCallback, useEffect, useMemo } from "react";
import { FlaskConical } from "lucide-react";
import type { Challenge, ChallengeMeta, Sector } from "@/lib/content/schema";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { XpToast } from "@/components/xp-toast";
import { NotebookView } from "@/components/notebook/notebook-view";
import { TutorialView } from "@/components/tutorial-view";
import { dailyChallengeId } from "@/lib/game/daily";
import { utcDayOf } from "@/lib/game/xp";
import { evaluateBadges, languageFamily, type SolvedFact } from "@/lib/game/badges";
import type { SectorId } from "@/lib/content/schema";
import { filterChallenges, getAttempt, useWorkspaceStore } from "@/store/workspace";
import { useAuthStore } from "@/store/auth";
import { en } from "@/i18n/en";

interface AppShellProps {
  challenges: ChallengeMeta[];
  sectors: Sector[];
  /** When set (e.g. /daily or /challenge/[id]), this mission opens on mount. */
  initialChallengeId?: string | null;
  /** Permalink pages embed the full body server-side (SEO + instant paint). */
  initialChallenge?: Challenge | null;
}

export function AppShell({ challenges, initialChallengeId, initialChallenge }: AppShellProps) {
  const activeChallengeId = useWorkspaceStore((s) => s.activeChallengeId);
  const view = useWorkspaceStore((s) => s.view);
  const sectorFilter = useWorkspaceStore((s) => s.sectorFilter);
  const difficultyFilter = useWorkspaceStore((s) => s.difficultyFilter);
  const searchQuery = useWorkspaceStore((s) => s.searchQuery);
  const sidebarOpen = useWorkspaceStore((s) => s.sidebarOpen);
  const setSidebarOpen = useWorkspaceStore((s) => s.setSidebarOpen);
  const openMission = useWorkspaceStore((s) => s.openMission);
  const attempts = useWorkspaceStore((s) => s.attempts);
  const longestStreak = useWorkspaceStore((s) => s.stats.longestStreak);
  const dailyGoalsCompleted = useWorkspaceStore((s) => s.dailyGoal.completedDates.length);
  const earnedBadges = useWorkspaceStore((s) => s.earnedBadges);
  const awardBadges = useWorkspaceStore((s) => s.awardBadges);
  const isAuthed = useAuthStore((s) => s.status === "signedIn");

  const active = challenges.find((c) => c.id === activeChallengeId) ?? null;

  // Anonymous badge evaluation lives here (not the content-agnostic store):
  // AppShell holds the metadata badges need (sector/language/difficulty). For
  // authed users the server returns awards via submit_attempt, so we skip.
  useEffect(() => {
    if (isAuthed) return;
    const sectorTotals = { ml: 0, dl: 0, fullstack: 0, db: 0 } as Record<SectorId, number>;
    const solved: SolvedFact[] = [];
    for (const c of challenges) {
      sectorTotals[c.sector] += 1;
      const attempt = getAttempt(attempts, c.id);
      if (attempt.solved) {
        solved.push({
          sector: c.sector,
          difficulty: c.difficulty,
          language: languageFamily(c.language),
          flawless: attempt.wrongAttempts === 0 && attempt.hintsRevealed <= 1,
          hintsUsed: attempt.hintsRevealed,
        });
      }
    }
    const full = [...evaluateBadges({ solved, sectorTotals, longestStreak, dailyGoalsCompleted })];
    const newly = full.filter((id) => !earnedBadges.includes(id));
    if (newly.length > 0) awardBadges(full, newly);
  }, [isAuthed, challenges, attempts, longestStreak, dailyGoalsCompleted, earnedBadges, awardBadges]);

  // Today's featured pick is exempt from level-gating everywhere it can be
  // opened (kept in lockstep with submit_attempt on the server). Computed once
  // per session from the same algorithm /daily uses.
  const dailyId = useMemo(
    () => dailyChallengeId(challenges.map((c) => c.id), utcDayOf(new Date())),
    [challenges],
  );

  // Restore anonymous progress from localStorage (persist is SSR-safe via
  // skipHydration), then honor a route-provided initial mission.
  useEffect(() => {
    useWorkspaceStore.persist.rehydrate();
    if (initialChallengeId) {
      useWorkspaceStore.getState().openMission(initialChallengeId);
    }
  }, [initialChallengeId]);

  const goToNext = useCallback(() => {
    const visible = filterChallenges(challenges, {
      sector: sectorFilter,
      difficulty: difficultyFilter,
      query: searchQuery,
    });
    if (visible.length === 0) return;
    const currentIndex = visible.findIndex((c) => c.id === activeChallengeId);
    const next = visible[(currentIndex + 1) % visible.length];
    if (next) openMission(next.id);
  }, [challenges, sectorFilter, difficultyFilter, searchQuery, activeChallengeId, openMission]);

  // Keyboard support: 1/2/3 select an option, Enter runs, N advances,
  // Escape closes the mobile drawer. Inputs are never hijacked.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      const state = useWorkspaceStore.getState();
      if (event.key === "Escape" && state.sidebarOpen) {
        state.setSidebarOpen(false);
        return;
      }
      if (!active || state.view !== "mission") return;
      const attempt = getAttempt(state.attempts, active.id);

      if (event.key === "1" || event.key === "2" || event.key === "3") {
        const option = (["a", "b", "c"] as const)[Number(event.key) - 1];
        if (option) state.selectOption(active.id, option);
      } else if (event.key === "Enter" && attempt.selectedOption && !attempt.solved) {
        // Let buttons keep their native Enter behavior when focused.
        if (target.tagName === "BUTTON") return;
        event.preventDefault();
        document.querySelector<HTMLButtonElement>("[data-run-cell]")?.click();
      } else if (event.key.toLowerCase() === "n") {
        goToNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, goToNext]);

  // Drawer is mobile-only; make sure a resize to desktop never leaves it open.
  useEffect(() => {
    if (!sidebarOpen) return;
    const query = window.matchMedia("(min-width: 768px)");
    const close = () => query.matches && setSidebarOpen(false);
    close();
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar challenges={challenges} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          {active === null ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <FlaskConical className="size-10 text-accent/60" aria-hidden />
              <h1 className="text-lg font-semibold text-text">{en.workspace.emptyTitle}</h1>
              <p className="max-w-md text-sm text-muted">{en.workspace.emptyBody}</p>
            </div>
          ) : view === "tutorial" ? (
            <TutorialView meta={active} />
          ) : (
            <NotebookView
              meta={active}
              initialChallenge={initialChallenge?.id === active.id ? initialChallenge : null}
              isDaily={active.id === dailyId}
              onNext={goToNext}
            />
          )}
        </main>
      </div>
      <XpToast challenges={challenges} />
    </div>
  );
}
