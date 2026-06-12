# JUPYTER ARENA — MASTER BUILD BRIEF

**For:** Claude Code (executing agent)
**Owner:** Daniel
**Version:** 1.0 — June 2026
**Status:** Decisions in this document are LOCKED unless marked `[OPEN]`. Do not re-litigate locked decisions; flag concerns in your phase report instead.

---

## HOW DANIEL RUNS THIS (human runbook — Claude Code: read this too)

1. Create a new empty git repository. Save this file at the root as `MASTER_BRIEF.md`.
2. Start Claude Code in the repo and paste the **Kickoff Prompt** below.
3. Work proceeds in **phases (0–7)**. Claude Code stops at the end of every phase and waits for review. Daniel says "proceed to Phase N" to continue.
4. For Phase 4 (database + auth) and any destructive change, Claude Code uses **plan mode** and presents the plan before touching anything.
5. Prefer a fresh session per phase. Each new session begins by reading `MASTER_BRIEF.md`, `CLAUDE.md`, and the latest `reports/PHASE_REPORT_*.md`.

### Kickoff Prompt (paste as the first message)

```
Read MASTER_BRIEF.md in full before writing any code. Then:
1. Restate the Phase 0 deliverables in your own words (max 10 lines).
2. List any conflicts, ambiguities, or risks you see in the brief (max 5).
3. Execute Phase 0 only. Stop at the Phase 0 acceptance checklist and wait for my review.
Follow Section 12 (Working Agreements) at all times.
```

---

## 1. MISSION, AUDIENCE, BUSINESS MODEL

**Product:** Jupyter Arena — a free, global, browser-based platform that teaches debugging. Users open realistic "broken" notebooks/IDEs, read real tracebacks, choose the correct fix from plausible options, and watch the cell re-run successfully. Sectors: Machine Learning, Deep Learning, Full Stack, Databases (AI Security added in v2).

**Audience:** Junior developers and students worldwide, on any device, including low-end hardware and slow connections.

**Why this and not another LeetCode clone:** Algorithm-puzzle platforms are saturated. Nobody owns *debugging as a skill* — reading tracebacks, recognizing failure patterns, choosing the minimal correct fix. That is the daily job, it is interview-relevant, and it is the wedge. Every feature decision should defend this wedge.

**Business model (locked for v1):** Free. No ads. No paywall. Monetization is explicitly out of scope until the platform has content depth and traffic (see Section 3, LATER). The architecture must therefore have **near-zero marginal cost per user** — this single constraint drives most decisions below.

---

## 2. NON-NEGOTIABLES

1. **Zero server-side code execution.** All "Run Cell" behavior is either scripted simulation (v1) or client-side WebAssembly execution (v1.5, feature-flagged). The server never executes user-influenced code. This is a security and a cost decision.
2. **Anonymous-first.** Full product works without an account (progress in `localStorage`). Accounts add sync, leaderboard, and shareable portfolio — they are never required to play.
3. **Content is data, not code.** Every challenge lives as a validated JSON file in `/content`, seeded into Postgres. Adding challenge #200 must require zero code changes.
4. **Every challenge is technically true.** Tracebacks must match the code shown. Fixes must actually fix. Wrong options must be plausible and each must teach something. A factually wrong challenge is a release blocker.
5. **Works on a cheap phone on 3G.** Performance budgets in Section 11 are gates, not aspirations.
6. **English-first, internationalization-ready.** All UI strings through a dictionary from day one; layout uses logical CSS properties so RTL locales (Hebrew planned second) need no rework. No mixed-direction text in v1 UI.
7. **No fabricated external references.** YouTube recommendations are **search-query URLs** (always valid), never hardcoded video IDs. No invented citations, papers, or statistics anywhere in content.
8. **Security posture of a real product**, not a demo: RLS on every table, validated inputs at every boundary, no secrets in the client bundle. Full checklist in Section 11.

---

## 3. SCOPE — MUST / SHOULD / LATER

**MUST (v1 launch):**
- Notebook workspace: markdown cell, syntax-highlighted code cell with bug-region indicator, output cell (red traceback → green success), 3-option fix panel, Run Cell simulation, progressive 2-stage hints, recruiter review card, explanation of why the bug occurs and why the fix works.
- Wrong answers run too: each wrong option has its own realistic failure output (see content schema). This is a core teaching mechanic, not an error toast.
- Sectors + difficulty filters, file-explorer sidebar (Missions / Tutorials tabs), search by title/concept tag.
- Gamification: XP, levels, rank titles, daily streak, completed count, accuracy (exact math in Section 9).
- Tutorials: per-challenge markdown lesson + 2 video recommendation cards (search links).
- Portfolio page: public, shareable URL per user (opt-in), stats grid, rank, sector completion, "Perfect for your LinkedIn or resume" framing.
- Anonymous play with localStorage; optional account (Supabase Auth) with one-time merge of local progress.
- 60 published challenges at launch (Section 7).
- Daily Challenge (one featured challenge per UTC day, stable URL).
- Responsive: desktop, tablet, mobile (sidebar becomes drawer; touch targets ≥ 44px).

