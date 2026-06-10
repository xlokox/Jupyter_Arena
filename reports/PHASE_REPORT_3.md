# Phase 3 Report — Gamification, Portfolio, Daily Challenge

**Date:** 2026-06-10
**Status:** Complete. All checks green (77 unit tests, 15 e2e incl. axe). Awaiting Daniel's review before Phase 4 (plan mode).

## What was built

- **Section 9 math** ([src/lib/game/xp.ts](../src/lib/game/xp.ts)) — pure functions, implemented exactly: +10 correct first solve, −5 wrong floored at 0, +5 first-try clean (0 wrong, ≤1 hint), +5 first UTC-day solve, 0 for re-solves; `level = floor(xp/50)+1`; the locked rank ladder; UTC streaks with `longestStreak` and a `displayStreak` helper (lapsed streak renders 0 before the next solve restarts at 1); accuracy. Phase 4's `submit_attempt` RPC re-implements these same rules server-side.
- **Daily selection** ([src/lib/game/daily.ts](../src/lib/game/daily.ts)) — FNV-1a over the UTC date, order-independent (ids sorted before indexing).
- **Store integration** — `completeRun` applies the math and emits a `Reward` (events, total, level-up flag) for the toast layer; hints/wrong-attempt counts flow from the attempt state into the bonus rules.
- **Persistence** — zustand `persist` (localStorage, key `jupyter-arena-progress-v1`), partialized to attempts + stats only, `skipHydration` for SSR safety with explicit rehydrate in AppShell/Portfolio; a `merge` sanitizer returns any persisted mid-run "running" attempt to idle.
- **XP toast + level-up moment** ([src/components/xp-toast.tsx](../src/components/xp-toast.tsx)) — per-event breakdown, `role="status"` live region, transform-only entrance (no opacity fade — keeps contrast axe-clean at every animation frame), single ~600ms amber pulse on level-up, all `motion-safe`.
- **Header live** — level, rank title, animated XP bar (`xp % 50`), display streak, solved count, Portfolio link.
- **Portfolio page** (`/portfolio`) — "Public Portfolio Dashboard" with the spec's "Perfect for your LinkedIn or resume to prove your debugging speed!" line, stats grid (XP, rank, solved x/N, accuracy, current/longest streak), per-sector progress bars.
- **Daily challenge** (`/daily`) — `force-dynamic` route computing today's UTC pick and opening it via AppShell's `initialChallengeId`.

## Acceptance evidence

| Criterion | Evidence |
|---|---|
| XP math tests cover every event incl. floor and idempotent re-solve | 30 tests in [xp.test.ts](../src/lib/game/xp.test.ts): all four events, floor at 3→0 and 0→0 (incl. a found-and-fixed `-0` normalization), bonus forfeits via hints and via wrong attempts, daily-once-per-day, streak start/extend/month-boundary/lapse-restart/longest, level boundaries (49/50/99/100), all rank tiers, `alreadySolved` no-op, accuracy, daily determinism + order independence. Plus 6 store-integration tests (e.g. wrong-then-correct = 15 XP, no first-try bonus). |
| Refresh restores anonymous progress | e2e: solve → reload → XP bar, solved counter, explorer checkmark, and solved review-mode state all intact |
| Daily challenge deterministic per UTC date | unit: same day ⇒ same id, order-independent, always in catalog; e2e: two visits to `/daily` open the same mission |
| All gates | lint ✓ typecheck ✓ 77/77 unit ✓ content:validate ✓ 15/15 e2e ✓ axe clean ✓ |
| Bundle | / = 182 kB, /portfolio = 111 kB first-load (budget < 200 kB) |

## Deviations from the brief

None requiring a decision change. Notes: the toast entrance animates transform only (a fade was caught mid-animation by axe at ~3:1 contrast — slid instead of faded); the portfolio "share button" is the SHOULD-tier OG-card item and was not built (LATER per phase scope).

## Known gaps / weak spots

- **Streak display is computed at render time** — if a tab sits open across UTC midnight, the streak display refreshes on the next state change rather than at the stroke of midnight. Cosmetic; the math is always evaluated against `now` at solve time.
- **localStorage is trusted locally** — fine for anonymous play; Phase 4's merge-on-signup recomputes XP server-side from solved challenges per the brief (never trusting client totals).
- **`/daily` is server-rendered per request** — cheap, but once on Vercel it could move to ISR with a UTC-midnight revalidation if traffic warrants.
- Bundle headroom shrank to 182/200 kB on `/` — the Phase 6 payload-splitting note from the Phase 2 report now applies to JS too.

## Suggested next (Phase 4 — plan mode required)

Supabase: migrations from Section 5, RLS deny-by-default, `submit_attempt` RPC (server-side Section 9 math), seed script, email-OTP auth, local→account merge. Per Working Agreement 2, Phase 4 starts in plan mode and presents the plan before touching anything.
