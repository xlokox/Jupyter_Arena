# JUPYTER ARENA — PHASE 5.6: MAKE IT FEEL LIKE A GAME

**Owner:** Daniel · **Builds on:** `MASTER_BRIEF.md`, Phase 5.5 (landing + level-gating) · **Status:** new scope
**One-line goal:** Same content, same architecture — but every interaction should feel like playing, not studying.

---

## THE PRINCIPLE (don't skip this)

The research is consistent on one warning: the goal is **not** to bury the product in game props. The proven approach is to make the *core action* feel satisfying through immediate feedback, visible progress, and the desire to not break a streak — Duolingo's whole engine is XP + streaks + a single delightful feedback loop, not a hundred mechanics. So Jupyter Arena's "game feel" comes first from making **solving a broken cell** feel like landing a hit: instant reaction, a number that flies up, a bar that fills, a sound. Everything below serves that one loop. Mechanics that don't reinforce "read → fix → satisfying payoff → one more" get cut.

Three motivators drive all of it: **mastery** (visible skill growth), **progress** (bars, levels, completion), and **light competition** (leagues/leaderboard). Avoid dark patterns — no punishing notifications, no manipulative loss mechanics, no fake urgency.

---

## A. THE CORE LOOP — MAKE "RUN CELL" FEEL LIKE A HIT

This is 80% of the game feel. When a user picks the correct fix and runs the cell:
1. The wrong code **visibly patches** — the buggy line(s) animate from red-highlighted to clean (a quick line-swap or diff-morph, ~300ms).
2. The red traceback in `Out[1]` **collapses and a green success block expands** in its place (not an instant cut — a satisfying transition).
3. **`+10 XP` flies up** from the run button and lands on the XP bar, which **fills with a smooth motion**; if it crosses a level boundary, the bar empties and the level badge flips with a pulse.
4. A short, **pleasant success sound** plays (toggleable, off by default until the user opts in or interacts — never autoplay loud).
5. If it was a clean first-try solve, a small **"Flawless +5"** chip appears.

When a user picks wrong and runs:
- The cell **shakes briefly** (~250ms), the option card flushes red, and a **different realistic failure** renders in `Out[1]` (this is the existing wrong-path result log — now with feedback weight).
- `-5 XP` ticks down on the bar (de-emphasized, no scary animation — mastery framing, not punishment).
- The rationale reveals. No shame copy. "Not quite — here's why" energy.

All motion respects `prefers-reduced-motion` (swap animations for instant state changes + a static success/fail indicator). All sound is opt-in and mutable from a persistent toggle.

---

## B. PROGRESSION MADE VISIBLE (mastery + progress)

1. **Persistent player HUD** (header, always visible): rank title + level badge, the live XP bar with current/next thresholds, the streak flame with day count, and a small "missions cleared" counter. This is the dashboard the player checks constantly — treat it like a game's top bar.
2. **Rank ladder screen**: the Compile Rookie → Traceback Hunter → Kernel Engineer → Overlord Compiler ladder shown as a visual progression track, current position marked, next rank's perks/unlocks previewed. Makes the next goal tangible.
3. **The sector map / skill tree**: replace (or augment) the plain file list with a **visual map** of the four sectors, each showing completion (e.g. 7/15), locked vs unlocked missions as nodes, and the next unlock clearly flagged ("2 missions unlock at Level 3"). Borrow the skill-tree mental model — nodes light up as you clear them. Locked nodes are visible but dimmed with a lock + required level, which itself drives the climb.
4. **Completion rings / progress bars everywhere** a goal exists: per sector, per difficulty tier, overall. Near-complete rings pull the user to finish ("one more to clear Easy ML").

## C. ACHIEVEMENTS & BADGES (recognition)

A badge system stored as data (new `badges` + `user_badges` tables), awarded server-side in `submit_attempt` or a post-attempt check so they can't be faked. Each badge has an icon, name, description, and an unlock animation (a card that flips/shines on earn). Starter set — keep it honest and earnable, no participation-trophy spam:
- **First Blood** — first challenge solved
- **Flawless Five** — 5 clean first-try solves
- **Sector Sweep: ML / DL / Full Stack / DB** — clear every mission in a sector
- **Traceback Hunter** — 25 total solves
- **Polyglot** — solve in all four languages (python, jsx, js, sql)
- **No Hints Needed** — solve a Hard challenge with zero hints
- **Streak badges** — 3, 7, 30-day streaks
- **Daily Devoted** — complete 10 daily challenges
A **trophy case** on the profile/portfolio page displays earned + locked (silhouetted) badges. Locked badges with their criteria are aspirational fuel.

## D. STREAKS & DAILIES (habit + return reason)

