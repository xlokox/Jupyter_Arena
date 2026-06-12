# Phase Report 5.6b — Achievements: badges, rings, rank ladder, daily goal, streak freeze

Stage 5.6b of Phase 5.6 (plan: `effervescent-purring-aurora.md`). Adds the "stuff to
collect" layer Daniel prioritized: badges, sidebar sector-completion rings, a rank-ladder
screen, a daily-goal ring, and a streak-freeze token — all anonymous-first and
server-enforced for authed users, with a pure-TS ⇄ SQL dual implementation and parity tests
for everything that grants a reward. Migrations 011–014. No new runtime dependencies.

## Acceptance checklist

| Item | Status |
|------|--------|
| `pnpm check` (lint + typecheck + 126 unit tests + content:validate) | PASS |
| `pnpm test:db` (70 tests, local Supabase stack) | PASS |
| `pnpm e2e` (24 passed, 1 pre-existing auth-merge skip) | PASS |
| `/app` First Load JS < 200 KB | PASS — **195 kB** (was 191 kB; +4 kB) |
| Badges: 13-badge set, all earnable-verified against the 60-challenge catalog | Done |
| Dual TS ⇄ SQL + parity test (`evaluateBadges` ≡ `award_badges`) | Done |
| Locked Section-9 XP math untouched (badges live in `user_badges`, never `xp_events`) | Done |
| Streak-freeze: earn every 7th day (cap 2), bridge a single missed day | Done |
| Daily goal: per-UTC-day solve counter (3), Daily Devoted badge at 10 | Done |
| Trophy case (/portfolio), badge-earn toast, HUD rings + freeze token, sidebar rings | Done |
| Rank-ladder route `/ranks` with current rank highlighted | Done |
| Anonymous-first: full feature in localStorage; authed rewards only via `submit_attempt` | Done |
| All new strings via i18n; `prefers-reduced-motion` honored (rings/toasts `motion-safe:`) | Done |

## What changed

**Migrations (011–014).** `011_badges` (`badge_definitions` 13-row seed + `user_badges`,
unique per user/badge), `012_daily_goals` (`user_daily_goals`), `013_streak_freeze`
(`user_stats.streak_freeze_tokens`, 0–2 CHECK). `014_submit_attempt_v3` carries 010 verbatim
and adds: the freeze bridge/earn inside the daily-tick block, a daily-goal increment, and a
badge pass (`award_badges()`, a shared SQL function also called by `merge_local_progress` v2).
New tables are deny-by-default RLS (definitions world-readable; awards/goals owner-only; writes
revoked from clients). Returned JSON gains `streak_freeze_tokens/spent`, `daily_goal`,
`newly_awarded` (all additive — existing keys/consumers untouched).

**Pure TS twins.** `src/lib/game/badges.ts` (`evaluateBadges` returns the full earned set;
`BADGE_DEFS` mirrors the seed order + icons) and `src/lib/game/streak.ts`
(`applyDailyStreakTick`, `tickDailyGoal`). `xp.ts` is unchanged except exporting
`previousUtcDay`; `applyCorrectSolve` stays byte-identical (its tests + the existing SQL parity
hold). A TS-level test pins that `applyDailyStreakTick` at 0 tokens equals the frozen streak rule.

**Client wiring.** Store gains persisted `freezeTokens` / `dailyGoal` / `earnedBadges` (+
session-only `lastBadge`); `completeRun` ticks the freeze-aware streak and goal on a first
solve; `applyServerOutcome` consumes the new server fields; `hydrateFromServer`/`resetProgress`
extended. Anonymous badge evaluation lives in `app-shell.tsx` (which holds the challenge
metadata the store must not import), guarded off for authed users. `fetchAccountState` +
`AuthProvider` hydrate badges, tokens, and today's goal.

**Surfaces.** HUD daily-goal ring + streak-freeze token + Ranks link (`header.tsx`); sidebar
sector-completion rings; trophy case on `/portfolio`; badge-earn toast (extends `xp-toast.tsx`);
`/ranks` route. All rings are a hand-rolled inline-SVG `ProgressRing` (no chart dep), filling via
a `stroke-dashoffset` CSS transition. Five new lucide icons registered.

**Tests.** Unit: `badges.test.ts`, `streak.test.ts`, store achievements block. DB:
`badges.test.ts`, `daily-goals.test.ts`, `streak-freeze.test.ts`, `badge-parity.test.ts`, merge
re-derivation, RLS isolation for the new tables. E2e: `achievements.spec.ts`.

## Deviations from the brief/plan (flagged, not silent)

1. **Polyglot redefined 4 → 3 language families.** The catalog has only three families
   (python 31, sql 14, javascript[jsx|js] 15), so "solve in all 4 languages" isn't cleanly
   earnable. Polyglot is now python + sql + javascript, reflected in TS, SQL, copy, and the
   parity test. This is a content-driven correction to the starter set in the 5.6 plan.
2. **Streak-freeze extends the Section-9 streak rule.** A token bridges a single missed UTC day
   instead of resetting the streak. This is a sanctioned 5.6b feature; with 0 tokens the
   behavior is byte-identical to migration 010 (regression-tested), and the +5 daily XP is never
   changed. Tokens are earned every 7th day, capped at 2.
3. **`merge_local_progress` stays conservative.** Offline-earned daily-goal history and freeze
   tokens are NOT imported on first sign-in (client clocks untrusted — same rationale as streak
   history). Badges are re-derived from the post-merge account aggregate.

## Weak / unverified

- **Bundle headroom is now thin: `/app` is 195 kB of the 200 kB budget (~5 kB).** Three surfaces
  (daily-goal ring, freeze token, sidebar rings) and the badge-toast branch land on `/app`. Any
  further `/app` work (5.6c leaderboard entry points) must watch this hard; trophy case and rank
  ladder were deliberately kept on their own route bundles.
- **Flawless-count source differs by design**: SQL counts `first_try_bonus` xp_events; TS
  recomputes from current attempts. They agree for normal play and the parity test pins the
  definition, but a contrived anon attempt whose `wrongAttempts` was mutated post-solve could
  drift. If it ever fails, switch both to the events-style "clean solves on record".
- **Authed daily-goal history isn't surfaced client-side** beyond today's ring and the
  server-owned Daily Devoted badge; `dailyGoal.completedDates` is only populated for anonymous
  play. This is intentional (badges come from the server when authed) but means the HUD ring for
  a freshly signed-in user shows today's progress only until the next solve.
- **Streak-freeze and multi-day scenarios are unit/DB-tested, not e2e-tested** — the e2e covers
  First Blood, the rings, the trophy case, and the ladder, but earning/spending a freeze token
  requires multi-day clocks that Playwright can't advance. Covered by `streak-freeze.test.ts`.
- **`prefers-reduced-motion`** honored by construction (rings/toasts are `motion-safe:`); not yet
  run under a reduced-motion Playwright project.
