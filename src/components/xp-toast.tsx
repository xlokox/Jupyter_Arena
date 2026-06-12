"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { rankForLevel } from "@/lib/game/xp";
import { BADGE_DEFS } from "@/lib/game/badges";
import { ChallengeIcon } from "@/components/challenge-icon";
import { useWorkspaceStore } from "@/store/workspace";
import type { ChallengeMeta } from "@/lib/content/schema";
import { playBadge, playCorrect, playLevelUp, playWrong } from "@/lib/sound/engine";
import { en } from "@/i18n/en";

const TOAST_MS = 4000;
const BADGE_ICON = Object.fromEntries(BADGE_DEFS.map((d) => [d.id, d.icon]));

/**
 * XP toast + level-up moment (MASTER_BRIEF.md Section 8): one celebratory
 * pulse on level-up, ~600ms, motion-safe only. aria-live so screen readers
 * hear rewards without focus theft.
 */
export function XpToast({ challenges }: { challenges: ChallengeMeta[] }) {
  const reward = useWorkspaceStore((s) => s.lastReward);
  const dismissReward = useWorkspaceStore((s) => s.dismissReward);
  const lastBadge = useWorkspaceStore((s) => s.lastBadge);
  const dismissBadge = useWorkspaceStore((s) => s.dismissBadge);
  const [visibleId, setVisibleId] = useState<number | null>(null);
  const [visibleBadge, setVisibleBadge] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!reward) return;
    setVisibleId(reward.id);
    // Opt-in audio cue. Read the flag fresh (not via deps) so toggling sound
    // never retriggers the toast or its timer. Re-solves (no events) stay silent.
    if (useWorkspaceStore.getState().soundEnabled && reward.events.length > 0) {
      if (reward.leveledUp) playLevelUp();
      else if (reward.events.some((e) => e.reason === "wrong_fix")) playWrong();
      else playCorrect();
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisibleId(null);
      dismissReward();
    }, TOAST_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reward, dismissReward]);

  // Badge-earned moment — its own timer so it doesn't fight the XP toast.
  useEffect(() => {
    if (!lastBadge) return;
    setVisibleBadge(lastBadge.n);
    if (useWorkspaceStore.getState().soundEnabled) playBadge();
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    badgeTimerRef.current = setTimeout(() => {
      setVisibleBadge(null);
      dismissBadge();
    }, TOAST_MS);
    return () => {
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    };
  }, [lastBadge, dismissBadge]);

  const showBadge = lastBadge !== null && visibleBadge === lastBadge.n;
  const show = reward !== null && visibleId === reward.id;
  const positive = (reward?.total ?? 0) > 0;
  const unlockedCount =
    reward?.leveledUp
      ? challenges.filter(
          (c) => c.unlockLevel <= reward.newLevel && c.unlockLevel > reward.prevLevel,
        ).length
      : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={en.toast.rewardAria}
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {showBadge && lastBadge && (
        <div
          key={`badge-${lastBadge.n}`}
          className="flex w-full max-w-sm items-center gap-3 rounded-lg border border-accent bg-panel-2 p-3 shadow-lg motion-safe:animate-[toast-in_0.25s_ease-out]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent bg-accent/10 motion-safe:animate-[level-pulse_0.6s_ease-in-out]">
            <ChallengeIcon name={BADGE_ICON[lastBadge.id] ?? "trophy"} className="size-5 text-accent" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-mono text-xs font-bold text-accent">
              <Sparkles
                className="size-3.5 motion-safe:animate-[sparkle-spin_0.6s_ease-in-out]"
                aria-hidden
              />
              {en.badges.unlockedToast}
            </p>
            <p className="truncate font-mono text-sm text-text">{en.badges[lastBadge.id].name}</p>
          </div>
        </div>
      )}
      {show && reward && (
        <div
          key={reward.id}
          className={`w-full max-w-sm rounded-lg border bg-panel-2 p-3 shadow-lg motion-safe:animate-[toast-in_0.25s_ease-out] ${
            reward.leveledUp
              ? "border-accent motion-safe:animate-[level-pulse_0.6s_ease-in-out]"
              : positive
                ? "border-success/50"
                : "border-danger/50"
          }`}
        >
          <p className="flex items-center gap-2 font-mono text-sm font-bold">
            {positive ? (
              <TrendingUp className="size-4 text-success" aria-hidden />
            ) : (
              <TrendingDown className="size-4 text-danger" aria-hidden />
            )}
            <span
              className={`inline-block motion-safe:animate-[xp-pop_0.3s_ease-out] ${
                positive ? "text-success" : "text-danger"
              }`}
            >
              {reward.total >= 0 ? "+" : ""}
              {reward.total} {en.toast.xp}
            </span>
            {reward.leveledUp && (
              <span className="ms-auto flex items-center gap-1 text-accent">
                <Sparkles
                  className="size-4 motion-safe:animate-[sparkle-spin_0.6s_ease-in-out]"
                  aria-hidden
                />
                {en.toast.levelUp} {en.header.level} {reward.newLevel} —{" "}
                {en.ranks[rankForLevel(reward.newLevel)]}
                {unlockedCount > 0 && (
                  <span className="ms-1 text-success">
                    · {unlockedCount} mission{unlockedCount === 1 ? "" : "s"} unlocked
                  </span>
                )}
              </span>
            )}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {reward.events.map((event, index) => (
              <li
                key={index}
                style={{ animationDelay: `${index * 80}ms` }}
                className="flex justify-between font-mono text-xs text-muted motion-safe:animate-[event-cascade_0.3s_ease-out_both]"
              >
                <span>{en.toast[event.reason]}</span>
                <span>
                  {event.delta >= 0 ? "+" : ""}
                  {event.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
