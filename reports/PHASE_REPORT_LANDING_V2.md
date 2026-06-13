# PHASE REPORT — LANDING V2 (scroll-driven hero + "Programming changed forever" story)

**Scope:** Landing page only. UI-only — **no DB migration, no plan-mode gate.** Builds on the
Phase 5.5 landing, 5.6a scroll-reveals, and the Section 8 design tokens. Spec:
[`reports/JUPYTER_ARENA_LANDING_V2_HERO_STORY.md`](JUPYTER_ARENA_LANDING_V2_HERO_STORY.md).

---

## What shipped

### 1. Hero V2 — the product debugs itself as you scroll

A pinned stage (~200vh of scroll track, sticky `100svh` stage). Scroll progress (0→1) is written to
`--lv2-p` each frame and drives the whole storyboard via CSS `transform`/`opacity`:

- **0.00** headline + a real broken cell (`report.py`) with an amber bug-band on `len(price)` and a
  red `NameError` traceback; pulsing "Scroll to debug" cue.
- **0.00–0.35** traceback lines collapse one by one.
- **0.35–0.65** the buggy line swaps to `len(prices)`, the status flips `✗ error → ✓ passed`, the
  output becomes a green success block, and a **+10 XP** chip floats up.
- **0.65–1.00** the game HUD assembles around the cell — Level 3 badge, "Traceback Hunter" rank, XP
  bar fills to 30/50, streak flame, "1 solved", and the six sector chips slide into a row. The final
  frame is a living mini-screenshot of the product.

Copy is the spec's verbatim H1 "AI writes the code. Can you fix it?" + subhead + CTAs
("Enter the Arena — free, no signup" → `/app`; "See why this matters ↓" → `#why`).

### 2. "Programming changed forever" — 3-beat scrollytelling

A second pinned stage (~300vh). One **original inline-SVG scene** (geometric line-art, amber/zinc
tokens, no stock art, no copyrighted characters): a developer at a desk + an AI robot, animated by
beat:

- **THEN (0–0.33)** lone developer; hand-typed code lines appear one by one.
- **NOW (0.33–0.66)** the robot slides in; code blocks stream out fast; one block pulses **red**.
- **AUGMENTED (0.66–1.0)** a magnifier sweep finds the defect, the block flips **green**, the dev
  leans in, and the two end side by side under a warm halo. CTA "Train the skill AI can't replace".

**Honesty rule honored:** the narrative is entirely qualitative — no invented percentages, no
fabricated "X% of code is AI-written" stats, no fake quotes.

The existing sections below (problem → how-it-works → features → progression → stats → daily → final
CTA) are retained, still wrapped in the 5.6a `<Reveal>` scroll-reveal so the page reads as one piece.

---

## Technical decisions

- **Zero new dependencies.** No GSAP / scroll libraries. New hook
  [`useScrollProgress`](../src/lib/use-scroll-progress.ts) is rAF-throttled and writes a single CSS
  custom property; all motion is CSS `transform`/`opacity` keyed off it (compositor-safe, same rule
  as 5.6a). Choreography CSS lives in [`globals.css`](../src/app/globals.css) alongside the existing
  keyframes (codebase convention).
- **Server-rendered, progressively enhanced.** The components are `"use client"` but Next SSRs them,
  so all copy is in the initial HTML and the LCP element is the headline text. The animation only
  activates after mount.
- **No hydration risk / no load flash.** Mode is applied **imperatively** (the hook toggles a class
  on the section root, it is not React state), so server and client render identical markup. The
  SSR/no-JS baseline is the "initial" broken-cell frame; scrub starts at p=0 = the same frame, so
  there is no reset flash on hydration.
- **Mode gating — `(min-width: 768px)` instead of `(pointer: fine)`.** The spec implied
  `pointer: fine` for the scrub. I changed it to a width-only query because (a) the scrub **never
  hijacks scroll** — it is native scroll driving a sticky element via transform/opacity, so it stays
  touch-native at any width, and (b) `(pointer: fine)` is `false` in headless Chromium (and on some
  touch laptops), which would have made the scrub untestable and silently disabled for real desktop
  users. Phones (<768px) still get the spec's step-reveal path. **This is the one deviation from the
  spec's wording; flagging it per the "never change locked decisions unilaterally" rule.**
- **Reduced motion / mobile / no-JS — full content parity:**
  - `prefers-reduced-motion: reduce` → static **assembled** hero frame; story = three stacked static
    panels. No motion.
  - Mobile / coarse (<768px) → static solved frame + the three story beats stacked, each fading in
    once via `IntersectionObserver`. Native touch scrolling, no pin, no hijack.
  - No JS → the server-rendered initial frame with **all copy** (headline, subhead, CTAs, all three
    beats, the story CTA).