**SHOULD (build if phase time allows; otherwise first post-launch):**
- Shareable solve card (OG image per challenge + per portfolio).
- Opt-in global leaderboard (username + XP only).
- Spaced-repetition "Review queue" (resurface solved challenges after 3/7/30 days as recall quizzes).
- Keyboard shortcuts (1/2/3 select option, Enter = run, N = next).
- Real client-side execution behind a flag: **Pyodide** for Python challenges (NumPy/pandas/scikit-learn are available in Pyodide; **PyTorch is not** — Deep Learning challenges stay scripted permanently) and **Sandpack** for React/JS challenges. Loaded only on explicit user action, never in the initial bundle.
- Basic PWA/offline caching of visited challenges (low-bandwidth users).

**LATER (do NOT build, do NOT scaffold):**
- Payments, subscriptions, certificates, team/classroom seats, job board.
- User-generated challenge submissions and moderation.
- Live LLM-generated hints (authored hints only in v1 — live calls cost money and break the zero-marginal-cost rule).
- Mobile apps, real-time multiplayer/duels.

---

## 4. ARCHITECTURE DECISIONS (LOCKED)

| Concern | Decision | Reason |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript `strict` | SSR/SSG for SEO on public challenge pages; matches spec's React/Next direction |
| Styling | Tailwind CSS + small token layer (CSS variables) | Spec requirement; tokens defined in Section 8 |
| Client state | Zustand (game/session state) | Small, testable, no boilerplate |
| Server data | Supabase (Postgres + Auth + RLS) via `@supabase/ssr` | Spec names PostgreSQL/Supabase as the target; generous starting tier (verify current limits at signup) |
| Content source of truth | `/content/*.json` validated by Zod → seeded to Postgres by script | Authoring in git, serving from DB |
| Markdown rendering | `react-markdown` + `remark-gfm`, **raw HTML disabled** | XSS-safe lesson/description rendering |
| Code display | Custom lightweight tokenizer v1 (read-only display); CodeMirror 6 read-only is an approved SHOULD upgrade | No heavy editor needed for MCQ format |
| Icons / fonts | `lucide-react`; Inter (UI) + JetBrains Mono (code), self-hosted via `next/font` | Spec's "FontAwesome class string" field becomes a lucide icon name string — approved deviation |
| Hosting | Vercel (app) + Supabase (data) | Free-tier-friendly start; verify current limits before launch |
| Analytics | Privacy-light page analytics only (no PII, no third-party ad tech) | Trust + compliance simplicity |
| Package manager / runtime | pnpm, Node LTS | Locked to avoid drift |

**Data flow:** Author JSON in `/content` → `pnpm content:validate` (CI gate) → `pnpm content:seed` (upserts to Postgres via service role, server-side only) → app reads published challenges via anon-key client with RLS → attempts/XP written through a Postgres RPC (`submit_attempt`) for authed users, localStorage for anonymous users.

**Do not add dependencies beyond:** next, react, typescript, tailwindcss, zustand, zod, @supabase/supabase-js, @supabase/ssr, react-markdown, remark-gfm, lucide-react, vitest, @testing-library/react, playwright, eslint, prettier. Anything else requires a one-line justification in the phase report *before* installing.

---

## 5. DATABASE SCHEMA (Postgres / Supabase)

Implement as ordered SQL migration files in `/supabase/migrations`. Schema below is the contract; refine column details only with a noted deviation.

