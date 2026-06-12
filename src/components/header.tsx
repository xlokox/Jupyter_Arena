"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Flame,
  LogIn,
  LogOut,
  Menu,
  Snowflake,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import { useAuthStore } from "@/store/auth";
import {
  displayStreak,
  levelForXp,
  rankForLevel,
  utcDayOf,
  XP_PER_LEVEL,
  xpIntoLevel,
} from "@/lib/game/xp";
import { useWorkspaceStore, type SectorFilter } from "@/store/workspace";
import { ProgressRing } from "@/components/progress-ring";
import { en } from "@/i18n/en";

/**
 * Header — MASTER_BRIEF.md Section 8. Sector pills drive the store filter;
 * level, XP bar, streak, and solved count render live Section 9 math.
 */

const SECTOR_FILTERS: Array<{ id: SectorFilter; label: string }> = [
  { id: "all", label: en.sectors.all },
  { id: "da", label: en.sectors.da },
  { id: "ml", label: en.sectors.ml },
  { id: "dl", label: en.sectors.dl },
  { id: "fullstack", label: en.sectors.fullstack },
  { id: "db", label: en.sectors.db },
];

/** Next unlock threshold above the user's current level, or null if all unlocked. */
function nextUnlock(level: number) {
  const thresholds = [
    { level: 3, label: "medium" },
    { level: 6, label: "hard" },
    { level: 10, label: "very hard" },
  ];
  return thresholds.find((t) => t.level > level) ?? null;
}

