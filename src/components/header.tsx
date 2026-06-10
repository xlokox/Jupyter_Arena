"use client";

import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, Flame, Menu } from "lucide-react";
import { displayStreak, levelForXp, rankForLevel, XP_PER_LEVEL, xpIntoLevel } from "@/lib/game/xp";
import { useWorkspaceStore, type SectorFilter } from "@/store/workspace";
import { en } from "@/i18n/en";

/**
 * Header — MASTER_BRIEF.md Section 8. Sector pills drive the store filter;
 * level, XP bar, streak, and solved count render live Section 9 math.
 */

const SECTOR_FILTERS: Array<{ id: SectorFilter; label: string }> = [
  { id: "all", label: en.sectors.all },
  { id: "ml", label: en.sectors.ml },
  { id: "dl", label: en.sectors.dl },
  { id: "fullstack", label: en.sectors.fullstack },
  { id: "db", label: en.sectors.db },
];

export function Header() {
  const sectorFilter = useWorkspaceStore((s) => s.sectorFilter);
  const setSectorFilter = useWorkspaceStore((s) => s.setSectorFilter);
  const setSidebarOpen = useWorkspaceStore((s) => s.setSidebarOpen);
  const attempts = useWorkspaceStore((s) => s.attempts);
  const stats = useWorkspaceStore((s) => s.stats);
  const completed = Object.values(attempts).filter((a) => a.solved).length;

  const level = levelForXp(stats.xp);
  const rank = en.ranks[rankForLevel(level)];
  const intoLevel = xpIntoLevel(stats.xp);
  const streak = displayStreak(stats, new Date());
  const xpPercent = (intoLevel / XP_PER_LEVEL) * 100;

  return (
    <header className="border-b border-border bg-panel">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={en.header.openSidebar}
            onClick={() => setSidebarOpen(true)}
            className="-ms-2 flex size-11 items-center justify-center rounded-md text-muted hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent md:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Flame aria-hidden className="size-6 text-accent" />
          <span className="font-mono text-lg font-bold tracking-tight">{en.app.name}</span>
        </div>

        <div
          aria-label={en.header.statsAria}
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-border bg-panel-2 px-2 py-0.5 font-mono text-xs text-accent">
              {en.header.level} {level}
            </span>
            <span className="hidden text-muted sm:inline">{rank}</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={XP_PER_LEVEL}
              aria-valuenow={intoLevel}
              aria-label={en.header.xp}
              className="h-2 w-24 overflow-hidden rounded-full border border-border bg-panel-2"
            >
              <div
                className="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="font-mono text-xs text-muted">
              {intoLevel}/{XP_PER_LEVEL} {en.header.xp}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Flame aria-hidden className="size-4 text-muted" />
            <span className="font-mono text-xs text-muted">
              {streak} {en.header.streakLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 aria-hidden className="size-4 text-muted" />
            <span className="font-mono text-xs text-muted">
              {completed} {en.header.completedLabel}
            </span>
          </div>
        </div>

        <nav
          aria-label={en.header.sectorFilterAria}
          className="flex flex-wrap items-center gap-2 md:ms-auto"
        >
          {SECTOR_FILTERS.map((sector) => {
            const isActive = sectorFilter === sector.id;
            return (
              <button
                key={sector.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSectorFilter(sector.id)}
                className={`min-h-[44px] rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActive
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-panel-2 text-muted hover:border-accent-hover hover:text-text"
                }`}
              >
                {sector.label}
              </button>
            );
          })}
        </nav>

        <Link
          href="/portfolio"
          className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-panel-2 px-3 text-sm text-muted transition-colors hover:border-accent-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <BriefcaseBusiness className="size-4 text-accent" aria-hidden />
          {en.header.portfolio}
        </Link>
      </div>
    </header>
  );
}
