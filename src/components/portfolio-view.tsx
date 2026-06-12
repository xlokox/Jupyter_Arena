"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Flame } from "lucide-react";
import type { ChallengeMeta, SectorId } from "@/lib/content/schema";
import {
  accuracy,
  displayStreak,
  levelForXp,
  rankForLevel,
  XP_PER_LEVEL,
  xpIntoLevel,
} from "@/lib/game/xp";
import { getAttempt, useWorkspaceStore } from "@/store/workspace";
import { TrophyCase } from "@/components/trophy-case";
import { en } from "@/i18n/en";

const SECTORS: SectorId[] = ["ml", "dl", "fullstack", "db"];

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-text">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function PortfolioView({ challenges }: { challenges: ChallengeMeta[] }) {
  const stats = useWorkspaceStore((s) => s.stats);
  const attempts = useWorkspaceStore((s) => s.attempts);

  useEffect(() => {
    useWorkspaceStore.persist.rehydrate();
  }, []);

  const level = levelForXp(stats.xp);
  const solvedIds = new Set(
    challenges.filter((c) => getAttempt(attempts, c.id).solved).map((c) => c.id),
  );
  const acc = accuracy(stats);
  const streak = displayStreak(stats, new Date());

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Link
        href="/app"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {en.portfolio.backToArena}
      </Link>

      <header className="rounded-md border border-accent/40 bg-panel p-5">
        <h1 className="flex items-center gap-2 text-xl font-bold text-text">
          <BriefcaseBusiness className="size-6 text-accent" aria-hidden />
          {en.portfolio.title}
        </h1>
        <p className="mt-2 text-sm text-muted">{en.portfolio.subtitle}</p>
        <p className="mt-3 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm font-medium text-accent">
          <BadgeCheck className="size-4 shrink-0" aria-hidden />
          {en.portfolio.linkedinLine}
        </p>
      </header>

      <section
        aria-label={en.portfolio.statsAria}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <StatCard
          label={en.portfolio.totalXp}
          value={String(stats.xp)}
          hint={`${xpIntoLevel(stats.xp)}/${XP_PER_LEVEL} ${en.header.xp} → ${en.header.level} ${level + 1}`}
        />
        <StatCard
          label={en.portfolio.rank}
          value={en.ranks[rankForLevel(level)]}
          hint={`${en.portfolio.level} ${level}`}
        />
        <StatCard label={en.portfolio.completed} value={`${solvedIds.size}/${challenges.length}`} />
        <StatCard
          label={en.portfolio.accuracy}
          value={acc === null ? en.portfolio.noAttemptsYet : `${Math.round(acc * 100)}%`}
        />
        <StatCard label={en.portfolio.currentStreak} value={`${streak} ${en.portfolio.days}`} />
        <StatCard
          label={en.portfolio.longestStreak}
          value={`${stats.longestStreak} ${en.portfolio.days}`}
        />
      </section>

      <section aria-label={en.portfolio.sectorProgress} className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wide text-muted">
          {en.portfolio.sectorProgress}
        </h2>
        {SECTORS.map((sector) => {
          const inSector = challenges.filter((c) => c.sector === sector);
          const solved = inSector.filter((c) => solvedIds.has(c.id)).length;
          const percent = inSector.length === 0 ? 0 : (solved / inSector.length) * 100;
          return (
            <div key={sector} className="rounded-md border border-border bg-panel p-3">
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="text-text">{en.sectors[sector]}</span>
                <span className="font-mono text-xs text-muted">
                  {solved}/{inSector.length}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={inSector.length}
                aria-valuenow={solved}
                aria-label={en.sectors[sector]}
                className="h-2 overflow-hidden rounded-full border border-border bg-panel-2"
              >
                <div
                  className="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      <TrophyCase />

      <footer className="flex items-center gap-2 text-xs text-muted">
        <Flame className="size-4 text-accent" aria-hidden />
        {en.app.name} — {en.app.tagline}
      </footer>
    </main>
  );
}
