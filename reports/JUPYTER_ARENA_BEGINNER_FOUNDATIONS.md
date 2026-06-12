# JUPYTER ARENA — BEGINNER FOUNDATIONS PACK
## Python Fundamentals · Graph Challenges · Learn-First Layer · Placement Quiz

**Owner:** Daniel · **Builds on:** `MASTER_BRIEF.md`, `JUPYTER_ARENA_DATA_ANALYST_SECTOR.md` (ungated-sector mechanism)
**Audience assumption (locked):** the typical visitor has written little or no code without AI help, may not know what a variable is, and may be shaky on basic arithmetic. Design for that person. Experienced users get routed past the basics by the placement quiz — nobody is forced through content below their level.

---

## PART 1 — NEW SECTOR: PYTHON FUNDAMENTALS (`py`) — THE TRUE FIRST STEP

Ungated (reuses the `sectors.is_gated = false` mechanism from the Data Analyst spec), **position 0** — the first thing a brand-new visitor sees. Data Analyst moves to position 1. Icon: lucide `baby` is too cute — use `blocks` or `graduation-cap`.

XP and streaks still apply (rewards on, locks off). Difficulty labels informational only.

### Catalog — 15 challenges (12 easy / 3 medium), language: python

| # | Diff | Concept | The shipped beginner bug | The correct fix |
|---|---|---|---|---|
| py-001 | easy | Printing text | Unterminated string — missing closing quote → `SyntaxError` | Close the quotes; strings need matching quotes |
| py-002 | easy | Variables | Using a variable that was never defined (misspelled `totl`) → `NameError` | Define it / spell it the same way everywhere |
| py-003 | easy | Arithmetic order | `2 + 3 * 4` expected to be 20, prints 14 | Parentheses: `(2 + 3) * 4` — multiplication runs first |
| py-004 | easy | Division | Used `//` expecting 3.5, got 3 | `/` is real division, `//` drops the remainder |
| py-005 | easy | Text + numbers | `"Age: " + 25` → `TypeError` | `f"Age: {age}"` or `str(25)` — text and numbers don't add |
| py-006 | easy | Input is text | `input()` result used in math → `"5" * 2` gives `"55"` | `int(input(...))` — convert before calculating |
| py-007 | easy | `=` vs `==` | `if score = 100:` → `SyntaxError` | `=` stores, `==` compares |
| py-008 | easy | Indentation | Body of an `if` not indented → `IndentationError` | Indent the block; Python reads structure from spacing |
| py-009 | easy | Lists start at 0 | `items[3]` on a 3-item list → `IndexError` | First item is `[0]`, last is `[len-1]` |
| py-010 | easy | Loops & range | `range(1, 5)` misses the 5 — off-by-one | `range(1, 6)` — the end value is not included |
| py-011 | easy | Dictionaries | `user["Name"]` → `KeyError` (real key is `"name"`) | Exact key (or `.get()` with a default) |
| py-012 | easy | return vs print | Function prints the answer; caller stores `None` | `return` the value; printing only displays it |
| py-013 | medium | While loops | Counter never incremented → loop never ends | Move the loop forward each pass |
| py-014 | medium | Comparing types | `if score > "50":` → `TypeError` | Convert first — numbers compare with numbers |
| py-015 | medium | Building a total | `total = 0` placed *inside* the loop — sum always resets | Initialize the accumulator before the loop |

### Tutorial rules for this sector (stricter than Data Analyst)
Written for someone who has **never programmed**: explain what a variable / string / list *is* before using the word; one tiny worked example with its exact output; a "common beginner mistakes" list; a closing "you just learned…" recap line. Warm, zero jargon, short sentences. 2 YouTube **search** links each. Every tutorial teaches exactly its mission's concept.

---

## PART 2 — GRAPH CHALLENGES (matplotlib) — "WHAT'S WRONG WITH THIS CHART?"

Extends the **Data Analyst** sector with a visualization block: `da-016` → `da-025`. The user sees the chart (and usually the code), and must identify what failed or what's misleading.

