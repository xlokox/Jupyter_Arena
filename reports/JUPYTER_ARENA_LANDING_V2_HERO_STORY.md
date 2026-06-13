# JUPYTER ARENA — LANDING V2: SCROLL-DRIVEN HERO + "PROGRAMMING CHANGED FOREVER" STORY

**Owner:** Daniel · **Builds on:** Phase 5.5 landing, 5.6a scroll-reveals, Section 8 design tokens
**Scope:** Landing page only — UI work, **no DB migration** (no plan-mode gate needed). Can run as its own session without touching the placement-quiz roadmap step.

---

## THE BIG IDEA

The hero doesn't *describe* the product — it **performs** it. As the visitor scrolls, a broken notebook cell gets debugged in front of them and the game HUD assembles around it. Then a second scroll-story makes the pitch that justifies the whole site: **AI now writes the code — the valuable skill is understanding and fixing it.** A human developer and an AI robot, animated through three beats, ending augmented side-by-side. That thesis is true, it's the product's reason to exist, and it lands hardest as a visual story.

---

## SECTION 1 — HERO V2 (pinned, scroll-scrubbed)

A sticky stage (~200vh of scroll) where scroll progress (0→1) drives the animation. The visitor's mouse wheel *is* the play head.

**Storyboard:**
| Progress | What happens on stage |
|---|---|
| 0.00 | Headline + a real notebook cell showing buggy code and a **red traceback**. Pulsing "scroll" cue. |
| 0.00–0.35 | Traceback lines collapse one by one; the buggy code line lights up amber (the bug-region band from the app). |
| 0.35–0.65 | The fix applies — the bad line swaps to the corrected line; the output flips to a **green success block**; a "+10 XP" chip floats up. |
| 0.65–1.00 | The game HUD assembles around the cell: level badge pops in, XP bar fills, streak flame ignites, rank title appears, the six sector chips slide into a row. Final frame = a living mini-screenshot of the product. CTAs brighten. |