export function Header() {
  const authStatus = useAuthStore((s) => s.status);
  const authEmail = useAuthStore((s) => s.email);
  const supabaseConfigured = publicSupabaseEnv() !== null;
  const sectorFilter = useWorkspaceStore((s) => s.sectorFilter);
  const setSectorFilter = useWorkspaceStore((s) => s.setSectorFilter);
  const setSidebarOpen = useWorkspaceStore((s) => s.setSidebarOpen);
  const attempts = useWorkspaceStore((s) => s.attempts);
  const stats = useWorkspaceStore((s) => s.stats);
  const soundEnabled = useWorkspaceStore((s) => s.soundEnabled);
  const toggleSound = useWorkspaceStore((s) => s.toggleSound);
  const lastReward = useWorkspaceStore((s) => s.lastReward);
  const freezeTokens = useWorkspaceStore((s) => s.freezeTokens);
  const dailyGoal = useWorkspaceStore((s) => s.dailyGoal);
  const completed = Object.values(attempts).filter((a) => a.solved).length;

  const today = utcDayOf(new Date());
  const goalProgress = dailyGoal.date === today ? dailyGoal.progress : 0;
  const goalComplete = goalProgress >= dailyGoal.target;

  const level = levelForXp(stats.xp);
  const rank = en.ranks[rankForLevel(level)];
  const intoLevel = xpIntoLevel(stats.xp);
  const streak = displayStreak(stats, new Date());
  const xpPercent = (intoLevel / XP_PER_LEVEL) * 100;
  const next = nextUnlock(level);
  const xpToUnlock = next ? Math.max(0, (next.level - 1) * XP_PER_LEVEL - stats.xp) : null;
  const justLeveled = lastReward?.leveledUp ?? false;

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
            <span
              className={`rounded-md border border-border bg-panel-2 px-2 py-0.5 font-mono text-xs text-accent ${
                justLeveled ? "motion-safe:animate-[level-pulse_0.6s_ease-in-out]" : ""
              }`}
            >
              {en.header.level} {level}
            </span>
            <span className="hidden text-muted sm:inline">{rank}</span>
          </div>

          <div className="flex flex-col gap-0.5">
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
                <span
                  key={intoLevel}
                  className="inline-block motion-safe:animate-[xp-pop_0.3s_ease-out]"
                >
                  {intoLevel}
                </span>
                /{XP_PER_LEVEL} {en.header.xp}
              </span>
            </div>
            {next && xpToUnlock !== null && xpToUnlock > 0 && (
              <p className="font-mono text-[10px] text-muted">
                {xpToUnlock} {en.header.xp} → {en.lock.nextUnlockAt} {next.level} ({next.label})
              </p>
            )}
            {next && xpToUnlock === 0 && (
              <p className="font-mono text-[10px] text-success">
                {en.lock.nextUnlockAt} {next.level} {en.lock.nextUnlockContent} unlocked!
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Flame
              aria-hidden
              className={`size-4 ${
                streak >= 1
                  ? "text-accent motion-safe:animate-[flame-flicker_1.6s_ease-in-out_infinite]"
                  : "text-muted"
              }`}
            />
            <span className="font-mono text-xs text-muted">
              {streak} {en.header.streakLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 aria-hidden className="size-4 text-muted" />
            <span className="font-mono text-xs text-muted">
              <span
                key={completed}
                className="inline-block motion-safe:animate-[xp-pop_0.3s_ease-out]"
              >
                {completed}
              </span>{" "}
              {en.header.completedLabel}
            </span>
          </div>

          <div
            className="flex items-center gap-1.5"
            title={goalComplete ? en.dailyGoal.complete : en.dailyGoal.label}
          >
            <ProgressRing
              value={goalProgress}
              max={dailyGoal.target}
              ariaLabel={`${en.dailyGoal.ariaLabel}: ${goalProgress}/${dailyGoal.target}`}
              fillClassName={goalComplete ? "stroke-success" : "stroke-accent"}
            />
            <span className="hidden font-mono text-xs text-muted sm:inline">
              {goalProgress}/{dailyGoal.target}
            </span>
          </div>

          {freezeTokens > 0 && (
            <div className="flex items-center gap-1.5" title={en.streakFreeze.tooltip}>
              <Snowflake aria-hidden className="size-4 text-accent" />
              <span
                aria-label={`${en.streakFreeze.ariaLabel}: ${freezeTokens}`}
                className="font-mono text-xs text-muted"
              >
                {freezeTokens}
              </span>
            </div>
          )}
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? en.sounds.disable : en.sounds.enable}
            title={soundEnabled ? en.sounds.disable : en.sounds.enable}
            onClick={toggleSound}
            className="flex size-11 items-center justify-center rounded-md border border-border bg-panel-2 text-muted transition-colors hover:border-accent-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {soundEnabled ? (
              <Volume2 className="size-4 text-accent" aria-hidden />
            ) : (
              <VolumeX className="size-4" aria-hidden />
            )}
          </button>

          <Link
            href="/ranks"
            className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-panel-2 px-3 text-sm text-muted transition-colors hover:border-accent-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Trophy className="size-4 text-accent" aria-hidden />
            <span className="hidden sm:inline">{en.rankLadder.link}</span>
          </Link>

          <Link
            href="/daily"
            className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-panel-2 px-3 text-sm text-muted transition-colors hover:border-accent-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Calendar className="size-4 text-accent" aria-hidden />
            <span className="hidden sm:inline">Daily</span>
          </Link>

          <Link
            href="/portfolio"
            className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-panel-2 px-3 text-sm text-muted transition-colors hover:border-accent-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <BriefcaseBusiness className="size-4 text-accent" aria-hidden />
            {en.header.portfolio}
          </Link>

          {supabaseConfigured && authStatus === "signedIn" && (
            <button
              type="button"
              onClick={() => {
                void import("@/lib/game/server-progress").then(({ signOut }) => signOut());
              }}
              title={authEmail ?? undefined}
              className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-panel-2 px-3 text-sm text-muted transition-colors hover:border-accent-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <LogOut className="size-4" aria-hidden />
              {en.auth.signOut}
            </button>
          )}
          {supabaseConfigured && authStatus === "signedOut" && (
            <Link
              href="/login"
              className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-accent/50 bg-accent/10 px-3 text-sm text-accent transition-colors hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <LogIn className="size-4" aria-hidden />
              {en.auth.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