### How charts work without breaking the architecture (locked)
No server execution and no fake charts. Figures are **pre-rendered at authoring time by actually running the authored matplotlib code**:
- New script `scripts/generate_figures.py` (headless `Agg` backend, pinned style + seed) executes each viz challenge's plotting code and writes **SVG** to `public/content-assets/{challenge-id}/broken.svg` and `fixed.svg` (plus per-option figures where a wrong fix produces a visibly different chart).
- `pnpm content:figures` regenerates; CI fails if committed figures are stale (hash check). This keeps Non-Negotiable #4 — the chart on screen is genuinely what the code produces.
- Schema additions (Zod + content + DB migration), all **optional** so existing challenges are untouched: `figures: { broken, fixed, altBroken, altFixed }` on the challenge, `resultFigure` + `resultFigureAlt` on options. The output cell renders the figure above the text log when present.
- **Alt text is mandatory and substantive** (a real description of what the chart shows) — accessibility, and it doubles as extra learning detail.

### Catalog — 10 challenges (4 easy / 5 medium / 1 hard), language: python

| # | Diff | Concept | What the user sees / identifies | The correct fix |
|---|---|---|---|---|
| da-016 | easy | Showing a plot | Script runs, no chart appears — `plt.show()` missing | Plot, then `plt.show()` |
| da-017 | easy | Labels & title | A naked chart nobody can read | `xlabel` / `ylabel` / `title` |
| da-018 | easy | Plotting the wrong column | "Revenue" chart whose values are obviously quantities | Plot the intended column |
| da-019 | easy | Chart-type choice | Line chart across city names implies a fake trend | Bar chart for categories |
| da-020 | medium | Truncated axis (chart literacy) | Bars starting at 95 make a 2-point gap look giant — *what's misleading?* | Start the y-axis at 0 / honest scale |
| da-021 | medium | Unsorted bars | Top-categories chart in random order — unreadable | Sort values before plotting |
| da-022 | medium | Overplotting | 50k-point scatter is a solid blob | Alpha/size (or hexbin) |
| da-023 | medium | Pie overload | 12-slice pie — indistinguishable | Bar chart; group small slices into "Other" |
| da-024 | medium | Legend mismatch | Two lines with swapped year labels — spot it from the data | Correct label-to-series mapping |
| da-025 | hard | Misleading framing | Cherry-picked date range manufactures "growth" | Full range / honest axes |

These teach two skills at once: fixing matplotlib code **and reading charts critically** — a core analyst skill.

---

## PART 3 — THE LEARN-FIRST DETAIL LAYER ("I don't feel like I learn")

For the beginner sectors (`py`, `da`), the flow becomes **Learn → Try → Understand**, with maximum detail available at every step:

1. **Concept card first.** Opening a mission in a beginner sector shows a short concept card (4–6 lines: what you're about to use, in plain words) with a "read the full lesson" link — *before* the notebook. One click to proceed. Gated sectors keep the current straight-to-notebook flow.
2. **"What does this code do?" toggle.** New optional schema field `lineNotes: [{ line, noteMd }]` — plain-language, line-by-line annotations of the challenge code, shown on demand. **Required for every `py` and `da` challenge**, optional elsewhere. This is the single biggest "details for the user" lever.
3. **Richer aftermath.** Post-solve keeps the existing explanation + recruiter review and adds a one-line **"Key takeaway"** chip (new optional `takeaway` field) the user can carry forward.
4. **No removal of anything** — advanced users can skip the card instantly; existing sectors are unchanged.

---

## PART 4 — PLACEMENT QUIZ ("we don't know the user — match the level for him")

### Where it lives (locked)
- A **skippable** step in the signup flow, **and** a "Find my starting point" entry for anonymous users (landing + first visit nudge). It never blocks anything — anonymous-first stands, and forced quizzes kill signups.

### Part A — background (5 quick questions, all optional, one tap each)
1. Have you written code without AI help? (never / a little / comfortably)
2. Python? (never touched it / know some basics / comfortable)
3. SQL or data tools? (never / a little / comfortable)
4. Your path so far: (just starting / self-taught / bootcamp / CS degree)
5. Why are you here? (get a job / school / interview prep / curiosity)

### Part B — mini skill check (5 real questions, authored as data: `content/placement/questions.json`)
Same MCQ format as challenges, 30 seconds each: (1) arithmetic order — what is `2 + 3 * 4`; (2) what does `"ab" * 2` print; (3) which line *stores* a value, `=` or `==`; (4) what is `items[0]` in a list; (5) spot the bug in a 3-line snippet (missing quote). Honest range: from arithmetic up.

### Routing (deterministic, tested)
| Signals | Recommended start | Placement XP |
|---|---|---|
| Mostly "never" **or** skill ≤ 2/5 | **Python Fundamentals** | 0 |
| Mixed background **or** skill 3–4/5 | **Data Analyst** | +50 (one-time) |
| Comfortable across A **and** 5/5 on B | Main sectors | +100 (one-time, = Level 3 → medium tier open) |

- Placement XP is a **one-time, capped, server-granted** `xp_events` entry (new reason `'placement'`, added to the check constraint — migration). It lets experienced users skip the basics **through the existing XP system** rather than bypassing gates. The quiz can never unlock beyond Level 3.
- Anonymous users: same flow, result stored locally, boost honored once on signup via the existing merge (recomputed server-side; one placement event per account, ever).
- **Privacy (locked):** store only the *derived* result — `profiles.experience_level` (enum: `new` / `some` / `comfortable`) and `placement_taken_at`. Raw questionnaire answers (degree, goals) are **not persisted**; they exist only to compute the recommendation. Minimal data, nothing sensitive retained.

---

## DECISIONS — LOCKED & FLAGGED (summary)
1. Two ungated beginner sectors (`py` position 0, `da` position 1); gated sectors unchanged. *(Locked)*
2. Figures are real matplotlib output, pre-rendered at authoring time, SVG, CI-verified fresh, mandatory alt text. No fake charts, no runtime rendering. *(Locked)*
3. Learn-first flow + mandatory `lineNotes` in beginner sectors only; everything optional in the schema so existing content is untouched. *(Locked)*
4. Quiz is skippable everywhere; placement grants capped one-time XP (≤ Level 3) instead of bypassing the gate system. *(Flagged — cap is tunable, but bypassing gates outright would undermine the progression you built.)*
5. Only derived placement data is stored; raw answers are discarded. *(Locked — privacy-light.)*
6. Sequencing: Python Fundamentals + learn-first layer ship first (that's the "I don't learn anything" fix), then the quiz, then the graph block (it carries the most new machinery). *(Flagged)*

---

## ACCEPTANCE CRITERIA
- `py` sector live at position 0, ungated (proven by the same accept/reject RPC test pattern as DA), all 15 challenges validator-green with from-zero tutorials and `lineNotes`.
- Figure pipeline: `content:figures` generates committed SVGs from the actual code; CI stale-check works; output cell renders figures with alt text; `da-016..025` validator-green (4/5/1 mix).
- Learn-first: concept card + lineNotes toggle + takeaway chip working in `py`/`da`; gated sectors unaffected.
- Quiz: skippable in signup + anonymous entry point; routing table implemented exactly and unit-tested; placement XP one-time/capped/server-side (test: cannot be claimed twice, cannot exceed 100); only derived fields persisted.
- `pnpm check` + `pnpm e2e` green; performance budgets hold (SVGs lazy-loaded; the figure assets must not bloat the workspace route). `reports/PHASE_REPORT_FOUNDATIONS.md` written. STOP for review.

---

## PASTE-READY PROMPT FOR CLAUDE CODE

```
Read MASTER_BRIEF.md (Section 6 authoring rules), JUPYTER_ARENA_DATA_ANALYST_SECTOR.md
(ungated-sector mechanism), and JUPYTER_ARENA_BEGINNER_FOUNDATIONS.md in full before writing code.

This is the Beginner Foundations pack. Audience assumption: the visitor may have never written
code without AI and may be shaky on basic arithmetic — design every word for that person, while
the placement quiz routes experienced users past the basics. Use plan mode for all DB migrations
and present the plan before touching anything.

BUILD, IN THIS ORDER:

1. PYTHON FUNDAMENTALS SECTOR (id "py", ungated, position 0; Data Analyst moves to position 1):
   - Reuse sectors.is_gated=false. XP/streaks still apply. Author py-001..015 exactly per the
     catalog table (12 easy / 3 medium) with full Section 6 completeness (3 options with
     wrong-path result logs, 2 hints, explanation, recruiter review).
   - Tutorials at true zero level: define variable/string/list before using the word, one worked
     example with exact output, common-mistakes list, "you just learned..." recap, warm tone,
     2 YouTube SEARCH links. Batches of 5, validator green between batches.

2. LEARN-FIRST LAYER (py + da sectors only; everything optional in schema so existing content is
   untouched):
   - Concept card shown before the notebook (4-6 plain-language lines + link to full lesson).
   - New optional lineNotes [{line, noteMd}] field + a "What does this code do?" toggle rendering
     plain-language line-by-line notes. REQUIRED for every py and da challenge.
   - Optional "takeaway" field rendered as a key-takeaway chip post-solve.

3. PLACEMENT QUIZ:
   - Skippable step in signup + "Find my starting point" entry for anonymous users. Never blocks.
   - Part A: 5 optional background questions; Part B: 5 real MCQs from
     content/placement/questions.json (arithmetic order, "ab"*2, = vs ==, items[0], spot-the-bug).
   - Routing exactly per the spec table -> recommended start sector + one-time capped placement XP
     (0 / 50 / 100) granted SERVER-SIDE via a new xp_events reason 'placement' (migration extends
     the check constraint). Test: cannot be claimed twice, cannot exceed 100. Anonymous: result
     local, boost honored once on signup through the existing merge recompute.
   - PRIVACY: persist only profiles.experience_level (new/some/comfortable) + placement_taken_at.
     Raw answers are never stored.

4. GRAPH CHALLENGES (da-016..025 per the catalog, 4 easy / 5 medium / 1 hard):
   - Schema additions (Zod + DB, all optional): figures {broken, fixed, altBroken, altFixed} on
     challenges; resultFigure + resultFigureAlt on options. Output cell renders the figure above
     the text log when present. Alt text mandatory and substantive.
   - scripts/generate_figures.py: headless Agg, pinned style + seed, ACTUALLY RUNS each viz
     challenge's plotting code and writes SVGs to public/content-assets/{id}/. Add pnpm
     content:figures and a CI staleness check (hash compare). The chart shown must be genuinely
     what the code produces — no hand-drawn or fake charts, ever.
   - SVGs lazy-loaded; workspace route budget must hold.

CONSTRAINTS: preserve every Non-Negotiable (anonymous-first, content-as-data, zero server/runtime
execution, SEO-visible content, no fabricated references). Difficulty labels in ungated sectors
are informational only. No placeholders. Small labeled commits.

ACCEPTANCE: py sector ungated and first (accept/reject RPC test passes); all 25 new challenges
(py-001..015, da-016..025) validator-green; learn-first card + lineNotes + takeaway live in py/da
only; quiz skippable, routing unit-tested, placement XP one-time/capped/server-side, only derived
fields persisted; figure pipeline generates committed SVGs with CI staleness check; pnpm check +
pnpm e2e green; budgets hold. Write reports/PHASE_REPORT_FOUNDATIONS.md and STOP for review.

REMAINING TODO (do not lose, not this task): fullstack-004..015 and db-003..015 (25 challenges);
badges (5.6b); leaderboard (5.6c); Phase 6 hardening; Phase 7 launch.
```

*End of Beginner Foundations spec.*