```sql
-- 001_extensions.sql  (pgcrypto is enabled by default on Supabase; keep idempotent)
create extension if not exists pgcrypto;

-- 002_content.sql
create table public.sectors (
  id        text primary key,            -- 'ml' | 'dl' | 'fullstack' | 'db'
  name      text not null,
  position  int  not null default 0
);

create table public.challenges (
  id               text primary key,     -- 'ml-001-kmeans-scaling'
  sector_id        text not null references public.sectors(id),
  difficulty       text not null check (difficulty in ('easy','medium','hard','very_hard')),
  title            text not null,        -- display filename, e.g. '01_kmeans_customer_segmentation.ipynb'
  language         text not null check (language in ('python','jsx','javascript','sql')),
  icon             text not null,        -- lucide icon name
  concept_tags     text[] not null default '{}',
  description_md   text not null,        -- mission briefing markdown
  initial_code     text not null,
  buggy_line_start int  not null,
  buggy_line_end   int  not null,
  traceback        text not null,        -- pre-solve red output
  correct_output   text not null,        -- post-solve green output
  recruiter_review text not null,
  explanation_md   text not null,        -- why the bug happens + why the fix is right
  est_minutes      int  not null default 5,
  version          int  not null default 1,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now()
);

create table public.challenge_options (
  id           uuid primary key default gen_random_uuid(),
  challenge_id text not null references public.challenges(id) on delete cascade,
  option_key   text not null check (option_key in ('a','b','c')),
  label        text not null,            -- short description of the proposed fix
  patch_code   text not null,            -- full code after applying this option
  is_correct   boolean not null,
  result_log   text not null,            -- success log (correct) or NEW realistic failure (wrong)
  rationale    text not null,            -- shown after running this option
  unique (challenge_id, option_key)
);

create table public.challenge_hints (
  id           uuid primary key default gen_random_uuid(),
  challenge_id text not null references public.challenges(id) on delete cascade,
  hint_order   int  not null check (hint_order in (1,2)),  -- 1 = concept, 2 = location/API quirk
  hint_md      text not null,
  unique (challenge_id, hint_order)
);

create table public.tutorials (
  challenge_id text primary key references public.challenges(id) on delete cascade,
  body_md      text not null              -- 400–700 word lesson
);

create table public.tutorial_videos (
  id           uuid primary key default gen_random_uuid(),
  challenge_id text not null references public.tutorials(challenge_id) on delete cascade,
  title        text not null,
  url          text not null,             -- YouTube SEARCH URL only — never a video ID
  position     int  not null default 0
);

-- 003_users.sql
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name  text,
  is_public     boolean not null default false,   -- opt-in portfolio + leaderboard
  created_at    timestamptz not null default now()
);

create table public.user_stats (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  xp             int  not null default 0 check (xp >= 0),
  current_streak int  not null default 0,
  longest_streak int  not null default 0,
  last_active    date
);

create table public.user_challenge_progress (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  challenge_id text not null references public.challenges(id),
  solved_at    timestamptz,
  attempts     int not null default 0,
  hints_used   int not null default 0,
  primary key (user_id, challenge_id)
);

create table public.attempts (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  challenge_id text not null references public.challenges(id),
  option_key   text not null,
  is_correct   boolean not null,
  hints_used   int  not null default 0,
  created_at   timestamptz not null default now()
);

create table public.xp_events (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  challenge_id text references public.challenges(id),
  delta        int  not null,
  reason       text not null check (reason in ('correct_fix','wrong_fix','first_try_bonus','daily_first_solve')),
  created_at   timestamptz not null default now()
);

-- Indexes
create index on public.challenges (sector_id, difficulty) where is_published;
create index on public.attempts (user_id, created_at desc);
create index on public.user_challenge_progress (user_id) where solved_at is not null;
```

**Row Level Security (deny-by-default; enable RLS on every table):**
- Content tables (`sectors`, `challenges`, `challenge_options`, `challenge_hints`, `tutorials`, `tutorial_videos`): `select` for `anon` and `authenticated` **only where the parent challenge `is_published`**. No insert/update/delete policies — content is written exclusively by the seed script using the service role key (server-side only, never shipped to the client).
- `profiles`: owner can select/update own row; `select` of `username, display_name` for rows where `is_public = true`.
- `user_stats`, `user_challenge_progress`, `attempts`, `xp_events`: owner-only `select`; **no direct insert/update from clients** — all writes go through the RPC below.

