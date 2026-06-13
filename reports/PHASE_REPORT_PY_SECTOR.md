# Phase Report — Python Fundamentals Sector (the true first step)

First deliverable of the Beginner Foundations pack (`reports/JUPYTER_ARENA_BEGINNER_FOUNDATIONS.md`,
Part 1). Adds a 6th sector, **Python Fundamentals (`py`)** — the ground floor for someone who has
never programmed: print text, name a value, do arithmetic in the right order, index a list, write a
loop, define a function. Ungated, positioned **first** (Data Analyst shifts to position 1). 15
challenges in 2 batches. No migration — reuses the `sectors.is_gated` mechanism. Branch
`feat/python-fundamentals` (off `main`, which now carries 5.6b + DA).

## Acceptance checklist

| Item | Status |
|------|--------|
| `pnpm check` (lint + typecheck + 126 unit + content:validate) | PASS |
| `pnpm test:db` (74, local stack) | PASS |
| `pnpm e2e` (25 passed, 1 pre-existing auth-merge skip) | PASS |
| `/app` First Load JS < 200 KB | PASS — **196 kB** |
| `py` sector exists, ungated, positioned **first** (DA → position 1) | Done |
| Accept/reject RPC test (level-1 accepted on PY, rejected on a gated hard challenge) | Done — `tests/db/python-fundamentals.test.ts` |
| 15 challenges (py-001..015), mix **12 easy / 3 medium** | Done — `content:validate` green, mix confirmed |
| Tutorials at true zero level (define variable/string/list before use, worked example, common-mistakes, "you just learned" recap, 2 YouTube search links) | Done |
| XP/streaks still apply on PY challenges | Done — test asserts `xp_delta > 0` |
| New/anonymous users nudged to Python Fundamentals | Done — landing cue + app-shell empty-state button now point to `py` (prefer py, else da) |

## What changed

- **Content** — `content/challenges/py/py-001..015.json`. Easy (001–012): unterminated string,
  NameError typo, operator precedence, `//` vs `/`, `str + int` TypeError, `input()` is text,
  `=` vs `==`, indentation, zero-based list index, `range` exclusive end, dict `KeyError`,
  `return` vs `print`. Medium (013–015): infinite `while`, comparing across types, the accumulator
  reset. Each: 3 options with realistic wrong-path logs (including instructive "looks right but
  fragile" distractors), 2 hints, explanation, recruiter review, and a from-zero tutorial.
- **Scaffolding (no migration)** — `SECTOR_IDS`/id-regex add `py`; `sectors.json` `py@0`, `da@1`,
  others shifted; `SECTOR_ORDER` (load + source). SectorId ripple: i18n `sectors`, header filters,
  portfolio, sidebar `SECTOR_SHORT`, app-shell `sectorTotals`, badges `FULL_TOTALS` test. 7 new
  registry icons (variable, equal, divide, braces, infinity, list-ordered, sigma).
- **Onboarding** — empty-state CTA + landing cue now read "Python Fundamentals"; `firstBeginnerId`
  prefers a `py` mission, falling back to `da`.
- **Counts** — landing/metadata copy 75→**90** challenges, 5→**6** sectors.
- **Tests** — `python-fundamentals.test.ts`; e2e portfolio total `1/90`; the daily-determinism e2e
  got a scoped 2-retry (it can flake only under parallel dev-server cache contention — see below).

## Deviations / flagged

1. **DA position shift.** Per the Beginner-Foundations spec, `py` is position 0 and Data Analyst
   moves to position 1 (it shipped at 0). Done in this change — `sectors.json` and all ordering.
2. **No Sector Sweep badge for `py`** (same as DA — `SECTOR_SWEEP` is `Partial<Record<SectorId,…>>`).
   `py` solves still count toward First Blood / Traceback Hunter / Flawless Five.
3. **Learn-first layer not yet applied.** The spec requires `lineNotes` (line-by-line annotations)
   and a concept card for every `py` and `da` challenge. That is **Part 3 of the pack, not built
   yet** — these 15 `py` challenges ship per Section 6 without `lineNotes`/concept cards, which
   will be retrofitted onto all 30 beginner challenges in the learn-first step (carries a small
   schema migration → plan mode). Tracked as the next foundations deliverable.

## Weak / unverified

- **`/app` headroom stays ~4 KB** (196/200). The 7 new lucide icons are tree-shaken and didn't move
  the rounded number, but the margin is thin — future `/app` work must keep watching it.
- **Authored, not executed.** Tracebacks/outputs are realistic and schema-validated but hand-written
  (content is data; no runtime). Each was cross-checked against the bug it describes; a content
  review is still worthwhile, especially the few "runs but fragile" distractors (py-014 string
  comparison, py-012 double-print) whose result logs intentionally match the correct output.
- **Daily-determinism e2e flake.** It asserts the deterministic daily pick *through the dev server*
  across two visits; under 3 parallel workers the dev server occasionally serves inconsistent cached
  metas, so the test now retries (passes 5/5 in isolation). Determinism itself is proven
  deterministically by `tests/db/daily-challenge.test.ts` and the pure `src/lib/game/daily.ts`.

## Remaining in the Beginner Foundations pack (next, in order)

Learn-first layer (concept card + `lineNotes` + `takeaway`, retrofit onto `py`+`da`) → placement
quiz (migration: `'placement'` xp reason + `experience_level`, routing, privacy) → graph challenges
`da-016..025` + the matplotlib figure pipeline. Then the full `PHASE_REPORT_FOUNDATIONS.md`.
Separately outstanding: leaderboard (5.6c), per-user public portfolio URL, Phase 7 execution.
