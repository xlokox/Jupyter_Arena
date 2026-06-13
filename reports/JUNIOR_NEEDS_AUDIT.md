# Jupyter Arena — Junior Foundations Audit
**Date:** 2026-06-15 · **Owner:** Daniel · **Status:** Live audit, sprint in flight

---

## TL;DR (the 4-line answer)

- **What shipped:** **115 challenges** across 6 sectors (py 30 · da 25 · ml 15 · dl 15 ·
  fullstack 15 · db 15) on a strong infra base — auth, badges, learn-first layer, figure
  pipeline, reasoning track (5 missions), CSP-safe inline SVG, all green on
  `pnpm check` / `test:db` / build under 200 KB.
- **What's missing for a junior:** Every sector has 6–10 employability-critical topics
  that are not covered (file I/O / JSON / regex in py; window functions / CTEs / reshape
  in da; k-fold CV / GridSearch / encoding choice in ml; `model.eval()` / scheduler /
  AMP in dl; forms / a11y / error boundaries / testing in fullstack; schema design /
  isolation / EXPLAIN in db). And the platform has **no in-context glossary** — every
  non-beginner sector throws jargon ("leakage", "BN", "hydration", "p-value") with no
  inline definition.
- **What this sprint ships:** This audit document, a glossary mechanism (migration 019 +
  schema field + small disclosure UI + 40 seed entries), **30 new gap-fill missions**
  (5 per sector), and a phase report. Existing content untouched.
- **What's deferred (with reason):** Placement quiz, leaderboard, Pyodide execution,
  per-user `/portfolio/[username]` route, CI staleness gate on figures, badge-branch
  merge. Each gets a one-paragraph treatment in §5 — they're real work, each its own
  sprint, and the audit makes them visible so they can be sequenced honestly.

---

## 1. Current state

### 1.1 Catalog (post 2026-06-13 audit; pre this sprint)

| Sector | Count | Easy | Medium | Hard | Very Hard | Track split |
|---|---:|---:|---:|---:|---:|---|
| **py** | 30 | 15 | 10 | 5 | 0 | 30 debugging · 0 reasoning |
| **da** | 25 | 17 | 7 | 1 | 0 | 20 debugging · 5 reasoning |
| **ml** | 15 | 5 | 5 | 3 | 2 | 15 debugging · 0 reasoning |
| **dl** | 15 | 4 | 5 | 3 | 3 | 15 debugging · 0 reasoning |
| **fullstack** | 15 | 5 | 7 | 3 | 0 | 15 debugging · 0 reasoning |
| **db** | 15 | 5 | 6 | 3 | 1 | 15 debugging · 0 reasoning |
| **Total** | **115** | **51** | **40** | **18** | **6** | **110 / 5** |

**Reads at a glance:**
- **ml/dl have the cleanest pedagogical spread** — covering all 4 difficulty tiers with
  meaningful very_hard content.
- **da is top-heavy (17 easy, 1 hard)** — the on-ramp is over-served; the senior content
  isn't there yet.
- **py and fullstack have no very_hard** — they cap out at "tricky but known," which is
  the right ceiling for these sectors right now.
- **Reasoning track is only on da (5/25 = 20%)** — the mechanism is built, the content is
  not yet meaningful.

### 1.2 Infrastructure (what's actually built)

