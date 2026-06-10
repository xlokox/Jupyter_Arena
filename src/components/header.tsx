import { CheckCircle2, Flame } from "lucide-react";
import { en } from "@/i18n/en";

/**
 * Header shell — MASTER_BRIEF.md Section 8. Phase 0 renders the structure with
 * initial (anonymous, zero-progress) values; live stats wire in via the Zustand
 * store in Phase 2/3.
 */

const INITIAL_STATS = {
  level: 1,
  rank: en.ranks.compileRookie,
  xpIntoLevel: 0,
  xpPerLevel: 50,
  streak: 0,
  completed: 0,
};

const SECTOR_FILTERS = [
  { id: "all", label: en.sectors.all },
  { id: "ml", label: en.sectors.ml },
  { id: "dl", label: en.sectors.dl },
  { id: "fullstack", label: en.sectors.fullstack },
  { id: "db", label: en.sectors.db },
] as const;

export function Header() {
  const xpPercent = (INITIAL_STATS.xpIntoLevel / INITIAL_STATS.xpPerLevel) * 100;

  return (
    <header className="border-b border-border bg-panel">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Flame aria-hidden className="size-6 text-accent" />
          <span className="font-mono text-lg font-bold tracking-tight">{en.app.name}</span>
        </div>

        {/* Stats cluster */}
        <div
          aria-label={en.header.statsAria}
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-border bg-panel-2 px-2 py-0.5 font-mono text-xs text-accent">
              {en.header.level} {INITIAL_STATS.level}
            </span>
            <span className="text-muted">{INITIAL_STATS.rank}</span>
          </div>

          <div className="flex items-center gap-2" aria-label={en.header.xp}>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={INITIAL_STATS.xpPerLevel}
              aria-valuenow={INITIAL_STATS.xpIntoLevel}
              aria-label={en.header.xp}
              className="h-2 w-28 overflow-hidden rounded-full border border-border bg-panel-2"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="font-mono text-xs text-muted">
              {INITIAL_STATS.xpIntoLevel}/{INITIAL_STATS.xpPerLevel} {en.header.xp}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Flame aria-hidden className="size-4 text-muted" />
            <span className="font-mono text-xs text-muted">
              {INITIAL_STATS.streak} {en.header.streakLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 aria-hidden className="size-4 text-muted" />
            <span className="font-mono text-xs text-muted">
              {INITIAL_STATS.completed} {en.header.completedLabel}
            </span>
          </div>
        </div>

        {/* Sector filter pills */}
        <nav
          aria-label={en.header.sectorFilterAria}
          className="flex flex-wrap items-center gap-2 md:ms-auto"
        >
          {SECTOR_FILTERS.map((sector) => {
            const isActive = sector.id === "all";
            return (
              <button
                key={sector.id}
                type="button"
                aria-pressed={isActive}
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
      </div>
    </header>
  );
}
