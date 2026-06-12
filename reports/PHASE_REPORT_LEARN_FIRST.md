# Phase Report — Learn-First Layer (Beginner Foundations, Part 3)

Third deliverable of the Beginner Foundations pack. Turns the beginner sectors into a
**Learn → Try → Understand** flow: a **concept card** before the notebook, a **"What does this
code do?"** toggle revealing plain-language **line-by-line notes**, and a **"Key takeaway"** chip
after solving. All three are optional schema fields (existing 60 challenges untouched);
`conceptCard` + `lineNotes` are **required for `py` and `da` only**. Migration 016. Branch
`feat/learn-first-layer` (stacked on the py sector).

## Acceptance checklist

| Item | Status |
|------|--------|
| `pnpm check` (lint + typecheck + 131 unit + content:validate) | PASS |
| `pnpm test:db` (74, local stack) | PASS |
| `pnpm e2e` (26 passed, 1 pre-existing auth-merge skip) | PASS |
| `/app` First Load JS < 200 KB | PASS — **197 kB** (+1 from 196) |
| Concept card before the notebook in beginner sectors, one click to proceed; gated sectors unchanged | Done |
| "Read the full lesson →" opens the tutorial (`openTutorial`) | Done |
| `lineNotes` line-by-line toggle (plain language), required for every py + da challenge | Done — 30/30 carry them |
| `takeaway` chip post-solve (optional) | Done — present on all 30 beginner challenges |
| Everything optional in schema/DB; other 60 challenges untouched | Done |
| Validator **requires** conceptCard + lineNotes for py/da (line numbers within code) | Done — `checkBeginnerLearnFirst`, unit-tested |

## What changed

- **Migration 016** — `challenges.concept_card text`, `line_notes jsonb`, `takeaway text` (nullable,
  no backfill, no RLS change). Threaded through `schema.ts` (optional Zod fields), `source.ts`
  (`ChallengeRow` + `mapChallengeRow`; `CHALLENGE_SELECT`'s `*` already covers them), and
  `seed-content.ts`. The fs path gets them for free via the shared Zod parse.
- **UI** — `notebook-view.tsx` gates beginner missions behind a "Learn first" card (Markdown +
  "Begin challenge" + "Read the full lesson →"; resets per mission, skipped once solved).
  `code-cell.tsx` (now a client cell) adds a "What does this code do?" toggle that reveals line
  notes as a panel below the `<pre>` (keeps the code block intact). `solve-panel.tsx` adds a "Key
  takeaway" chip after the recruiter review. New i18n keys.
- **Content** — `conceptCard` + `lineNotes` + `takeaway` retrofitted onto all **30** beginner
  challenges (`py-001..015`, `da-001..015`). Line notes annotate the meaningful lines (within each
  snippet); tone matches each sector's tutorials.
- **Validator** — `checkBeginnerLearnFirst` enforces the requirement for py/da (enabled last, after
  the retrofit, so `content:validate` stayed green throughout). Five new unit cases.
- **e2e** — a `py` mission shows the concept card → "Begin challenge" reveals the Run cell → the
  line-notes toggle reveals notes. The DA-ungated + daily-playable tests dismiss the card via a
  wait-for-either (card | run cell) helper so the async body load can't race the click.

## Weak / unverified

- **`/app` headroom now ~3 KB** (197/200). The concept card + line-notes toggle + Markdown in the
  code cell + takeaway chip cost ~1 KB. Future `/app` work (placement quiz entry, leaderboard
  links) must watch this hard — prefer separate routes.
- **Line notes annotate key lines, not literally every line.** For short beginner snippets this
  covers the meaningful lines (the bug + context); the validator only requires non-empty + in-range,
  not one-per-line. Reasonable, but a content reviewer may want fuller coverage on a few.
- **Concept-card gate is per-mission, not persisted.** Re-opening a solved beginner mission skips
  the card; an unsolved one shows it again each visit (one click to proceed). No "don't show again"
  preference — acceptable per the spec ("advanced users skip instantly") but could be a future nicety.
- **`line_notes` jsonb round-trip** is covered by `test:db` (seed → mapChallengeRow) staying green,
  but there's no dedicated parity test asserting the fs and DB shapes are byte-identical — the Zod
  schema is the shared contract on both paths.

## Remaining in the Beginner Foundations pack (next, in order)

Placement quiz (migration: `'placement'` xp reason + `experience_level`, routing table, privacy) →
graph challenges `da-016..025` + the matplotlib figure pipeline. Then the consolidated
`PHASE_REPORT_FOUNDATIONS.md`. Separately outstanding: leaderboard (5.6c, now migration 017),
per-user public portfolio URL, Phase 7 execution (refresh README counts 75→90, LICENSE, deploy).