**RPC contract — `submit_attempt(challenge_id text, option_key text, hints_used int)`** (`security definer`, search_path pinned):
1. Validates the challenge is published and the option exists; reads `is_correct` server-side (the client's claim is never trusted for XP).
2. Inserts the attempt; updates `user_challenge_progress` (idempotent: a challenge can be *solved* only once per user — repeat solves grant 0 XP).
3. Applies XP per Section 9 inside the same transaction (`xp_events` + `user_stats`), updates streak fields based on UTC date.
4. Rejects more than 30 attempts per user per minute (simple rate guard).
5. Returns `{ is_correct, xp_delta, new_xp, level, streak }`.

**Leaderboard `[SHOULD]`:** a view over `user_stats` joined to `profiles` filtered to `is_public = true`, exposing only `username, xp`. Nothing else.

---

## 6. CONTENT FACTORY ("MEGA-DATA")

The moat is challenge volume × correctness. Treat content like code: schema-validated, reviewed, versioned, CI-gated.

**File layout:** `/content/challenges/{sector}/{id}.json`, `/content/sectors.json`.

**Zod schema (`src/lib/content/schema.ts`) — mirrors the DB exactly:**

```ts
export const ChallengeSchema = z.object({
  id: z.string().regex(/^(ml|dl|fullstack|db)-\d{3}-[a-z0-9-]+$/),
  sector: z.enum(['ml','dl','fullstack','db']),
  difficulty: z.enum(['easy','medium','hard','very_hard']),
  title: z.string(),                       // e.g. "07_smote_before_split.ipynb"
  language: z.enum(['python','jsx','javascript','sql']),
  icon: z.string(),                        // lucide icon name
  conceptTags: z.array(z.string()).min(1).max(5),
  descriptionMd: z.string().min(200),      // mission briefing: scenario, architectural goal, runtime problem
  initialCode: z.string(),
  buggyLineStart: z.number().int().positive(),
  buggyLineEnd: z.number().int().positive(),
  traceback: z.string().min(40),
  correctOutput: z.string().min(20),
  options: z.array(z.object({
    key: z.enum(['a','b','c']),
    label: z.string(),
    patchCode: z.string(),
    isCorrect: z.boolean(),
    resultLog: z.string().min(20),
    rationale: z.string().min(60),
  })).length(3),
  hints: z.tuple([z.string(), z.string()]),  // [concept hint, location hint]
  explanationMd: z.string().min(150),
  recruiterReview: z.string().min(120),
  tutorial: z.object({
    bodyMd: z.string().min(1200),            // ~400–700 words
    videos: z.array(z.object({ title: z.string(), searchQuery: z.string() })).length(2),
  }),
  estMinutes: z.number().int().min(2).max(20),
  version: z.number().int().min(1),
});
```

**Authoring rules (every challenge, no exceptions):**
1. The traceback must be producible by the `initialCode` as written — correct exception type, plausible line numbers, real library message format.
2. Exactly one correct option. The correct option's `patchCode` must genuinely fix the bug and nothing else (minimal diff).
3. Each wrong option must be something a real junior would try, must compile/run conceptually, and its `resultLog` must show the *new* realistic outcome (same error, a different error, or a silent-wrong-result warning). Wrong options that are obviously absurd are rejected.
4. `buggyLineStart/End` must fall inside the bounds of `initialCode` and actually contain the defect.
5. `explanationMd` answers two questions explicitly: *why does this bug occur* (mechanism) and *why is this fix correct* (principle) — that requirement comes straight from the product spec.
6. Hint 1 names the concept without the location; hint 2 names the location/API quirk without the answer.
7. Recruiter review is written in a senior reviewer's voice: confirms the fix, names the underlying principle, gives one forward-looking improvement, approves.
8. Tutorial teaches the concept generally (not just this instance) and ends with a "common variations of this bug" list.
9. Video cards: `https://www.youtube.com/results?search_query=...` built from `searchQuery`. Never a direct video link.
10. No copied content from LeetCode/Codewars/StackOverflow or any book. All scenarios, code, and prose are original.

**QA pipeline (`pnpm content:validate`, runs in CI):**
- Zod parse of every file; duplicate-ID check; exactly-one-correct check; line-range bounds check; banned-pattern scan (hardcoded `youtube.com/watch`, the string `TODO`, the string `lorem`).
- For `language: python` files, when the Pyodide flag lands (v1.5): execute `initialCode` and the correct `patchCode` headlessly in CI and diff actual vs. authored outputs. Until then, manual verification is recorded in the challenge's git commit message (`verified-by: <how>`).

---

## 7. SEED DATASET — LAUNCH CATALOG (60 challenges)

Targets: **15 per sector** — per sector: 5 easy, 5 medium, 3 hard, 2 very_hard. The four challenges from the original product spec are seeds #1 of their sectors and must be authored first, exactly as specified there (KMeans scaling / React stale state / PyTorch device mismatch / connection pool leak), upgraded to this schema (3 options each with wrong-path result logs).

Author the remaining 56 from the catalog below. Each row defines the shipped bug and the correct fix; Claude Code writes the full scenario, code, traceback, options, hints, tutorial, and review per Section 6.

### Machine Learning (`ml`, python)

| # | Diff | Concept | The shipped bug | The correct fix |
|---|---|---|---|---|
| 001 | easy | Feature scaling | KMeans on raw `age`+`income` — income dominates distance | `StandardScaler` before clustering *(original spec seed)* |
| 002 | easy | Test-set leakage | `scaler.fit_transform(X_test)` | `transform` only on test data |
| 003 | easy | Imbalanced metrics | 99% accuracy on 1%-positive fraud data celebrated as success | Report recall/F1, stratify the split |
| 004 | easy | Reproducibility | No `random_state` anywhere; results change every run | Seed split + model |
| 005 | easy | Categorical encoding | `LabelEncoder` output fed to LinearRegression (fake ordinality) | `OneHotEncoder` |
| 006 | medium | Pre-split leakage | Scaler fit on the full dataset *before* `train_test_split` | Fit on train only (or Pipeline + CV) |
| 007 | medium | Oversampling leakage | SMOTE applied before the split — synthetic test twins | SMOTE inside the training fold only |
| 008 | medium | Missing data | `dropna()` silently deletes 58% of rows | Targeted imputation, audit missingness first |
| 009 | medium | Time-series CV | Shuffled `KFold` on stock data — future leaks into past | `TimeSeriesSplit` |
| 010 | medium | pandas semantics | Chained assignment (`df[df.a>0]['b'] = 1`) never writes | `.loc[mask, 'b'] = 1` |
| 011 | hard | Target leakage | Feature `days_until_churn` is derived from the label | Remove/recompute feature from pre-cutoff data only |
| 012 | hard | Metric mismatch | `GridSearchCV` optimizing accuracy for a ranking problem | `scoring='roc_auc'` (match metric to objective) |
| 013 | hard | Grouped leakage | Same patient's records in train and test via plain KFold | `GroupKFold` on patient ID |
| 014 | very_hard | Unseen categories | Prod crash: category absent at fit time | `OneHotEncoder(handle_unknown='ignore')` + monitoring |
| 015 | very_hard | Pipeline integrity | Preprocessing done outside the persisted model; train/serve skew | Single sklearn `Pipeline` persisted end-to-end |

### Deep Learning (`dl`, python — scripted simulation only; PyTorch does not run in the browser)

| # | Diff | Concept | The shipped bug | The correct fix |
|---|---|---|---|---|
| 001 | hard | Device mismatch | Model on `cuda`, DataLoader batches left on CPU | `.to(device)` on inputs/targets in the loop *(original spec seed)* |
| 002 | easy | Gradient hygiene | Missing `optimizer.zero_grad()` — gradients accumulate | Zero per step |
| 003 | easy | Eval mode | Validation run without `model.eval()` — dropout active | `model.eval()` + restore `train()` |
| 004 | easy | Loss API | Softmax applied before `nn.CrossEntropyLoss` (expects logits) | Remove the softmax |
| 005 | easy | Memory in eval | No `torch.no_grad()` in validation — graph kept, OOM | Wrap eval in `no_grad()` |
| 006 | medium | Shape errors | Conv output fed to `Linear` without flatten | `nn.Flatten()` / reshape |
| 007 | medium | Learning rate | LR 10× too high — loss becomes NaN by step 40 | Reduce LR; note gradient clipping |
| 008 | medium | Train/serve skew | Inference normalization uses different mean/std than training | One shared transform definition |
| 009 | medium | Tokenization | `max_length` truncation silently cuts the answer span (NLP) | Correct max length + truncation strategy check |
| 010 | medium | Frozen params | Backbone `requires_grad=False` but optimizer holds all params; head never set up to train as intended | Pass only trainable params; verify with a param count |
| 011 | hard | BatchNorm | Training with `batch_size=1` — BatchNorm cannot compute stats | Larger batch or GroupNorm/LayerNorm |
| 012 | hard | Val augmentation | Random augmentations applied to the validation set — metrics jitter | Deterministic eval transform |
| 013 | very_hard | Grad accumulation | Accumulating 4 steps without dividing loss — effective LR 4× | `loss / accum_steps` |
| 014 | very_hard | Dataloader workers | `num_workers>0` with a lambda transform — pickling error on spawn | Module-level function / `functools.partial` |
| 015 | very_hard | Mixed precision | fp16 training without `GradScaler` — gradients underflow to zero | `torch.cuda.amp` autocast + GradScaler |

### Full Stack (`fullstack`, jsx/javascript)

| # | Diff | Concept | The shipped bug | The correct fix |
|---|---|---|---|---|
| 001 | medium | Stale closure | `setClicks(clicks+1)` then API call reads old `clicks` | Local `next` variable for both *(original spec seed)* |
| 002 | easy | List keys | `key={index}` on a reorderable list — wrong rows reuse state | Stable IDs as keys |
| 003 | easy | Effect deps | `useEffect(..., [])` reading a prop that changes — stale fetch | Correct dependency array |
| 004 | easy | Controlled inputs | `value=` with no `onChange` — field frozen | Add handler (or `defaultValue`) |
| 005 | easy | Fetch handling | `res.json()` without checking `res.ok` — parses an HTML error page | Check `ok`/status before parsing |
| 006 | medium | Infinite renders | Object literal in the dependency array — new identity every render | Memoize or depend on primitives |
| 007 | medium | Race condition | Slow earlier search response overwrites the newer one | `AbortController` / ignore stale responses |
| 008 | medium | Effect cleanup | `addEventListener` in effect with no cleanup — duplicate handlers | Return cleanup function |
| 009 | medium | Sequential awaits | `await` inside a loop for independent requests — 10× latency | `Promise.all` (note partial-failure handling) |
| 010 | hard | CORS | Frontend "fixes" CORS with client hacks | Correct server-side `Access-Control-Allow-*` |
| 011 | hard | Hydration | `Date.now()` rendered during SSR — hydration mismatch | Move to effect/client-only boundary |
| 012 | hard | Debounce identity | Debounced function recreated every render — never debounces | `useMemo`/`useRef` for a stable instance |
| 013 | very_hard | Token storage | JWT in `localStorage` read by an XSS payload | httpOnly + SameSite cookie; CSP as defense in depth |
| 014 | very_hard | Express errors | Async route throws; error middleware never reached — request hangs | Catch and `next(err)`; 4-arg error handler |
| 015 | very_hard | Unmount safety | State set on an unmounted component after slow fetch | Abort on cleanup / mounted guard |

### Databases (`db`, python/sql)

| # | Diff | Concept | The shipped bug | The correct fix |
|---|---|---|---|---|
| 001 | very_hard | Pool leak | Connection acquired in a conditional path, never released; deadlocks | Context manager / strict `finally` release *(original spec seed)* |
| 002 | easy | SQL injection | f-string interpolation of user input into a query | Parameterized query |
| 003 | easy | NULL semantics | `WHERE deleted_at = NULL` returns nothing | `IS NULL` |
| 004 | easy | Missing index | Full scan on `orders.customer_email` lookups | Add the index; read the query plan |
| 005 | easy | Timestamps | `timestamp` (naive) columns mixing local times across regions | `timestamptz` everywhere |
| 006 | medium | N+1 queries | ORM loop fires 1+N queries on the orders page | Join / eager load |
| 007 | medium | Atomicity | Two-statement money transfer without a transaction — partial write on crash | Single transaction (and atomic `SET balance = balance - $1`) |
| 008 | medium | Deep pagination | `OFFSET 100000` gets slower every page | Keyset (cursor) pagination |
| 009 | medium | Index expressions | `WHERE lower(email) = $1` ignores the plain index | Expression index on `lower(email)` |
| 010 | medium | Pattern search | `LIKE '%term%'` cannot use a b-tree index | `pg_trgm` GIN index / full-text search |
| 011 | hard | Deadlocks | Two workers lock rows in opposite order | Consistent lock ordering; `SKIP LOCKED` for queues |
| 012 | hard | Composite indexes | Index `(status, created_at)` unused by a query filtering only `created_at` | Match column order to query patterns |
| 013 | hard | Race conditions | Read-modify-write on inventory count under concurrency | Atomic UPDATE or `SELECT ... FOR UPDATE` |
| 014 | very_hard | Migration locking | `ADD COLUMN ... NOT NULL DEFAULT now()` (volatile default) rewrites/locks a huge table under load | Add nullable → backfill in batches → set NOT NULL |
| 015 | very_hard | Serverless pooling | New connection per serverless invocation — pool exhausted at scale | Pooler (e.g. pgbouncer / Supabase pooled connection string) |

### v2 sector — AI Security (`aisec`) `[OPEN — design only, do not build in v1]`
The roadmap differentiator: debugging *security* defects in AI/ML systems. Candidate catalog (12): prompt injection in a tool-using agent; unsafe `torch.load` pickle execution (fix: `weights_only=True`); `yaml.load` on user config (fix: `safe_load`); `eval()` on model config strings; path traversal in dataset upload; SSRF via "fetch this URL" features; ReDoS in input validation regex; JWT `alg: none` acceptance; dependency typosquatting in `requirements.txt`; secrets committed in notebooks; LLM output executed without sandboxing; insecure deserialization of cached embeddings. Ship as the v2 launch wave.

---

## 8. UX / UI SPECIFICATION

**Aesthetic:** Jupyter Lab × VS Code dark mode. Premium, restrained, engineering-grade — not a neon game. One accent color used with discipline.

**Design tokens (CSS variables, defined once in Phase 0):**
- Backgrounds: `--bg: #0a0c10`, `--panel: #11141a`, `--panel-2: #161a22`, `--code-bg: #0d1117`, `--border: #232936`
- Text: `--text: #e6e9ef`, `--muted: #8b93a7`
- Accent (amber): `--accent: #f59e0b`, hover `#fbbf24`; success `#34d399`; danger `#f87171`
- Syntax palette (GitHub-dark family): keyword `#ff7b72`, string `#a5d6ff`, comment `#8b949e`, number `#79c0ff`, type `#ffa657`, function `#d2a8ff`
- Fonts: Inter (UI), JetBrains Mono (code, `In [n]:` gutters, logo)

**Layout (per the original spec, kept):**
- Header: logo + flame icon; stats cluster (level badge + rank title, animated XP bar, streak flame, completed count); sector filter pills.
- Sidebar (collapsible drawer on mobile): tabs **Missions** (file explorer — filename, sector icon, difficulty badge, solved check) and **Tutorials** (lesson list; opening one swaps the workspace into tutorial view with markdown + two video cards + "Start mission").
- Workspace (notebook): markdown briefing cell → `In [1]:` code cell (line numbers, syntax highlighting, amber bug-region band with a bug marker) → `Out [1]:` output cell (red traceback; brief "executing" state on run; green success after a correct fix; a *different* realistic red/amber log after a wrong fix) → control cell (3 option cards, AI Hint, Run Cell, Next Notebook) → on solve: explanation panel + recruiter review card (reviewer header, monospace verdict, "Approved" stamp) expand.
- Portfolio view: stats grid (XP, rank, completed, accuracy, per-sector progress), public URL, the "Perfect for your LinkedIn or resume" line, share button `[SHOULD: OG card]`.

**States & motion:** every interactive element has hover/focus-visible/disabled states; wrong answer = brief shake + rationale reveal (no shame copy); correct = code patch transition, output swap, XP toast, possible level-up moment (one celebratory pulse, ~600ms, respects `prefers-reduced-motion`). No confetti libraries.

**Internationalization & RTL:** strings via `src/i18n/en.ts` dictionary; use logical properties (`margin-inline-start`, `text-align: start`) so a future `dir="rtl"` locale works without layout surgery. Code blocks remain LTR always.

---

## 9. GAMIFICATION MATH (EXACT — implement precisely, unit-test it)

**XP events:**
- Correct fix (first solve of that challenge): **+10** *(original rule)*
- Wrong attempt: **−5**, floored so total XP never drops below 0 *(original rule)*
- First-try clean solve bonus (no wrong attempts, ≤1 hint): **+5** *(addition)*
- First solve of the UTC day (streak tick): **+5** *(addition)*
- Re-running an already-solved challenge: **0** (review mode, no farming)

**Levels:** `level = floor(xp / 50) + 1`. XP bar shows progress within the current level.

**Rank titles** *(original tiers)*: levels 1–5 **Compile Rookie** · 6–15 **Traceback Hunter** · 16–30 **Kernel Engineer** · 31+ **Overlord Compiler**. (Full 60-challenge clear with bonuses lands deep in Traceback Hunter; the ladder is sized for the growing library.)

**Streak:** UTC-day based. Solving ≥1 challenge today extends it; a missed day resets to 0 (next solve restarts at 1). Track `longest_streak`. **Accuracy** = correct attempts / total attempts. For authed users all of this is computed inside `submit_attempt` server-side; the client only renders the returned values. Anonymous users compute locally and the merge-on-signup imports solved challenges and recomputes XP server-side from scratch (no trusting client XP totals).

---

## 10. EXECUTION PLAN — PHASES & ACCEPTANCE CRITERIA

Every phase ends with: all checks green (`pnpm check` = lint + typecheck + unit tests + content:validate), a conventional-commit history, and `reports/PHASE_REPORT_N.md` (what was built, decisions, deviations from this brief, known gaps, suggested next). **Stop and wait for review.**

**Phase 0 — Foundation.** Scaffold Next.js + TS strict + Tailwind + tokens; ESLint/Prettier/Vitest/Playwright wired; `pnpm check` script; generate `CLAUDE.md` (condensed operating rules from this brief: commands, structure, Section 12 agreements); empty route shell renders the header with tokens applied.
*Accept:* fresh clone → `pnpm i && pnpm check && pnpm dev` works; CLAUDE.md exists and is accurate.

**Phase 1 — Content engine.** Zod schema + TS types; `/content` layout; `content:validate` CLI with the Section 6 checks; author the **4 original-spec challenges in full** + 4 more (one per sector, pick easy rows) = 8 validated challenges.
*Accept:* validator catches each rule when deliberately violated (prove with tests); 8 challenges pass; every authored traceback/fix manually verified and noted in commit messages.

**Phase 2 — Notebook engine.** Full workspace per Section 8 on local state (Zustand): cells, tokenizer highlighting, bug-region indicator, options, run simulation incl. wrong-path result logs, 2-stage hints, explanation + recruiter card, sector/difficulty filters, sidebar tabs, mobile drawer, keyboard support.
*Accept:* solve and fail flows fully work on the 8 seeds; responsive at 360/768/1280px; axe scan clean on the workspace; reducer/store logic unit-tested.

**Phase 3 — Gamification + tutorials + portfolio.** Section 9 math (unit-tested exhaustively), toasts/level-up moment, streak, tutorials view with video search cards, portfolio page, daily challenge route, localStorage persistence for anonymous users.
*Accept:* XP math tests cover every event incl. floor and idempotent re-solve; refresh restores anonymous progress; daily challenge is deterministic per UTC date.

**Phase 4 — Supabase. (plan mode first)** Migrations from Section 5; RLS policies + `submit_attempt` RPC; seed script; auth (email OTP; OAuth optional); local→account merge; switch authed reads/writes to DB.
*Accept:* automated authz tests prove user A cannot read user B's rows and unpublished content is invisible to anon; XP cannot be granted by calling anything other than the RPC; seed is idempotent (re-run safe).

**Phase 5 — Content sprint to 60.** Author the full Section 7 catalog through the factory rules. Work in batches of 5 per commit; each batch passes `content:validate` before the next begins.
*Accept:* 60 published challenges, difficulty mix per sector as specified, zero validator warnings, spot-check protocol documented in the phase report.

**Phase 6 — Hardening.** Performance budgets met; full a11y pass; SEO (per-challenge metadata, sitemap, robots, OG tags; `[SHOULD]` OG image generation); error boundaries + empty/loading states; security checklist (Section 11) executed line by line with evidence; Playwright e2e: solve happy path, wrong-answer path, filter/search, tutorial nav, anonymous→signup merge.
*Accept:* budgets verified with Lighthouse on a throttled mid-tier profile and numbers recorded in the report; every checklist line marked pass with evidence.

**Phase 7 — Launch.** Vercel + Supabase production config; env var documentation; `README.md` with screenshots and architecture diagram (this doubles as Daniel's portfolio artifact); launch checklist (domain, analytics, backup of content repo, error monitoring); tag `v1.0.0`.
*Accept:* production URL serves all 60 challenges; cold-start anonymous user can solve a challenge end-to-end on a phone.

---

## 11. QUALITY BARS

**Security (execute as a checklist in Phase 6; design for it from Phase 0):**
RLS enabled on every table with deny-by-default; service-role key exists only in server-side env (verified by grepping the client bundle output for it and for any `SUPABASE_SERVICE` string); every external input crosses a Zod boundary; markdown rendered with raw HTML disabled; security headers (CSP, X-Content-Type-Options, Referrer-Policy, frame-ancestors) configured; `submit_attempt` rate-limited and correctness decided server-side; auth flows use Supabase primitives only (no hand-rolled sessions); `pnpm audit` clean or exceptions documented; no `dangerouslySetInnerHTML`; authz integration tests in CI.

**Performance:** initial JS for the workspace route < 200 KB gzipped; LCP < 2.5s and CLS < 0.1 on a throttled mid-tier mobile profile; fonts via `next/font` (no layout-shifting swaps); content payloads paginated (load challenge bodies on demand, list views ship metadata only); any future Pyodide/Sandpack bundle loads only after an explicit user action and never blocks first paint.

**Accessibility:** full keyboard operability incl. the option panel and Run Cell; visible focus rings; semantic landmarks; contrast ≥ 4.5:1 for text (verify amber-on-dark combinations); `prefers-reduced-motion` honored; traceback/output regions are `aria-live="polite"`.

**Testing:** unit — XP math, streak logic, content validator, tokenizer, store reducers; component — notebook flow with mocked content; e2e — the five Playwright journeys in Phase 6; CI runs `pnpm check` + e2e on every push.

---

## 12. WORKING AGREEMENTS — HOW CLAUDE CODE OPERATES ON THIS PROJECT

1. **Read first.** Every session: `MASTER_BRIEF.md`, `CLAUDE.md`, latest phase report. Never start coding from memory of a previous session.
2. **Plan before code.** Begin each phase with a short written plan mapped to acceptance criteria. Use plan mode for Phase 4 and for anything destructive (migrations, deletions, auth changes).
3. **Done means green.** Never report a phase complete with failing or skipped checks. Never weaken a test, validator rule, or budget to pass it — fix the work or flag the conflict.
4. **No placeholders.** No `TODO`, no lorem ipsum, no stub challenges, no "fill in later." Content rule 10 (originality) and rule 7 (no fabricated references) are absolute.
5. **Deviations are declared, not hidden.** Any departure from this brief goes in the phase report with a one-line reason. Locked decisions are not changed unilaterally.
6. **Blocked twice → stop.** After two failed approaches to a problem, write up the situation with 2–3 options and trade-offs, and wait.
7. **Small, labeled commits.** Conventional commits per milestone (`feat:`, `fix:`, `content:`, `test:`, `chore:`). Content batches of 5 challenges per commit in Phase 5.
8. **Keep CLAUDE.md current.** When commands, structure, or conventions change, update it in the same commit.
9. **Honest reporting.** Phase reports state what is weak or unverified, not only what works. Daniel prefers a true "this part is fragile" over a false "all good."
10. **Scope discipline.** Anything in LATER (Section 3) is not built, scaffolded, or "prepared for" beyond what this brief already specifies.

---

## APPENDIX — OUT-OF-SCOPE GRAVEYARD (decided, do not revisit in v1)
Payments and certificates; server-side code execution of any kind; live LLM hint generation; user-submitted challenges; mobile apps; multiplayer; embedding copyrighted video content (links to search results only); ads and third-party trackers.

*End of brief.*
