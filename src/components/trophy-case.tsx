"use client";

import { BADGE_DEFS } from "@/lib/game/badges";
import { ChallengeIcon } from "@/components/challenge-icon";
import { useWorkspaceStore } from "@/store/workspace";
import { en } from "@/i18n/en";

/**
 * Trophy case (5.6b) — every badge shown earned (full color) or locked
 * (silhouette + criteria). Lives on /portfolio, off the /app critical path.
 * Reads the store's earned set (anon localStorage, or hydrated from the account
 * for authed users). Tokens only; no opacity behind text (keeps axe contrast
 * clean per the 5.6a accessibility note).
 */
export function TrophyCase() {
  const earnedBadges = useWorkspaceStore((s) => s.earnedBadges);
  const earned = new Set(earnedBadges);
  const earnedCount = BADGE_DEFS.filter((d) => earned.has(d.id)).length;

  return (
    <section aria-label={en.badges.earnedAria} className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-mono text-xs uppercase tracking-wide text-muted">
          {en.badges.sectionTitle}
        </h2>
        <span className="font-mono text-xs text-muted">
          {earnedCount}/{BADGE_DEFS.length} {en.badges.countLabel}
        </span>
      </div>
      <p className="text-xs text-muted">{en.badges.sectionSubtitle}</p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BADGE_DEFS.map((def) => {
          const isEarned = earned.has(def.id);
          const copy = en.badges[def.id];
          return (
            <li
              key={def.id}
              className={`flex items-start gap-3 rounded-md border bg-panel p-3 ${
                isEarned ? "border-accent/40" : "border-border"
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${
                  isEarned ? "border-accent bg-accent/10" : "border-border bg-panel-2"
                }`}
              >
                <ChallengeIcon
                  name={isEarned ? def.icon : "lock"}
                  className={`size-5 ${isEarned ? "text-accent" : "text-muted"}`}
                />
              </span>
              <div className="min-w-0">
                <p className={`font-mono text-sm ${isEarned ? "text-text" : "text-muted"}`}>
                  {copy.name}
                </p>
                <p className="mt-0.5 text-xs text-muted">{copy.description}</p>
                <p
                  className={`mt-1 font-mono text-[10px] uppercase tracking-wide ${
                    isEarned ? "text-success" : "text-muted"
                  }`}
                >
                  {isEarned ? en.badges.earnedLabel : en.badges.lockedLabel}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
