"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { rankForLevel } from "@/lib/game/xp";
import { useWorkspaceStore } from "@/store/workspace";
import { en } from "@/i18n/en";

const TOAST_MS = 4000;

/**
 * XP toast + level-up moment (MASTER_BRIEF.md Section 8): one celebratory
 * pulse on level-up, ~600ms, motion-safe only. aria-live so screen readers
 * hear rewards without focus theft.
 */
export function XpToast() {
  const reward = useWorkspaceStore((s) => s.lastReward);
  const dismissReward = useWorkspaceStore((s) => s.dismissReward);
  const [visibleId, setVisibleId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!reward) return;
    setVisibleId(reward.id);
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
            <span className={positive ? "text-success" : "text-danger"}>
              {reward.total >= 0 ? "+" : ""}
              {reward.total} {en.toast.xp}
            </span>
            {reward.leveledUp && (
              <span className="ms-auto flex items-center gap-1 text-accent">
                <Sparkles className="size-4" aria-hidden />
                {en.toast.levelUp} {en.header.level} {reward.newLevel} —{" "}
                {en.ranks[rankForLevel(reward.newLevel)]}
              </span>
            )}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {reward.events.map((event, index) => (
              <li key={index} className="flex justify-between font-mono text-xs text-muted">
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
