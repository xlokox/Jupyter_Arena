# Phase 0 Report — Foundation

**Date:** 2026-06-10
**Status:** Complete. All checks green. Awaiting Daniel's review before Phase 1.

## What was built

- Git repository initialized; brief renamed `JUPYTER_ARENA_MASTER_BRIEF.md` → `MASTER_BRIEF.md` per the runbook.
- Next.js 15 (App Router) + TypeScript `strict` (plus `noUncheckedIndexedAccess`) + Tailwind CSS v4, managed with pnpm.
- Section 8 design tokens as CSS variables in `src/app/globals.css`, mapped to Tailwind utilities via `@theme inline` (`bg-panel`, `text-accent`, `border-border`, syntax palette, fonts).
- Fonts self-hosted via `next/font`: Inter (UI) + JetBrains Mono (code/logo).
- i18n dictionary `src/i18n/en.ts`; header consumes it exclusively. Logical CSS properties used (`ms-auto`); `pre/code` forced LTR.
- Header shell (`src/components/header.tsx`): logo + flame, level badge + rank title, XP progress bar (ARIA progressbar), streak, completed count, five sector filter pills (≥44px touch targets, focus-visible rings). Renders initial anonymous-user values (Level 1, Compile Rookie, 0/50 XP) — live state arrives with Zustand in Phases 2–3.
- Tooling: ESLint (next/core-web-vitals + next/typescript), Prettier, Vitest + Testing Library (4 header tests), Playwright (1 smoke test asserting header renders and body background equals the `--bg` token).
- `pnpm check` = lint + typecheck + unit tests.
- `CLAUDE.md` generated.

## Verification evidence

- `pnpm check` — lint ✓, typecheck ✓, 4/4 unit tests ✓
- `pnpm build` — ✓, first-load JS **102 kB** (budget < 200 kB)
- `pnpm e2e` — 1/1 ✓ (Chromium)

## Deviations from the brief

1. **`pnpm check` omits `content:validate`** — the content engine is Phase 1; the script will be added to `check` in the same commit that creates it.
2. **Toolchain dependencies beyond the locked list** (all build/test plumbing, no runtime additions): `react-dom` (React peer), `@types/node|react|react-dom` (TS strict needs types), `@playwright/test` (the locked "playwright" as its test-runner package), `@tailwindcss/postcss` (Tailwind v4's required PostCSS adapter), `@vitejs/plugin-react` + `jsdom` (Vitest JSX + DOM environment), `eslint-config-next` + `@eslint/eslintrc` (Next.js lint preset + flat-config compat), `prettier` (locked list already names it).
3. **Brief filename** differed in the repo (`JUPYTER_ARENA_MASTER_BRIEF.md`); renamed to `MASTER_BRIEF.md` rather than duplicating.
4. The repo contains pre-existing non-app folders (`.agents/`, `.claude/` — agent skills). Excluded from ESLint; committed as-is (they don't affect the build).

## Known gaps / weak spots

- The header is static by design this phase; `aria-pressed` filter pills have no behavior yet.
- Vitest needed `globals: true` for Testing Library auto-cleanup (initial test run failed across-test DOM leakage; fixed and re-verified).
- Playwright runs Chromium only for now; Phase 6 hardening should add a mobile profile per the budgets section.
- No CI workflow yet — the brief implies CI gates from Phase 1 (`content:validate` in CI); suggest adding GitHub Actions in Phase 1.

## Suggested next (Phase 1)

Zod challenge schema + TS types, `/content` layout, `content:validate` CLI with all Section 6 checks (with tests proving each rule catches violations), author the 4 original-spec challenges + 4 easy ones (one per sector).