1. **Daily Challenge** as a first-class game feature (verify it exists; build if missing): a featured mission per UTC day with a small bonus, its own stable URL, and a "solved today ✓" state. This is the single strongest return-driver in the research — apps combining streaks + milestones see materially higher daily return.
2. **Streak mechanic with care**: the flame grows with consecutive days; show the current and longest streak. Tap loss-aversion *gently* — a "don't lose your N-day streak" nudge is fine; manipulative guilt is not. Consider a single **streak-freeze** token earned occasionally so one missed day doesn't nuke a long streak (reduces the rage-quit that kills retention).
3. **Daily goal**: a tiny per-day XP or mission target with a completion ring (e.g. "Daily goal: solve 1 — ✓"). Small, achievable, satisfying.

## E. LIGHT COMPETITION (social motivation — opt-in)

1. **Leaderboard** (the SHOULD from the brief): opt-in, public username + XP only. Global and—if cheap—weekly.
2. **Weekly leagues** (Duolingo's most effective competitive mechanic, optional/stretch): bucket opted-in players into small weekly cohorts ranked by XP earned that week; top players "promote." Only build if it fits cleanly on the existing `xp_events` data — do not over-engineer.
Both are strictly opt-in (Non-Negotiable: anonymous-first, privacy-light). Never expose anything beyond username + XP.

## F. THE FEEL LAYER (juice — what separates "app" from "game")

This is the polish that makes it *fun*. Apply tastefully, performance-budget intact:
- **Micro-interactions** on every meaningful action: button press states, card hovers that respond, the run button that looks "armed."
- **Number pop**: XP, streak increments, and counters animate (count-up, fly-in) rather than snapping.
- **Earn moments**: level-up and badge-earn get a brief celebratory beat — a contained glow/pulse and the reward named ("Level 3 — Kernel Engineer unlocked"). One tasteful moment, ~600ms, NOT confetti spam, NOT a library that bloats the bundle. Lightweight Lottie or CSS/SVG animation only, and only if it stays within budget.
- **Sound design (opt-in, off by default)**: distinct short cues for correct, wrong, level-up, badge-earn. A persistent, obvious mute toggle. Never autoplay before user interaction.
- **Empty/loading states with personality**: a "booting kernel…" loader instead of a blank spinner; encouraging copy in empty sectors.
- **Consistency with the existing aesthetic**: all of this uses the Section 8 tokens (amber accent, dark Jupyter/VS-Code palette, JetBrains Mono). The game feel is *energy and motion*, not a new cartoon theme. It should still look like a premium developer tool that happens to be fun — not a kids' game.

---

## DECISIONS — LOCKED & FLAGGED

1. **Game feel ≠ new visual theme.** Reuse existing design tokens. The transformation is motion, feedback, progression visibility, and sound — not a re-skin. *(Locked — protects the professional aesthetic Daniel wants.)*
2. **All rewards enforced server-side.** XP, badges, streaks, league standing computed in/behind the RPC, never trusted from the client. Anonymous users get the full feel locally (nothing to cheat). *(Locked — matches the security posture and anonymous-first rule.)*
3. **Sound off by default, opt-in, always mutable.** No autoplay. *(Locked — accessibility + trust.)*
4. **`prefers-reduced-motion` fully honored.** Every animation has a static fallback. *(Locked — accessibility is a quality gate.)*
5. **No dark patterns.** No punishing notifications, no manufactured urgency, no manipulative streak guilt. Streak-freeze token included to prevent rage-quit. *(Locked — the research explicitly ties dark patterns to burnout and churn.)*
6. **Performance budget holds.** The juice layer must not break the Section 11 budgets (workspace JS < 200KB gzipped, LCP < 2.5s). Animation via CSS/SVG/lightweight Lottie, lazy-loaded; audio assets tiny and lazy. *(Locked.)*
7. **Skill-tree/sector-map is an augmentation, not a forced replacement** — if the visual map risks the timeline, ship the enhanced list (completion counts + lock states + next-unlock flags) first and the full map as a follow-up. *(Flagged decision — Claude should report which it shipped.)*
8. **Weekly leagues are stretch.** Build only if it sits cleanly on existing data. *(Flagged.)*

---

## ACCEPTANCE CRITERIA

- Correct-solve loop: code patches, traceback→success transition, XP flies and bar fills, level-up handled, opt-in sound — all working and smooth on the existing seeds.
- Wrong-answer loop: shake, red flush, distinct failure output, gentle XP tick, rationale reveal — no shame copy.
- Persistent HUD with rank/level/XP-bar/streak/cleared-count visible across the app.
- Rank ladder screen + visual sector map (or enhanced list per decision 7) showing completion and lock states.
- Badge system: tables + server-side awarding + earn animation + trophy case on profile; starter badge set earnable and tested.
- Daily Challenge as a featured game element (verified or built) with streak + daily-goal mechanics; streak-freeze token implemented.
- Leaderboard opt-in (username + XP only); leagues only if cleanly feasible.
- `prefers-reduced-motion` and the sound mute toggle both verified. Section 11 performance budgets still pass — numbers recorded.
- `reports/PHASE_REPORT_5_6.md` written. STOP for review.

---

## PASTE-READY PROMPT FOR CLAUDE CODE

```
Read MASTER_BRIEF.md, JUPYTER_ARENA_REMAINING_WORK.md, JUPYTER_ARENA_PHASE_5_5_ENGAGEMENT.md,
and JUPYTER_ARENA_PHASE_5_6_GAME_FEEL.md in full before writing code.

This is Phase 5.6 — Make It Feel Like a Game. Same content and architecture; the job is
to make every interaction feel like playing. Use plan mode for any DB migration and present
the plan before touching anything. Apply the web-design-guidelines and frontend-design skills,
then a critique + polish pass on the result.

GUIDING PRINCIPLE: do NOT drown the app in game props. Game feel comes first from making the
CORE LOOP (read broken cell -> pick fix -> run) satisfying. Everything serves that loop.

BUILD:

1. CORE LOOP JUICE (highest priority):
   - Correct solve: buggy line animates red->clean patch (~300ms); Out[1] red traceback
     collapses and a green success block expands (transition, not a cut); "+10 XP" flies from
     the run button to the XP bar which fills smoothly; level-up flips the badge with a pulse;
     opt-in success sound; "Flawless +5" chip on a clean first-try solve.
   - Wrong solve: cell shakes (~250ms), option card flushes red, the existing wrong-path failure
     log renders, XP ticks down gently (mastery framing not punishment), rationale reveals,
     no shame copy.
   - prefers-reduced-motion: every animation has a static fallback. Sound is OPT-IN, off by
     default, with a persistent obvious mute toggle, never autoplay.

2. VISIBLE PROGRESSION:
   - Persistent player HUD in the header: rank title + level badge, live XP bar with
     current/next thresholds, streak flame + day count, missions-cleared counter.
   - Rank ladder screen: Compile Rookie -> Traceback Hunter -> Kernel Engineer -> Overlord
     Compiler as a visual track with current position and next-rank unlocks previewed.
   - Sector map / skill tree: visual map of the 4 sectors with completion counts and locked vs
     unlocked mission nodes that light up as cleared; next unlock flagged. If this risks the
     timeline, ship an ENHANCED LIST (completion counts + lock states + next-unlock flags) and
     report which you shipped.
   - Completion rings/bars per sector, per difficulty, overall.

3. ACHIEVEMENTS:
   - New badges + user_badges tables. Award badges SERVER-SIDE (in/behind submit_attempt) so
     they can't be faked; anonymous users earn locally. Earn animation (card flip/shine).
   - Starter set, all earnable and tested: First Blood, Flawless Five, Sector Sweep (x4),
     Traceback Hunter (25 solves), Polyglot (all 4 languages), No Hints Needed (Hard, 0 hints),
     streak badges (3/7/30), Daily Devoted (10 dailies).
   - Trophy case on profile/portfolio showing earned + silhouetted locked badges with criteria.

4. STREAKS & DAILIES:
   - Daily Challenge as a first-class feature (VERIFY it exists; build if missing: featured
     mission per UTC day, small bonus, stable URL, solved-today state, deterministic-per-date test).
   - Streak flame (current + longest), gentle loss-aversion nudge (NO manipulative guilt), and a
     streak-freeze token earned occasionally so one missed day doesn't reset a long streak.
   - Small daily goal with a completion ring.

5. LIGHT COMPETITION (opt-in, privacy-light, username + XP ONLY):
   - Leaderboard (global; weekly if cheap). Weekly leagues are STRETCH — build only if it sits
     cleanly on existing xp_events data, otherwise skip and note it.

6. FEEL LAYER: micro-interactions on every meaningful action; count-up/fly-in number animations;
   contained level-up and badge-earn moments (~600ms glow/pulse, reward named) using CSS/SVG or
   lightweight lazy-loaded Lottie — NO confetti spam, NO bundle-bloating libraries; opt-in sound
   cues for correct/wrong/level-up/badge; "booting kernel..." style loaders; personality in empty
   states.

LOCKED CONSTRAINTS: reuse Section 8 design tokens — game feel is motion/feedback/progression, NOT a
new cartoon theme; it must still look like a premium developer tool that happens to be fun. Preserve
every Non-Negotiable in Section 2 (anonymous-first, content-as-data, zero server execution, SEO-visible
content). All rewards enforced server-side. No dark patterns. Section 11 performance budgets must still
pass — record the numbers. No placeholders, no fabricated data. Small labeled commits.

ACCEPTANCE: both loops working and smooth on existing seeds; persistent HUD; rank ladder + sector map
(or enhanced list, reported); badge system with server-side awarding + trophy case, tested; Daily
Challenge + streak + streak-freeze + daily goal; opt-in leaderboard; prefers-reduced-motion and sound
mute both verified; performance budgets pass with numbers recorded. Write reports/PHASE_REPORT_5_6.md
and STOP for review.

DO NOT TOUCH: Phase 6 hardening, Phase 7 launch. Note that fullstack-004..015 and db-003..015 (25
challenges) still need authoring per Phase 5 — flag as a remaining todo, do not lose it, but it is not
this phase's work.
```

*End of Phase 5.6 spec.*
