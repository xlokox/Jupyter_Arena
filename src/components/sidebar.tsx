"use client";

import { BookOpen, CheckCircle2, FileCode2, Search, X } from "lucide-react";
import type { Challenge } from "@/lib/content/schema";
import { DIFFICULTIES } from "@/lib/content/schema";
import { ChallengeIcon } from "@/components/challenge-icon";
import { DifficultyBadge } from "@/components/difficulty-badge";
import {
  filterChallenges,
  getAttempt,
  useWorkspaceStore,
  type DifficultyFilter,
  type SidebarTab,
} from "@/store/workspace";
import { en } from "@/i18n/en";

const TABS: Array<{ id: SidebarTab; label: string; icon: typeof FileCode2 }> = [
  { id: "missions", label: en.sidebar.missions, icon: FileCode2 },
  { id: "tutorials", label: en.sidebar.tutorials, icon: BookOpen },
];

function SidebarContent({ challenges }: { challenges: Challenge[] }) {
  const sidebarTab = useWorkspaceStore((s) => s.sidebarTab);
  const setSidebarTab = useWorkspaceStore((s) => s.setSidebarTab);
  const sectorFilter = useWorkspaceStore((s) => s.sectorFilter);
  const difficultyFilter = useWorkspaceStore((s) => s.difficultyFilter);
  const setDifficultyFilter = useWorkspaceStore((s) => s.setDifficultyFilter);
  const searchQuery = useWorkspaceStore((s) => s.searchQuery);
  const setSearchQuery = useWorkspaceStore((s) => s.setSearchQuery);
  const activeChallengeId = useWorkspaceStore((s) => s.activeChallengeId);
  const view = useWorkspaceStore((s) => s.view);
  const attempts = useWorkspaceStore((s) => s.attempts);
  const openMission = useWorkspaceStore((s) => s.openMission);
  const openTutorial = useWorkspaceStore((s) => s.openTutorial);

  const visible = filterChallenges(challenges, {
    sector: sectorFilter,
    difficulty: difficultyFilter,
    query: searchQuery,
  });

  return (
    <div className="flex h-full flex-col">
      <div role="tablist" aria-label={en.sidebar.tabsAria} className="flex border-b border-border">
        {TABS.map((tab) => {
          const isActive = sidebarTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`sidebar-panel-${tab.id}`}
              id={`sidebar-tab-${tab.id}`}
              onClick={() => setSidebarTab(tab.id)}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                isActive
                  ? "border-b-2 border-accent font-semibold text-accent"
                  : "text-muted hover:text-text"
              }`}
            >
              <tab.icon className="size-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="border-b border-border p-3">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={en.sidebar.searchPlaceholder}
            aria-label={en.sidebar.searchAria}
            className="w-full rounded-md border border-border bg-panel-2 py-2 ps-9 pe-3 text-sm text-text placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-accent"
          />
        </label>
        <div
          role="group"
          aria-label={en.sidebar.difficultyAria}
          className="mt-2 flex flex-wrap gap-1.5"
        >
          {(["all", ...DIFFICULTIES] as const).map((difficulty) => {
            const isActive = difficultyFilter === difficulty;
            return (
              <button
                key={difficulty}
                type="button"
                aria-pressed={isActive}
                onClick={() => setDifficultyFilter(difficulty as DifficultyFilter)}
                className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                  isActive
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted hover:text-text"
                }`}
              >
                {en.difficulty[difficulty]}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`sidebar-panel-${sidebarTab}`}
        aria-labelledby={`sidebar-tab-${sidebarTab}`}
        className="flex-1 overflow-y-auto p-2"
      >
        {visible.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted">{en.sidebar.noResults}</p>
        ) : (
          <ul
            aria-label={
              sidebarTab === "missions" ? en.sidebar.fileExplorerAria : en.sidebar.tutorialListAria
            }
            className="space-y-1"
          >
            {visible.map((challenge) => {
              const solved = getAttempt(attempts, challenge.id).solved;
              const isActive =
                activeChallengeId === challenge.id &&
                view === (sidebarTab === "missions" ? "mission" : "tutorial");
              return (
                <li key={challenge.id}>
                  <button
                    type="button"
                    aria-current={isActive ? "true" : undefined}
                    onClick={() =>
                      sidebarTab === "missions"
                        ? openMission(challenge.id)
                        : openTutorial(challenge.id)
                    }
                    className={`flex w-full min-h-[44px] items-center gap-2.5 rounded-md border px-2.5 py-2 text-start transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                      isActive
                        ? "border-accent/60 bg-accent/10"
                        : "border-transparent hover:bg-panel-2"
                    }`}
                  >
                    {sidebarTab === "missions" ? (
                      <ChallengeIcon
                        name={challenge.icon}
                        className="size-4 shrink-0 text-accent"
                      />
                    ) : (
                      <BookOpen className="size-4 shrink-0 text-accent" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-text">
                      {challenge.title}
                    </span>
                    {solved && sidebarTab === "missions" && (
                      <CheckCircle2
                        className="size-4 shrink-0 text-success"
                        aria-label={en.sidebar.solvedAria}
                      />
                    )}
                    <DifficultyBadge difficulty={challenge.difficulty} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ challenges }: { challenges: Challenge[] }) {
  const sidebarOpen = useWorkspaceStore((s) => s.sidebarOpen);
  const setSidebarOpen = useWorkspaceStore((s) => s.setSidebarOpen);

  return (
    <>
      {/* Static sidebar ≥ md */}
      <aside className="hidden w-80 shrink-0 border-e border-border bg-panel md:block">
        <SidebarContent challenges={challenges} />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label={en.sidebar.closeSidebar}
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={en.sidebar.fileExplorerAria}
            className="absolute inset-y-0 start-0 flex w-[85vw] max-w-80 flex-col bg-panel shadow-xl"
          >
            <div className="flex items-center justify-end border-b border-border p-1">
              <button
                type="button"
                aria-label={en.sidebar.closeSidebar}
                onClick={() => setSidebarOpen(false)}
                className="flex size-11 items-center justify-center rounded-md text-muted hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarContent challenges={challenges} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
