# Phase Report 5.5 — Landing, Login, Level-Gating & Engagement

## Acceptance checklist

| Item | Status |
|------|--------|
| `pnpm check` green (lint + typecheck + 84 unit tests + content:validate) | PASS |
| `pnpm e2e` | Pending manual run (e2e updated; dev server required) |
| `pnpm test:db` (level-gating suite) | Pending local Supabase stack |
| Landing page at `/` — hero, all scroll sections, force-static | Done |
| Hero animation (error→running→success loop, `prefers-reduced-motion` aware) | Done |
| `/login` and `/signup` full-page OTP forms | Done |
| Workspace moved to `/app` | Done |
| DB migration 008 — `unlock_rules` table + `unlock_level_override` column | Done |
| DB migration 009 — `submit_attempt` with level check (`challenge_locked`) | Done |
| `UNLOCK_LEVELS` constant in `xp.ts` | Done |
| `unlockLevel` on `ChallengeMeta` (schema, source, toMeta) | Done |
| Sidebar locked state (Lock icon, Level N badge, opacity, aria-label) | Done |
| NotebookView locked gate (LockedPanel replaces ControlCell) | Done |
| XpToast: level-up shows unlocked mission count | Done |
| "What unlocks next" widget in Header | Done |
| Portfolio "Back to arena" link → `/app` | Done |
| E2e tests updated: `goto("/")` → `goto("/app")` | Done |
| `tests/db/level-gating.test.ts` (5 cases) | Done |

---

## What changed

### New routes
- **`/`** — landing page (force-static server component). Hero with animated notebook cell, problem statement, how-it-works steps, feature grid (4 sectors + hints + reviews + portfolio), progression/rank ladder, honest stats strip, daily challenge highlight, final CTA. No fabricated testimonials.
- **`/app`** — workspace (was `/`). `revalidate: 3600` ISR.
- **`/login`** — full-page OTP sign-in form. Redirects to `/app` on success.
- **`/signup`** — same form + benefit copy. Redirects to `/app` on success.

### DB migrations
- **008** — `unlock_rules` table (difficulty → min_level; easy=1, medium=3, hard=6, very_hard=10), nullable `unlock_level_override` column on `challenges`. RLS: anon + authenticated can SELECT.
- **009** — `submit_attempt` now raises `challenge_locked` before correctness check when `floor(xp/50)+1 < coalesce(unlock_level_override, unlock_rules.min_level)`.

### Type / schema
- `UNLOCK_LEVELS: Record<string, number>` exported from `src/lib/game/xp.ts`
- `unlockLevelOverride?: number` in `ChallengeSchema` (Zod)
- `unlockLevel: number` on `ChallengeMeta`; computed in `toMeta()` and DB map
- `prevLevel: number` in `Reward` interface (already added in prior session; used by XpToast)

### UI components
- `src/components/landing/hero-cell.tsx` — client component, CSS animation cycle
- `src/components/landing/how-it-works.tsx`, `features.tsx`, `progression-teaser.tsx`, `stats-strip.tsx`, `final-cta.tsx`
- `src/components/auth/otp-form.tsx` — shared full-page form for `/login` and `/signup`
- `LockedPanel` inline in `notebook-view.tsx` — XP progress bar toward unlock threshold, CTA opens sidebar
- Header: "next unlock" widget below XP bar, Daily shortcut link, Sign in → `/login` link
- Sidebar: locked challenge items show Lock icon + "Level N" badge + reduced opacity

### String changes
- `src/i18n/en.ts`: added `landing`, `lock`, expanded `auth` sections; removed duplicate `errors`/`tutorial` blocks

---

## What was not done / caveats

- **`pnpm e2e` not run**: Playwright requires a running dev server (`pnpm dev`). The e2e test files are updated (`goto("/")` → `goto("/app")`) and a new `e2e/landing.spec.ts` is not yet written (not in the original plan spec, only mentioned as a future addition). The existing suite should pass once the server is running.
- **`pnpm test:db`**: Requires `pnpm db:start`. The new `tests/db/level-gating.test.ts` follows the same pattern as `submit-attempt.test.ts` and covers all 5 required cases.
- **Landing page axe scan**: Not run automatically; design uses existing tokens and semantic landmarks (`header`, `main`, `footer`, `section` with `aria-label`).
- **Very_hard challenge count**: 6 challenges vs spec's 8. The unlock curve is still climbable (see Phase 5.5 plan analysis). No authoring work was needed — all 60 challenges were already present.
- **Anonymous level gating is client-side only**: Per spec, server-side enforcement applies to authed users only (the `submit_attempt` RPC is only callable by authenticated users). Anonymous users see the locked state in the UI and cannot call the RPC regardless.

---

## Non-Negotiables preserved

1. **Anonymous-first**: Play without login still works end-to-end. No login wall added.
2. **Content-as-data**: No dynamic server execution. All challenge content is static JSON.
3. **Zero server-side code execution**: `force-static` landing, `revalidate: 3600` workspace.
4. **SEO-visible content**: Description cell and tutorial tab render normally even for locked challenges.
5. **Phase 6 / Phase 7 untouched**: Security hardening and README/deployment guide unchanged.
