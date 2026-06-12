"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { rankForLevel } from "@/lib/game/xp";
import { useWorkspaceStore } from "@/store/workspace";
import type { ChallengeMeta } from "@/lib/content/schema";
import { playCorrect, playLevelUp, playWrong } from "@/lib/sound/engine";
import { en } from "@/i18n/en";

const TOAST_MS = 4000;

/**
 * XP toast + level-up moment (MASTER_BRIEF.md Section 8): one celebratory
 * pulse on level-up, ~600ms, motion-safe only. aria-live so screen readers
 * hear rewards without focus theft.
 */
export function XpToast({ challenges }: { challenges: ChallengeMeta[] }) {
  const reward = useWorkspaceStore((s) => s.lastReward);
  const dismissReward = useWorkspaceStore((s) => s.dismissReward);
  const [visibleId, setVisibleId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
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