**Copy (tells the visitor exactly what's inside):**
- Headline (persistent): **"AI writes the code. Can you fix it?"**
- Subhead (reveals by ~0.35): **"A free debugging arena — 90 missions across 6 sectors, from your first line of Python to production bugs. Solve, level up, unlock harder missions."**
- Primary CTA: **"Enter the Arena — free, no signup"** → workspace. Secondary CTA: **"See why this matters ↓"** → scrolls to Section 2.

---

## SECTION 2 — "WHY PROGRAMMING CHANGED FOREVER" (scrollytelling, 3 beats)

A second sticky stage (~300vh). One original inline-SVG scene with layered groups — a **developer figure** and an **AI robot** — animated through three beats as the visitor scrolls. Copy panels advance with the scene.

**Beat 1 — THEN (0–0.33).** A lone developer at a desk; code lines type out slowly, one by one.
> Copy: "For decades, developers were paid to *write* code. Line by line. By hand."

**Beat 2 — NOW (0.33–0.66).** The robot slides in beside the developer; code blocks stream out of it fast — far faster than the human typed. One streamed block **pulses red**.
> Copy: "Now AI writes most of it — in seconds. But it ships bugs with the same confidence as working code."

**Beat 3 — THE AUGMENTED FUTURE (0.66–1.0).** Focus tightens on the red block; the developer leans in, a highlight/magnifier sweep finds the defect, the block flips **green**; human and robot end side-by-side, glowing as a team — the augmented developer.
> Copy: "The next generation of developers won't be valued for typing — they'll be valued for **understanding**: reading code, catching the bug, proving the fix. That's the exact skill this arena trains."
> CTA: **"Train the skill AI can't replace →"**

**Honesty rule (locked):** this story is told **qualitatively** — no invented percentages, no fabricated "X% of code is AI-written" statistics, no fake quotes. The narrative is strong enough without them.

**Below Section 2:** the existing landing sections remain in order (how-it-works 3 steps → sector showcase → progression/rank ladder teaser → honest stats strip → final CTA), upgraded with the same scroll-reveal language so the page feels like one continuous piece.

---

## TECHNICAL DECISIONS (LOCKED)

1. **Zero new dependencies.** No GSAP, no scroll libraries. A small rAF-throttled `useScrollProgress` hook maps each sticky section's scroll progress to a CSS custom property (`--progress`); all motion is CSS `transform`/`opacity` keyed off it. (Transform/opacity only — same compositor-safe rule as 5.6a.)
2. **Original SVG art only.** The developer + robot scene is original geometric/line-art drawn in the Section 8 token palette (amber accent, zinc strokes, JetBrains Mono labels). No stock art, no copyrighted characters, consistent with the premium dev-tool aesthetic — this is *the product's* world, not a cartoon.
3. **Server-rendered, progressively enhanced.** All copy renders without JS (SEO + no-JS readability); animation is enhancement. The LCP element is the headline text, not the animation.
4. **`prefers-reduced-motion`:** the hero shows the final assembled frame statically; the story renders as three stacked static panels with the same copy. Full content parity.
5. **Mobile:** shorter pin distances and simplified motion (fade/translate step-reveals via IntersectionObserver instead of continuous scrub). Touch scrolling must feel native — never hijack or lock scroll.
6. **Accessibility:** illustrative SVGs `aria-hidden` with meaning carried by the visible copy; landmarks intact; axe clean; keyboard users can skip the stages (normal scroll, no traps).
7. **Performance:** landing route gets its own recorded budget — First Load JS target **< 170 kB gzipped**, LCP < 2.5s, **CLS < 0.1 (sticky stages have fixed heights — no layout shift)**. Record Lighthouse numbers in the phase report. The /app workspace budget (197 kB, ~3 kB headroom) is untouched by this work.

---

## ACCEPTANCE CRITERIA

- Hero scrub plays the full storyboard tied to scroll position; smooth at 60fps on a mid-tier device; final frame is the assembled product mini-screenshot with CTAs.
- Story section plays all three beats with the developer + robot SVG scene; copy advances with beats; ends on the augmented pairing + CTA.
- All copy server-rendered; page fully readable with JS disabled.
- Reduced-motion fallbacks verified for both sections (static frames, full copy).
- Mobile behavior verified at 360px: simplified reveals, no scroll-hijack, touch-natural.
- No new dependencies in package.json; no fabricated statistics anywhere in the copy.
- axe clean on the landing; Lighthouse numbers recorded (target <170 kB / LCP <2.5s / CLS <0.1).
- Design-skill passes run: web-design-guidelines + frontend-design, then critique + polish.
- `pnpm check` + `pnpm e2e` green (add a landing scroll-story e2e + reduced-motion test). Write `reports/PHASE_REPORT_LANDING_V2.md` and STOP for review.

---

## PASTE-READY PROMPT FOR CLAUDE CODE

```
Read JUPYTER_ARENA_LANDING_V2_HERO_STORY.md (in reports/) in full before writing code.
This is LANDING V2 — UI-only, no DB migration. Apply the web-design-guidelines and
frontend-design skills while building, then run a critique + polish pass at the end.

GOAL: the hero PERFORMS the product instead of describing it, and a second scroll-story
sells the thesis: AI writes the code — the valuable skill is understanding and fixing it.

BUILD:

1. HERO V2 (pinned sticky stage, ~200vh, scroll progress 0..1 drives the animation):
   - 0.00: headline + a notebook cell with buggy code and a red traceback; pulsing scroll cue.
   - 0.00-0.35: traceback lines collapse; buggy line lights amber (reuse the app's bug-band look).
   - 0.35-0.65: the fix line swaps in; output flips to a green success block; "+10 XP" chip floats.
   - 0.65-1.00: the game HUD assembles around the cell — level badge, XP bar fills, streak flame,
     rank title, six sector chips slide into a row. Final frame = living mini-screenshot + bright CTAs.
   - Copy: H1 "AI writes the code. Can you fix it?" · Sub: "A free debugging arena — 90 missions
     across 6 sectors, from your first line of Python to production bugs. Solve, level up, unlock
     harder missions." · CTA1 "Enter the Arena — free, no signup" -> workspace · CTA2 "See why
     this matters ↓" -> scrolls to the story section.

2. "WHY PROGRAMMING CHANGED FOREVER" STORY (second sticky stage, ~300vh, 3 beats, one original
   inline SVG scene with layered groups: developer figure + AI robot, drawn in the Section 8
   token palette — geometric line-art, amber/zinc, NO stock art, NO copyrighted characters):
   - Beat 1 THEN (0-0.33): lone developer; code lines type out slowly.
     Copy: "For decades, developers were paid to write code. Line by line. By hand."
   - Beat 2 NOW (0.33-0.66): the robot slides in; code blocks stream out fast; one block pulses RED.
     Copy: "Now AI writes most of it — in seconds. But it ships bugs with the same confidence as
     working code."
   - Beat 3 AUGMENTED FUTURE (0.66-1.0): focus on the red block; the developer leans in, a
     highlight sweep finds the defect, the block flips GREEN; human + robot end side-by-side,
     glowing as a team. Copy: "The next generation of developers won't be valued for typing —
     they'll be valued for understanding: reading code, catching the bug, proving the fix.
     That's the exact skill this arena trains." CTA: "Train the skill AI can't replace ->".
   - HONESTY RULE: qualitative narrative ONLY — no invented percentages, no fabricated stats,
     no fake quotes. Keep the existing landing sections below, upgraded to the same
     scroll-reveal language.

TECHNICAL CONSTRAINTS (locked):
   - ZERO new dependencies. A small rAF-throttled useScrollProgress hook sets a --progress CSS
     custom property per sticky section; all motion is CSS transform/opacity only.
   - Server-render all copy (readable with JS disabled); LCP element is the headline text.
   - prefers-reduced-motion: hero shows the final assembled frame statically; story renders as
     three stacked static panels with full copy. Content parity.
   - Mobile (360px): simplified step-reveals via IntersectionObserver, shorter pins, NEVER
     hijack or lock touch scrolling.
   - SVG scenes aria-hidden; meaning carried by visible copy; axe clean; no keyboard traps.
   - Landing route budget: First Load JS < 170 kB gzipped, LCP < 2.5s, CLS < 0.1 (fixed-height
     stages). Record Lighthouse numbers. Do NOT touch the /app workspace bundle.

ACCEPTANCE: full hero scrub + 3-beat story working and smooth; reduced-motion + no-JS + mobile
verified; no new deps; no fabricated stats; axe clean; Lighthouse numbers recorded; new landing
e2e (scroll story renders + reduced-motion fallback); pnpm check + pnpm e2e green. Write
reports/PHASE_REPORT_LANDING_V2.md and STOP for review.

ROADMAP NOTE: this slots in WITHOUT touching the placement-quiz step (step 4, still pending its
plan-mode pass). Remaining after this: placement quiz -> graph challenges (da-016..025 + figure
pipeline) -> leaderboard + public portfolio -> Phase 7. Do not lose that list.
```

*End of Landing V2 spec.*
