"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { levelForXp, rankForLevel, type RankKey } from "@/lib/game/xp";
import { useWorkspaceStore } from "@/store/workspace";
import { en } from "@/i18n/en";

/**
 * Rank ladder (5.6b) — its own route so it stays off the /app First Load JS.
 * Tiers mirror rankForLevel (xp.ts); XP thresholds derive from level=floor(xp/50)+1.
 */
const TIERS: Array<{ key: RankKey; range: string; minXp: number }> = [
  { key: "compileRookie", range: "1–5", minXp: 0 },
  { key: "tracebackHunter", range: "6–15", minXp: 250 },
  { key: "kernelEngineer", range: "16–30", minXp: 750 },
  { key: "overlordCompiler", range: "31+", minXp: 1500 },
];

export function RankLadder() {
  const xp = useWorkspaceStore((s) => s.stats.xp);

  useEffect(() => {
    useWorkspaceStore.persist.rehydrate();
  }, []);

  const current = rankForLevel(levelForXp(xp));

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <Link
        href="/app"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {en.rankLadder.backToArena}
      </Link>

      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-text">
          <Trophy className="size-6 text-accent" aria-hidden />
          {en.rankLadder.title}
        </h1>
        <p className="mt-2 text-sm text-muted">{en.rankLadder.subtitle}</p>
      </header>

      <ol className="space-y-3">
        {TIERS.map((tier) => {
          const isCurrent = tier.key === current;
          return (
            <li
              key={tier.key}
              aria-current={isCurrent ? "true" : undefined}
              className={`rounded-md border p-4 ${
                isCurrent ? "border-accent bg-accent/5" : "border-border bg-panel"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy
                    className={`size-5 ${isCurrent ? "text-accent" : "text-muted"}`}
                    aria-hidden
                  />
                  <span
                    className={`font-mono font-semibold ${isCurrent ? "text-accent" : "text-text"}`}
                  >
                    {en.ranks[tier.key]}
                  </span>
                </div>
                {isCurrent && (
                  <span className="rounded-full border border-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent">
                    {en.rankLadder.current}
                  </span>
                )}
              </div>
              <p className="mt-1.5 font-mono text-xs text-muted">
                {en.rankLadder.levelRange} {tier.range} · {tier.minXp}+ {en.rankLadder.xpAt}
              </p>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