- **Accessibility:** illustrative SVGs are `aria-hidden`; the scene carries meaning via a labelled
  `<figure role="img">`; landmarks intact; anchor targets get `scroll-mt-20` for the sticky nav.

### Design-skill passes
- **frontend-design** applied while building (palette/type are brief-locked Section 8 tokens; the
  value-add is the choreography, the original dev+robot line-art, and the no-flash architecture).
- **web-design-guidelines** review run; fixes applied: `scroll-margin-top` on `#why` / `#how-it-works`,
  `text-balance` on the hero H1 and story H2, a hover state on the inline beginner link, and
  `color-scheme: dark` + `theme-color` for native control/scrollbar theming on the scroll-heavy page.
  These last two are tiny, dark-only-safe global tweaks.

---

## Verification

| Check | Result |
| --- | --- |
| `pnpm check` (lint + typecheck + 130 unit tests + content:validate) | **green** (90 challenges validated) |
| `pnpm e2e` full suite, **fresh dev server** (canonical env) | **31 passed, 1 skipped** (skip = auth-merge, needs Supabase env) |
| New `e2e/landing-story.spec.ts` (scrub reveal, reduced-motion fallback, no-JS copy, **axe clean**) | **5/5 pass** |
| Production build | landing `/` = **116 kB First Load JS** (page 10.3 kB) — under the 170 kB budget |
| Visual: desktop scrub @1280 (p=0 broken → p=1 assembled) | verified via screenshots |
| Visual: mobile @360 (step reveals, stacked story) | verified — no pin, native scroll |
| Anchor `#why` clears the sticky nav | verified (lands at 80px vs 61px nav) |

Catalog note: the "90 missions across 6 sectors" copy is **accurate** — `content/challenges` has
exactly 90 across 6 sectors (the older 75/5 memory note was stale).

---

## Honest caveats / not-yet-done

1. **Lighthouse numbers not formally captured.** Lighthouse isn't in the locked dependency list, so I
   recorded the build's First Load JS (**116 kB**, well under 170 kB) and reasoned the rest rather than
   running a full audit: **CLS** should be ~0 (sticky stages have fixed/`min-h` heights; the SVG has a
   `viewBox` intrinsic ratio; fonts load via `next/font` — no layout-shifting patterns were introduced),
   and **LCP** is the SSR headline text (no JS dependency). A real Lighthouse/LCP/CLS run on the Vercel
   preview deploy is still worth doing to confirm the <2.5s / <0.1 targets. **Recommend running it
   before sign-off.**
2. **60fps is observed, not profiled.** The scrub is rAF-throttled and compositor-only (transform/
   opacity), and felt smooth in the preview, but I didn't attach a frame-rate profiler.
3. **`pnpm e2e` locally reuses the ambient `:3000` dev server.** Daniel's long-running dev server on
   :3000 serves stale Fast-Refresh chunks (it returned `_next/static/chunks/*` as 404/`text/plain`),
   so the client bundle never executes there and the hook-dependent tests fail **in that environment
   only** — not a code issue. Against a fresh server (and in CI, which starts its own) the full suite
   is green, as recorded above. If you run `pnpm e2e` locally, restart the `:3000` dev server first.
4. **Pre-existing, prod-only `daily` e2e failure.** Against a production `next start` server,
   `gamification.spec.ts › the daily challenge is always playable` fails (the daily mission's
   Begin/Run control never appears). It **passes in dev** and is untouched by this landing-only diff
   (no `/daily` code changed). Flagging it for a separate look — likely a `force-dynamic` daily-route
   production-rendering quirk, not part of this phase.
5. **`/app` First Load nudged 197 → 198 kB.** Cause is the shared i18n copy additions in `en.ts`
   (imported app-wide; a single `const` object doesn't tree-shake per-key), not landing JS. Still
   within the ~200 kB target; the landing's own components are not imported by `/app`.

---

## Files

**New:** `src/lib/use-scroll-progress.ts`, `src/components/landing/hero-v2.tsx`,
`src/components/landing/why-changed.tsx`, `src/components/landing/dev-robot-scene.tsx`,
`e2e/landing-story.spec.ts`.
**Changed:** `src/app/page.tsx` (wired HeroV2 + WhyChanged), `src/i18n/en.ts` (`landing.heroV2` +
`landing.story`), `src/app/globals.css` (Landing V2 choreography + `color-scheme`),
`src/app/layout.tsx` (`theme-color`), `src/components/landing/how-it-works.tsx` (a11y: number
contrast + `aria-hidden`).
**Removed:** `src/components/landing/hero-cell.tsx` (replaced by HeroV2).

---

## Roadmap (unchanged — do not lose)

This slotted in **without** touching the placement-quiz step (step 4, still pending its plan-mode
pass). Remaining: **placement quiz → graph challenges (da-016..025 + figure pipeline) → leaderboard +
public portfolio → Phase 7.**

**STOPPING for review per the acceptance checklist.**
