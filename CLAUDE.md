# Jupyter Arena — Operating Rules (condensed from MASTER_BRIEF.md)

Read `MASTER_BRIEF.md` and the latest `reports/PHASE_REPORT_*.md` before any work. Decisions in the brief are LOCKED — flag concerns in phase reports, never change them unilaterally.

## Commands

| Command                         | What it does                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `pnpm dev`                      | Dev server at http://localhost:3000                                                 |
| `pnpm build`                    | Production build                                                                    |
| `pnpm check`                    | lint + typecheck + unit tests + content:validate (gate for every phase, runs in CI) |
| `pnpm content:validate`         | Zod + QA checks over `/content` (Section 6 rules)                                   |
| `pnpm test` / `pnpm test:watch` | Vitest unit tests (`src/**/*.test.{ts,tsx}`)                                        |
| `pnpm e2e`                      | Playwright e2e (`e2e/`, starts dev server itself)                                   |
| `pnpm lint` / `pnpm format`     | ESLint / Prettier                                                                   |

Package manager is **pnpm**, Node ≥ 20.

## Structure

- `src/app/` — Next.js App Router (TS strict). `globals.css` holds the Section 8 design tokens (`--bg`, `--panel`, `--accent`, …) mapped to Tailwind utilities (`bg-panel`, `text-accent`, `border-border`, …). Use the tokens, never raw hex in components.
- `src/components/` — UI components; colocated `*.test.tsx`. `notebook/` holds the workspace cells (code/output/control/solve-panel); `app-shell.tsx` owns layout + keyboard shortcuts (1/2/3 select, Enter run, N next, Esc closes drawer). New content icons must be registered in `challenge-icon.tsx` (explicit map for tree-shaking).
- `src/store/workspace.ts` — Zustand store: filters, navigation, per-challenge attempt lifecycle (select → startRun → completeRun). Keep it content-agnostic; pass `isCorrect` in from components.
- `src/lib/tokenizer/` — line-based syntax tokenizer (python/jsx/js/sql). `src/lib/content/load.ts` — server-only fs loader; throws at build on invalid content.
- `src/lib/game/` — Section 9 XP/streak math (pure, exhaustively tested) + deterministic daily-challenge pick. The store persists attempts+stats to localStorage (`jupyter-arena-progress-v1`, skipHydration → AppShell rehydrates in an effect). Routes: `/` (static), `/portfolio` (static, client stats), `/daily` (force-dynamic, opens today's UTC pick).
- `src/i18n/en.ts` — ALL user-visible strings. Components never hardcode copy. Use logical CSS properties (`ms-*`, `text-start`) for future RTL. Code blocks always LTR.
- `e2e/` — Playwright specs.
- `content/` — `sectors.json` + `challenges/{sector}/{id}.json`, validated by `src/lib/content/schema.ts` (Zod) and the QA checks in `src/lib/content/validate.ts`; seeded to Postgres in Phase 4. Authoring rules: brief Section 6 (traceback must match the code, exactly one correct option, wrong options get realistic failure logs, video links are YouTube search queries only, no TODO/lorem).
- `reports/` — one `PHASE_REPORT_N.md` per phase.

## Hard rules (from brief Sections 2, 4, 12)

1. **Phased work.** Execute one phase, stop at its acceptance checklist, wait for Daniel's review. Plan mode for Phase 4 and anything destructive.
2. **Done means green.** Never report a phase complete with failing/skipped checks; never weaken a test or budget to pass.
3. **No placeholders.** No TODO, lorem, stubs, fabricated references. YouTube links are search-query URLs only.
4. **Locked dependency list** (brief Section 4). Anything else needs a one-line justification in the phase report _before_ installing.
5. **Zero server-side code execution. Anonymous-first. Content is data, not code.**
6. **Conventional commits** (`feat:`, `fix:`, `content:`, `test:`, `chore:`); content batches of 5 per commit in Phase 5.
7. **Honest reporting** — phase reports state what is weak or unverified.
8. Keep this file current in the same commit as any convention change.

## Gamification math (Section 9 — implement exactly, unit-test)

+10 correct first solve · −5 wrong (XP floored at 0) · +5 first-try clean (≤1 hint) · +5 first solve of UTC day · 0 for re-solves. `level = floor(xp/50)+1`. Ranks: 1–5 Compile Rookie, 6–15 Traceback Hunter, 16–30 Kernel Engineer, 31+ Overlord Compiler.
