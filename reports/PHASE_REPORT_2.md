# Phase 2 Report — Notebook Engine

**Date:** 2026-06-10
**Status:** Complete. All checks green (47 unit tests, 10 e2e incl. axe). Awaiting Daniel's review before Phase 3.

## What was built

- **Zustand store** ([src/store/workspace.ts](../src/store/workspace.ts)): navigation (mission/tutorial view, sidebar tab, mobile drawer), filters (sector, difficulty, search), and per-challenge attempt state with a strict lifecycle — `select → startRun → completeRun(correct?)` → solved/failed; selecting after a failure returns to idle; solved challenges ignore further selection/runs; hints cap at 2. Pure `filterChallenges` helper. 15 store tests.
- **Tokenizer** ([src/lib/tokenizer/tokenize.ts](../src/lib/tokenizer/tokenize.ts)): regex-based line tokenizer for python/jsx/javascript/sql → keyword/string/comment/number/type/function/plain, mapped to the Section 8 syntax palette. Lossless (proven by test). 11 tests.
- **Content loader** ([src/lib/content/load.ts](../src/lib/content/load.ts)): server-side fs loader that runs the same Phase 1 validation and **throws at build time** on any invalid content — a bad challenge can't ship.
- **Notebook workspace** (`src/components/notebook/`): briefing markdown cell → `In [1]:` code cell (line numbers, highlighting, amber bug band with bug marker) → `Out [1]:` output cell (`aria-live`; red traceback initially, "Executing…" during run, the _selected option's own log_ after — green on solve, red wrong-path log on failure) → control cell (radio option cards, rationale reveal with shake on wrong, AI Hint 0/2 progressive, Run Cell, Next Notebook) → on solve, explanation panel + recruiter card with APPROVED stamp. Run shows the executed option's `patchCode` in the code cell.
- **Sidebar** ([src/components/sidebar.tsx](../src/components/sidebar.tsx)): Missions/Tutorials tabs (ARIA tablist), search by title/concept tag, difficulty pill filters, file explorer with icons + difficulty badges + solved checks; mobile drawer (dialog semantics, overlay, Escape closes, auto-closes on resize to desktop).
- **Tutorial view**: full lesson markdown, two YouTube **search-query** video cards, "Start mission" hand-off.
- **Header**: sector pills now drive the store filter; solved counter live from attempt state; hamburger < md. Level/XP/streak intentionally static until Phase 3 math.
- **Keyboard**: 1/2/3 select options, Enter runs (deferring to native behavior when a button has focus), N advances through the filtered list, Escape closes the drawer; inputs never hijacked.
- **Markdown**: react-markdown + remark-gfm, raw HTML disabled (no rehype-raw), styled via component overrides; code blocks forced LTR.

## Acceptance evidence

| Criterion                         | Evidence                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Solve + fail flows on the 8 seeds | e2e: solve flow (green output, review card, solved counter), fail flow (wrong-path log, rationale, then recovery), hints cap, tutorial nav, filters — all against real content                               |
| Responsive 360/768/1280           | e2e: drawer + hamburger at 360 (closes on selection), static sidebar and no hamburger at 768/1280; touch targets ≥44px throughout                                                                            |
| axe scan clean                    | e2e runs AxeBuilder on empty, mission, and solved states — 0 violations (one real issue found and fixed: line-number gutter at `text-muted/60` was 2.9:1; now full `text-muted`, ≥5.2:1 on both backgrounds) |
| Store/reducer logic unit-tested   | 15 store tests + 11 tokenizer tests; 47 total                                                                                                                                                                |
| `pnpm check`                      | lint ✓ typecheck ✓ 47/47 ✓ content:validate 8/8 ✓                                                                                                                                                            |
| Bundle                            | 175 kB first-load JS (budget < 200 kB)                                                                                                                                                                       |

## Deviations from the brief

1. **`@axe-core/playwright` added as devDependency** — required by the phase's own acceptance criterion ("axe scan clean"); test-only.
2. Search input is in the sidebar rather than a separate UI region — the brief doesn't pin its location.
3. The keyboard shortcuts listed as SHOULD (1/2/3/Enter/N) are implemented now because the phase line item says "keyboard support" — no extra scope beyond those keys.

## Known gaps / weak spots

- **Bundle headroom**: 175/200 kB. react-markdown is the dominant cost. Phase 6 likely needs to lazy-load the tutorial/markdown path or split challenge payloads (brief Section 11 already mandates on-demand challenge bodies before the 60-challenge catalog ships).
- **Full content in the RSC payload**: with 8 challenges the static page embeds everything (~fine); at 60 this must become on-demand per challenge (planned Phase 6 hardening, flagged now).
- Tokenizer is line-based with no cross-line state — multi-line strings/comments would mis-highlight. The current corpus has none; revisit only if content starts using them.
- The run simulation timer lives in the component (700ms; 200ms under reduced motion). Navigating away mid-run still completes the run in the store — by design, but worth knowing.
- Mobile drawer has no focus trap (axe passes; full keyboard a11y audit is a Phase 6 item).
- No XP/streak/persistence yet — header stats besides "solved" are static until Phase 3.

## Suggested next (Phase 3)

Gamification math (Section 9, exhaustively unit-tested), XP toast + level-up moment, streak, localStorage persistence for anonymous users, portfolio page, daily challenge route.