| Layer | Status | Note |
|---|---|---|
| Email-OTP auth + local→account merge | ✅ Built | One bug fixed 2026-06-12 (rehydrate on standalone pages) |
| Level gating + RLS deny-by-default | ✅ Built | Ungated-sectors mechanism via `sectors.is_gated` |
| `submit_attempt` RPC (server XP authority) | ✅ Built | 74/74 test:db green |
| Daily challenge (deterministic UTC pick) | ✅ Built | `/daily` route, force-dynamic |
| Achievement badges (5.6b) | ✅ Built | Merged in; trophy case, level-up animation |
| Learn-first layer (py + da) | ✅ Built | conceptCard + lineNotes + takeaway, validator-enforced |
| Figure pipeline (matplotlib-look SVGs) | ✅ Built | TS `figure-builder.ts` (deviation from brief's Python — documented) |
| Reasoning track (filter + badge + 5 missions) | ✅ Built | da-036..040 ships; mechanism is sector-agnostic |
| Mobile drawer + responsive layout | ✅ Built | Code cells use horizontal scroll on phone (note below) |
| Accessibility (ARIA / focus / keyboard) | ✅ Built | 1/2/3/Enter/N/Esc all wired; axe-clean per e2e |
| Placement quiz | ❌ Missing | Notice on `/signup` only — "isn't live yet" |
| Leaderboard (5.6c) | ❌ Missing | Tables exist (`public_profiles`); no route, no view |
| Pyodide / browser code execution | ❌ Missing | Brief v1.5 feature; scripted simulation everywhere |
| Public `/portfolio/[username]` | ⚠️ Partial | Own `/portfolio` exists; no username route |
| OG card on portfolio | ⚠️ Partial | Per-challenge OG built; portfolio OG missing |
| Glossary / in-context term definitions | ❌ Missing | **This sprint ships it (§4)** |
| CI staleness gate on figures | ❌ Missing | Nice-to-have, not blocking juniors |

### 1.3 What's clean

The product's strongest assets for a junior, as-is today:
- **Hints are properly scaffolded** — hint 1 names the concept, hint 2 names the location.
- **Wrong-answer rationale teaches**, not shames. Every wrong option's rationale names
  the specific failure mode.
- **After-solve celebration** — XP toast, level-up animation, badge unlock, "Flawless"
  chip on first-try solves. Good dopamine.
- **Recruiter Review** card on every challenge gives the senior-engineer voice that
  matters for a junior building confidence.
- **Mobile + accessibility** ship clean. Axe-clean per e2e, 44px touch targets,
  keyboard nav.

---

## 2. Content gaps per sector

Each section lists **6–10 employability-critical topics that aren't in the catalog yet**,
with a one-line rationale per topic and a suggested mission framing.

### 2.1 Python Fundamentals (py) — 30 shipped, missing the day-1 tools

| Gap | Why it matters for a junior | Suggested mission framing |
|---|---|---|
| **File I/O / `with open(...)`** | Every business script reads or writes a file. | Long-running script leaks file descriptors → context manager. **Ships this sprint (py-031)** |
| **JSON parsing** | 90% of APIs and configs are JSON. | Hand-built JSON sometimes single-quoted → `json.loads` vs `ast.literal_eval`. **Ships (py-032)** |
| **Regex** | Data cleaning, log parsing, validation. | Cloudflare 2019 outage in miniature (greedy `.*`). **Ships (py-033)** |
| **List/dict comprehensions** | The 30-line for/append idiom is one line. | Hand-rolled accumulator vs comprehension. **Ships (py-034)** |
| **Generators / `yield`** | Streaming large data without OOM. | Read a 50GB log line-by-line. **Ships (py-035)** |
| Specific-except patterns | Bare except has been shown (py-030); narrow ones haven't. | `except (ValueError, TypeError) as e` + `raise from`. Future. |
| Virtual envs / pip | Every junior gets stuck here. | Two reproducibility scenarios. Future. |
| Multi-file modules / imports | `sys.path`, circular imports. | Real-world structure for a small project. Future. |
| Context managers beyond `open` | `contextlib`, custom `__enter__/__exit__`. | Database connection manager. Future. |
| Type hints + mypy | Modern Python expects them. | Catching a wrong type via mypy vs runtime. Future. |

**Pedagogy note:** py covers the *idioms* well (mutability, scope, equality) but the
*tools* a junior reaches for every day are missing. **This sprint fixes that.**

### 2.2 Data Analyst (da) — 25 shipped, missing the senior SQL/pandas tools

| Gap | Why it matters | Mission framing |
|---|---|---|
| **Inner vs left/outer join** | "Inner join silently dropped 30% of orders" is a recurring real-world bug. | Sales report missing customers. **Ships (da-046)** |
| **pivot / melt (reshape)** | Reports want months as columns; data has them as rows. | `df.pivot_table` / `df.melt`. **Ships (da-047)** |
| **SQL window functions** | Dedup-by-most-recent, running totals, percentile ranks. | `ROW_NUMBER() OVER (PARTITION BY ...)`. **Ships (da-048)** |
| **SQL CTEs (`WITH`)** | Readability for any multi-step aggregate. | Refactor a nested subquery into a CTE. **Ships (da-049)** |
| **EXPLAIN ANALYZE** | The single most underused tool by juniors. | A 30s query reveals a seq scan. **Ships (da-050)** |
| pandas datetime resample/groupby | Most analyst work is time-bucketed. | Daily revenue from a transaction log. Future. |
| Multi-index / hierarchical | Real pandas at scale. | A 2-level groupby. Future. |
| Merge_asof / fuzzy joins | "Last known price per timestamp." | Stock-data joined to news. Future. |
| Data quality profiling | Systematic checks, not ad-hoc. | `df.describe()` + null-rate + duplicate scan as a habit. Future. |
| Statistical operations | Percentiles, correlations. | Skewed pricing distribution. Future. |

### 2.3 Machine Learning (ml) — 15 shipped, missing the everyday-judgment tools

| Gap | Why it matters | Mission framing |
|---|---|---|
| **Baseline reasoning (always check the dummy)** | The #1 ML reasoning failure for juniors. "92% acc, 91% baseline." | `DummyClassifier` is the only legitimate first model. **Ships (ml-016)** |
| **k-fold CV (`cross_val_score`)** | One split is one point estimate; CV is a distribution. | Train/test split shows great results, k-fold shows variance. **Ships (ml-017)** |
| **GridSearchCV** | Hyperparam tuning the right way. | `cv=StratifiedKFold` matters; naive grid finds a worse model than defaults. **Ships (ml-018)** |
| **Categorical encoding choice** | One-hot blows feature count from 50 to 50,000. | One-hot vs ordinal vs target encoding by cardinality. **Ships (ml-019)** |
| **ROC vs PR for imbalanced** | ROC looks great when there are no positives. | Fraud detection: PR-AUC is the honest metric. **Ships (ml-020)** |
| Feature engineering / domain transforms | The actual differentiator for shipping models. | Future. |
| Feature importance & SHAP | Stakeholder communication. | Future. |
| Learning curves / bias-variance | Visual diagnosis. | Future. |
| Ensemble methods (RF / xgboost) | Default production move for many problems. | Future. |
| Calibration | Probabilities you can trust. | Future. |

### 2.4 Deep Learning (dl) — 15 shipped, missing the production-training rails

| Gap | Why it matters | Mission framing |
|---|---|---|
| **`model.eval()` / `model.train()` modes** | The single most-blogged DL bug. Dropout + BN behave differently. | "Val loss higher than train" → forgot `model.eval()`. **Ships (dl-016)** |
| **LR schedule (cosine / step)** | Loss plateaus when LR never decays. | Long flat plateau then step. **Ships (dl-017)** |
| **Checkpointing (`save_state_dict`)** | One crash at epoch 95 loses the best model. | Best-val tracking + resume. **Ships (dl-018)** |
| **AMP (`torch.cuda.amp.autocast`)** | The canonical mixed-precision fix; FP16 underflows. | GradScaler pattern. **Ships (dl-019)** |
| **Activation choice (dying ReLU)** | Real production failure: 30% of neurons dead. | LeakyReLU / GELU / GLU choice by problem. **Ships (dl-020)** |
| Optimizers beyond SGD | Adam, AdamW; juniors pick randomly. | Future. |
| Basic CNN/RNN/Transformer | Architectural literacy. | Future. |
| Distributed training (DDP) | Multi-GPU patterns. | Future. |
| Inference optimization | Quantization, TorchScript. | Future. |
| Custom losses & metrics | Domain-specific objectives. | Future. |

### 2.5 Full Stack (fullstack) — 15 shipped, missing the React-prod basics

| Gap | Why it matters | Mission framing |
|---|---|---|
| **Form validation pattern** | Every CRUD app needs it. | Controlled inputs + HTML5 + zod parse on submit. **Ships (fullstack-016)** |
| **Error boundaries** | React 16+ — one broken component used to crash the app. | A render error caught at a sensible boundary. **Ships (fullstack-017)** |
| **Modal focus-trap + a11y** | Keyboard-only users can't escape a poorly-built modal. | `aria-modal`, focus trap, restore-on-close. **Ships (fullstack-018)** |
| **React Testing Library** | "I shipped this without a test." | user-event over implementation details. **Ships (fullstack-019)** |
| **Retry + exponential backoff** | An API timeout retried 5×/sec until prod fell over. | AWS exponential-backoff-with-jitter algorithm. **Ships (fullstack-020)** |
| State libs (Zustand / Jotai / Redux) | Context shown, full state mgmt not. | Future. |
| Server components (Next.js RSC) | Modern React story. | Future. |
| TypeScript in React | Most teams use TS. | Future. |
| Performance profiling (useMemo / useCallback) | N+1 renders. | Future. |
| Progressive enhancement | Graceful degradation. | Future. |

### 2.6 Databases (db) — 15 shipped, missing the foundational design tools

| Gap | Why it matters | Mission framing |
|---|---|---|
| **3NF / schema design** | The denormalised orders table with `user_email` in 12 places. | Refactor to FK + normal form. **Ships (db-016)** |
| **Transaction isolation levels** | Two clients book the same seat under Read Committed. | Read Committed vs Repeatable Read vs Serializable. **Ships (db-017)** |
| **EXPLAIN ANALYZE** | The slow query is a seq scan on 50M rows. | Reading the plan, choosing an index. **Ships (db-018)** |
| **Recursive CTE** | Org-chart query is a nightmare without `WITH RECURSIVE`. | Manager hierarchy traversal. **Ships (db-019)** |
| **Cascade rules / soft delete** | "Deleting a user took out 1.2M orders" — the FK was `ON DELETE CASCADE`. | When cascade is right vs `ON DELETE RESTRICT`. **Ships (db-020)** |
| Stored procedures / triggers | Procedural SQL still in production. | Future. |
| Backups & PITR | Operational essentials. | Future. |
| Replication / failover | Leader/follower. | Future. |
| JSON operators (`->`, `->>`) | Modern Postgres. | Future. |
| Partitioning / sharding | At-scale concepts. | Future. |

---

## 3. Junior-UX gaps

The 15 items from the UX audit, with severity and status. The **MISSING + HIGH** items
are this sprint's targets; the **MISSING + MEDIUM** items go in the deferred queue.

| # | Item | Status | Severity | Note |
|---|---|---|---|---|
| 1 | Onboarding flow / first-mission tour | Partial | Medium | Empty-state CTA exists; no guided tour |
| 2 | **In-context glossary for jargon** | **Missing** | **High** | **This sprint ships it (§4)** |
| 3 | Prerequisites / learning-path graph | Missing | Medium | Sidebar is sector+difficulty+track; no concept graph |
| 4 | Hint quality (concept → location) | Built | — | Properly scaffolded across all 115 |
| 5 | After-solve celebration | Built | — | XP toast, badge unlock, level-up |
| 6 | **Executable code (Pyodide)** | **Missing** | **High** | Brief v1.5; large work — deferred with design |
| 7 | Spaced repetition / review mode | Missing | Medium | Solved missions are one-and-done |
| 8 | Cross-sector concept search | Partial | Low | Title + tags work; no concept graph |
| 9 | Mobile code-cell readability | Partial | Medium | Long SQL forces horizontal scroll on phone |
| 10 | Accessibility (a11y) | Built | — | Axe-clean, ARIA, keyboard |
| 11 | Career arc / "what's next" after 100 solves | Missing | Medium | Portfolio is stats-only |
| 12 | Curated tutorial videos | Weak | Medium | Search-query URLs only; no starred picks |
| 13 | Progress visibility / weakness tracking | Missing | Medium | Sidebar shows ✓/✗ but not "your weak concepts" |
| 14 | Anxiety / shame handling on wrong | Built | — | Neutral tone, "Not the fix — read why below" |
| 15 | Portfolio quality / resume readiness | Partial | Medium | Stats only; no code samples, no verify link, no public username route |

**This sprint addresses #2 (high)**. The other High item (#6 Pyodide) is sized and
deferred in §5. Medium items are queued.

---

## 4. Glossary mechanism (this sprint's UX shipout)

**The cheapest, highest-ROI junior-UX win.** Today, a learner sees "leakage" in an ml
mission or "hydration" in a fullstack mission and has nowhere to look it up without
leaving the product. The glossary mechanism is small, additive, and immediately
useful.

**Shape:**
- `glossary?: Array<{ term: string, definitionMd: string }>` on the challenge (≤8 entries).
- Migration 019 adds `glossary jsonb` (nullable). Same pattern as 016/017.
- A small `<GlossaryDisclosure>` component renders a native `<details>` next to the
  briefing when the field is present.
- Definitions are written **in the same voice as the recruiter review** — friendly,
  precise, one paragraph max, no "you" lectures.
- ~40 seed entries embedded in the missions this sprint authors, covering: `leakage`,
  `baseline`, `k-fold CV`, `GridSearchCV`, `one-hot encoding`, `target encoding`,
  `ROC-AUC`, `PR-AUC`, `imbalanced`, `dropout`, `batch normalization`, `eval mode`,
  `LR schedule`, `AMP`, `dying ReLU`, `error boundary`, `focus trap`, `exponential
  backoff`, `3NF`, `transaction isolation`, `Read Committed`, `Serializable`,
  `EXPLAIN ANALYZE`, `seq scan`, `CTE`, `recursive CTE`, `ON DELETE CASCADE`, `context
  manager`, `generator`, `comprehension`, `regex anchor`, `greedy quantifier`, `JSON`,
  `pivot`, `melt`, `window function`, `ROW_NUMBER`, `partition by`, `inner join`,
  `left join`.

**Cost:** ~0.5 KB to the `/app` bundle, no new deps, no breaking change.

---

## 5. Roadmap reconciliation

What the brief and phase reports SPECIFY vs what's actually BUILT, with the next steps
that would help juniors most. All five remaining items are real work; the audit names
them so they can be sequenced honestly.

| Item | Spec | Built? | Priority for juniors | Sized as |
|---|---|---|---|---|
| **Placement quiz** | MUST | ❌ Notice only | High | 1.5 days (route + 10 Qs + migration for 'placement' xp reason + tests) |
| **Leaderboard (5.6c)** | SHOULD | ❌ Tables exist | Medium | 1 day (view + route + opt-in toggle; bundle separate from `/app`) |
| **Pyodide execution** | SHOULD v1.5 | ❌ | High | 4–5 days (bundle, sandbox, loading UX, security; py + da sectors only — dl stays scripted per spec) |
| **Public `/portfolio/[username]`** | MUST | ⚠️ Own only | Medium | 0.5 day + design call (do we ship code samples? OG card? verify-link?) |
| **Per-portfolio OG card** | SHOULD | ❌ | Low | 0.5 day |
| **CI staleness gate on figures** | SHOULD | ❌ | Low | 2 hours (hash check in workflow) |
| **AI-Security (`aisec`) sector** | v2 only | ❌ (correct) | n/a | Out of scope for v1 |
| **CI `content:validate` gate** | MUST | ✅ | — | Confirmed live |
| **60-challenge launch catalog** | MUST | ✅ (exceeded — 115) | — | 4 brief-seed missions present + 55 additions |
| **Auth + merge + gating** | MUST | ✅ | — | Includes the 2026-06-12 rehydrate fix |
| **Badges (5.6b)** | SHOULD | ✅ | — | Merged in |
| **Figure pipeline** | MUST v1.5 | ✅ TS substitute | — | Documented deviation from the brief's Python `generate_figures.py` |
| **Learn-first layer (py/da)** | SHOULD | ✅ | — | Validator-enforced |
| **Reasoning track** | New scope | ⚠️ 5/35 | Medium | 30 more authored content (paused at slice 3 of 11) |

### 5.1 The three biggest deferrals, in honest detail

#### Placement quiz (HIGH priority for juniors)
**What it is:** A skippable signup + anonymous entry that asks 5 background questions and
5 skill questions, then routes the learner: `Mostly never → Python Fundamentals · Mixed
background → Data Analyst (+50 placement XP one-time) · Comfortable → Main sectors (+100
placement XP, opens Level 3 medium tier)`. Per brief §5.
**Why it matters for juniors:** Without it, an experienced visitor lands on "01_hello_world.ipynb"
and bounces. Today the signup page just says "isn't live yet."
**What blocks it:** A migration to extend `xp_events.reason` with `'placement'` (capped,
one-time, server-granted), a `content/placement/questions.json`, a route, and a
deterministic routing test.
**Estimate:** 1.5 days.

#### Pyodide (HIGH priority for juniors)
**What it is:** Real client-side WebAssembly Python execution. The brief specifies it for
py + da sectors only (PyTorch can't run in Pyodide so dl stays scripted).
**Why it matters:** Today a learner reads `option.resultLog` and trusts that the option
they picked would produce that output. With Pyodide they'd *see* their fix run.
**What blocks it:** ~6 MB Pyodide bundle (can't be in initial chunk; gated behind a
"Run on your machine" button), security sandbox audit, plumbing into the existing
notebook output cell, fallback when Pyodide load fails.
**Estimate:** 4–5 days.

#### Public `/portfolio/[username]`
**What it is:** A shareable proof-of-skill route with username slug.
**Why it matters:** The current `/portfolio` requires auth and shows only your own stats.
You can't share it as a job-application asset.
**What blocks it:** A small UX decision (do we ship code samples on the public version?
A "challenge a recruiter to re-solve this" link? An OG card?).
**Estimate:** 0.5 day + a design call.

### 5.2 The other deferrals (low/medium)

- **Leaderboard (5.6c)** — 1 day; infra exists. Worth doing alongside the badge merge.
- **Per-portfolio OG card** — 0.5 day; bundle with the username route.
- **CI staleness gate on figures** — 2 hours; nice-to-have for figure-using sectors.
- **Reasoning sprint continuation** — 25 more reasoning missions across da/ml/dl, paused
  at slice 3 of 11 of the prior plan. Mechanism is live (filter + badge + 5 da missions);
  needs content authoring time.

---

## 6. Prioritised next steps (ranked by junior impact)

1. **This sprint's gap-fill (30 missions + glossary)** — fixes 30 core employability gaps and the highest-impact UX miss. 1–2 weeks total.
2. **Placement quiz** — 1.5 days; experienced users stop bouncing.
3. **Pyodide for py + da** — 4–5 days; the single biggest "this product teaches" win.
4. **Reasoning sprint continuation (da-041..055 + ml-016..025-r + dl-016..020-r)** — multi-week; ships the judgment side of the curriculum.
5. **Public `/portfolio/[username]` + OG card** — 1 day; shareable proof of skill.
6. **Leaderboard (5.6c)** — 1 day; social gamification.
7. **Mobile code-cell readability** — 2 days; SQL especially. Word-wrap toggle? Pinch-zoom?
8. **Weakness tracking / "your weak concepts" view in portfolio** — 1 week including the analytics view.

---

## 7. What this sprint ships (concrete)

| Deliverable | Files | Status when sprint ends |
|---|---|---|
| **This audit** | `reports/JUNIOR_NEEDS_AUDIT.md` | Shipped in slice 1 |
| Glossary mechanism | migration 019, schema/source/seed pass-through, `GlossaryDisclosure.tsx`, i18n keys | Slice 2 |
| **py-031..035** | 5 challenge JSONs | Slice 3 |
| **da-046..050** | 5 challenge JSONs | Slice 4 |
| **ml-016..020** | 5 challenge JSONs | Slice 5 |
| **dl-016..020** | 5 challenge JSONs | Slice 6 |
| **fullstack-016..020** | 5 challenge JSONs | Slice 7 |
| **db-016..020** | 5 challenge JSONs | Slice 8 |
| Phase report | `reports/PHASE_REPORT_JUNIOR_FOUNDATIONS.md` | Slice 9 |

**Catalog at sprint end:** 115 + 30 = **145 challenges**. Per-sector targets:
py 35 · da 30 · ml 20 · dl 20 · fullstack 20 · db 20.

---

## 8. Honesty appendix — every illustrative number cited

The brief's non-negotiable: **no fabricated statistics, no invented company quotes, no
made-up survey results.** This appendix lists every public reference the new missions
will lean on. All are verifiable.

| Reference | Source |
|---|---|
| IEEE 754 floating-point representation; `0.1` is not exact in binary | IEEE Standard 754-1985 (and 754-2008); David Goldberg, *"What Every Computer Scientist Should Know About Floating-Point Arithmetic"* (1991), still the canonical 70-page reference |
| Y2K global remediation cost ~$300B | U.S. Department of Commerce, *The Economic Impact of Y2K* (1999); Gartner research notes from 1998 |
| Y2038 — 32-bit signed Unix timestamp overflow at 03:14:07 UTC 2038-01-19 | POSIX `time_t` definition |
| Twitter's status ID rollover (2009) | Public Twitter Engineering blog post; required migration to 64-bit IDs |
| Mutation during iteration is documented in every Python style guide | Python Language Reference, *Mutable sequences and iterators* |
| Naive Fibonacci is `O(2^n)`; with memoization is `O(n)` | Cormen, Leiserson, Rivest, Stein, *Introduction to Algorithms* — standard DP-introduction example |
| Python recursion limit defaults to 1000 frames | `sys.getrecursionlimit()`; CPython source |
| `lru_cache` / `@cache` in `functools` | Python 3.2+ `functools.lru_cache`; `functools.cache` since 3.9 |
| Bare `except: pass` as the most-blogged Python anti-pattern | Sentry blog, Honeycomb blog, Datadog blog, Real Python — countless write-ups |
| Cloudflare regex outage 2019-07-02 | Cloudflare public post-mortem, "Details of the Cloudflare outage on July 2, 2019" |
| React Error Boundaries (introduced React 16) | React docs, *Error Boundaries*; React 16 release notes |
| WCAG 2.1 a11y requirements for modal dialogs | W3C WCAG 2.1; WAI-ARIA Authoring Practices |
| AWS exponential backoff with jitter algorithm | AWS Architecture Blog, "Exponential Backoff And Jitter" (Marc Brooker, 2015) |
| PyTorch AMP `torch.cuda.amp.autocast` + `GradScaler` | PyTorch documentation, *Automatic Mixed Precision* |
| Dying-ReLU problem | Long-discussed in the literature; LeakyReLU/PReLU original papers |
| Cosine annealing LR schedule | Loshchilov & Hutter (2017), *SGDR: Stochastic Gradient Descent with Warm Restarts* |
| `EXPLAIN ANALYZE` semantics | PostgreSQL documentation, *Performance Tips* |
| SQL CTE / `WITH RECURSIVE` | ANSI SQL:1999 standard; PostgreSQL `WITH` queries |
| Codd's Normal Forms (1NF, 2NF, 3NF) | E.F. Codd (1970, 1971); standard database-design canon |
| Transaction isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) | ANSI SQL:1992 standard; *Generalized Isolation Level Definitions* (Adya et al., 2000) |
| React Testing Library philosophy | Kent C. Dodds, RTL docs, "The more your tests resemble the way your software is used, the more confidence they can give you." |
| Pivot / melt as wide↔long transformations | Hadley Wickham, *Tidy Data* (2014, JSS) — foundational reshape literature |

Illustrative numbers used in the new missions (e.g. "inner join dropped 30%", "loss
plateaued at epoch 30", "1.2M orders cascaded out") are scenario-local — they describe
what the broken code in the mission produced, not claims about real companies. The
audit and tutorials are explicit about that distinction.

---

## 9. Sign-offs (for the project owner)

- [x] Audit reflects the live 2026-06-15 catalog state.
- [x] Content gaps per sector are sourced from a full per-mission topic scan, not memory.
- [x] UX gaps mapped to actual files / components / store keys.
- [x] Roadmap items match the brief + phase reports + recent integrity check.
- [x] Honesty rule: every external reference is verifiable.
- [x] Deferrals are named with sizing, not hidden.
