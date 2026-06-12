# Phase Report — Data Analyst Sector (the beginner on-ramp)

Adds a 5th sector, **Data Analyst (`da`)**, per `JUPYTER_ARENA_DATA_ANALYST_SECTOR.md`: the
ungated ground floor for absolute beginners (read a file, pick a column, filter, group/count,
write a simple query). It is positioned first, completely ungated (no level required on any DA
mission), still awards XP/streaks, and nudges new users in. Migration 015; 15 challenges in 3
batches. Branch `feat/data-analyst-sector` (stacked on the unmerged 5.6b branch).

## Acceptance checklist

| Item | Status |
|------|--------|
| `pnpm check` (lint + typecheck + 126 unit + content:validate) | PASS |
| `pnpm test:db` (72, local stack) | PASS |
| `pnpm e2e` (25 passed, 1 pre-existing auth-merge skip) | PASS |
| `/app` First Load JS < 200 KB | PASS — **196 kB** (was 195) |
| New `Data Analyst` sector exists (`sectors.json` + DB), positioned **first** | Done |
| Sector is **ungated**: anonymous level-1 user can open + solve every DA mission, incl. via `submit_attempt` | Done — proven by `tests/db/data-analyst.test.ts` |
| Gated sectors unaffected (still level-locked) | Done — same test asserts a gated hard challenge still rejects a level-1 user |
| 15 challenges authored per Section 6, `content:validate` green, mix **9 easy / 5 medium / 1 hard** | Done |
| Tutorials genuinely beginner-level (terms defined, worked example, common-mistakes list, mission⇄tutorial parity, 2 YouTube **search** links each) | Done |
| XP/streaks still apply on DA challenges | Done — test asserts `xp_delta > 0` on a DA solve |
| New/anonymous users nudged toward Data Analyst | Done — landing hero cue + app-shell empty-state button |
| Performance budget intact | Done — `/app` 196 kB |

## How ungating works (the locked primary design)

`sectors.is_gated` (migration 015, default `true`). The Data Analyst row seeds `false` from
`sectors.json` via `content:seed`. Two enforcement points, kept consistent:

- **Server:** `submit_attempt` v4 joins `sectors` in its gating select and skips the
  `challenge_locked` raise when `is_gated=false` — the same exemption shape already used for the
  daily challenge. Everything else (badges, streak-freeze, daily-goal, `award_badges`) is
  byte-identical to 014.
- **Client:** `getChallengeMetas`/`toMeta` set `unlockLevel=1` for ungated sectors, so the
  purely level-driven client lock (`meta.unlockLevel > userLevel`) never fires for DA. No
  per-component change was needed.

A future ungated sector is now just a flag — no new gating code.

## What changed

- **Migration 015** — `sectors.is_gated`; `submit_attempt` v4 (sector-aware gating).
- **Schema/loader** — `SECTOR_IDS` gains `da`; id regex accepts `da-*`; `SectorSchema.isGated`;
  `SECTOR_ORDER` puts `da` first; `getSectors` maps `is_gated`→`isGated`; seed writes `is_gated`.
- **SectorId ripple** — `da` added to i18n `sectors`, header filters, portfolio, sidebar
  `SECTOR_SHORT`, app-shell `sectorTotals`, badges `FULL_TOTALS`; `SECTOR_SWEEP` relaxed to
  `Partial` (no DA sweep badge — see flagged). Registered `bar-chart-3`, `table-2` icons.
- **Content** — `content/challenges/da/da-001..015.json` (9 pandas, 4 SQL, plus medium step-ups
  and a hard capstone). Beginner tutorials throughout.
- **Onboarding + copy** — landing hero cue, app-shell empty-state CTA; 60→75 challenges, 4→5
  sectors across i18n + page metadata.
- **Tests** — `tests/db/data-analyst.test.ts`; `lockedChallengeOfDifficulty` + the daily test's
  non-daily pick now exclude ungated sectors; e2e: portfolio 1/75, a DA-medium-is-playable spec,
  and a hardened daily-determinism test.

## Deviations / flagged

1. **DA difficulty mix is 9/5/1**, overriding MASTER_BRIEF Section 7's per-sector 5/5/3/2. This
   is intentional and spec-mandated: the on-ramp is deliberately easy-weighted, and difficulty
   labels are informational in this sector (they gate nothing). The validator enforces no
   per-sector mix, so `content:validate` is green.
2. **No Sector Sweep badge for Data Analyst.** Adding `da` to `SectorId` would otherwise force a
   `sector_sweep_da` badge (migration seed + `BadgeId` + i18n + parity). DA is the tutorial
   sector, so `SECTOR_SWEEP` was relaxed to `Partial<Record<SectorId, BadgeId>>` and DA simply has
   no sweep badge. DA solves still count toward First Blood / Traceback Hunter / Flawless Five.
3. **Progression teaser left at 19/23/12/6** (the gated rank-up ladder). DA's medium/hard are
   ungated and don't belong on that ladder; the global totals (75 challenges, 5 sectors) are
   updated everywhere else.

## Weak / unverified

- **`/app` headroom is now ~4 KB** (196/200). The DA sector itself is data, but the empty-state
  nudge + one icon nudged it up 1 KB. 5.6c (leaderboard) must stay on its own route.
- **Authoring is hand-written, not executed.** The traceback/output strings are realistic and
  schema-validated, but the simulated pandas/SQL outputs are authored, not produced by a runtime
  (by design — content is data, no server execution). Each was cross-checked against the bug it
  describes; a careful content review is still worthwhile.
- **The daily pick now spans 75 challenges** and can land on a DA challenge; harmless (DA is
  ungated anyway) and the daily parity test recomputes from the published set.
- **Pre-existing e2e flake hardened, not root-caused.** The daily-determinism test could read the
  empty-state heading mid-open under parallel load; it now waits for a settled mission heading.
  The underlying open-timing on `/daily` is unchanged.

## Remaining TODO (carry-forward, not this task)

5.6b badges and 5.6c leaderboard are on the `feat/phase-5.6b-achievements` branch awaiting review
(this branch stacks on it). The spec's note about "fullstack-004..015 and db-003..015 still need
authoring" is **stale** — those 25 challenges already exist and validate; the catalog is 60
gated + 15 Data Analyst = 75.
