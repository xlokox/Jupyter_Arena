# Jupyter Arena

> **Debug challenges for ML engineers.** A browser-based learning platform where you spot and fix realistic bugs in Python ML, Deep Learning, Full Stack, and SQL notebooks — no install required.

[**Live →**](https://yourdomain.com) · [Daily Challenge](https://yourdomain.com/daily) · [Portfolio](https://yourdomain.com/portfolio)

---

## What it is

Jupyter Arena presents 60 curated challenges across four domains. Each challenge shows you a broken notebook cell with a realistic traceback, four candidate fixes, and a simulated code-review output that tells you *why* your fix works or fails. Correct first solves earn XP; a streak counter and rank system keep you coming back.

Works completely offline and anonymously — progress lives in `localStorage`. Sign in via email OTP to persist XP to a Supabase account and have your stats travel across devices.

### Sectors and challenge count

| Sector | Challenges |
|--------|-----------|
| Machine Learning | 15 |
| Deep Learning | 15 |
| Full Stack | 15 |
| Databases | 15 |
| **Total** | **60** |

### Gamification (Section 9 rules, unit-tested)

| Event | XP |
|-------|----|
| Correct first solve | +10 |
| Wrong attempt | −5 (floor 0) |
| First-try clean (≤ 1 hint) | +5 bonus |
| First solve of UTC day | +5 bonus |
| Re-solve | 0 |

`level = floor(xp / 50) + 1`

Ranks: **Compile Rookie** (1–5) → **Traceback Hunter** (6–15) → **Kernel Engineer** (16–30) → **Overlord Compiler** (31+)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js 15 App Router                  │
│  ┌─────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   / (static)    │  │ /challenge/[id]│  │  /daily      │  │
│  │  AppShell +     │  │  (ISR 1h)      │  │  (dynamic)   │  │
│  │  Sidebar +      │  │  OG image      │  │              │  │
│  │  NotebookView   │  │  + metadata    │  │              │  │
│  └────────┬────────┘  └───────┬────────┘  └──────────────┘  │
│           │                   │                               │
│  ┌────────▼───────────────────▼────────────────────────┐     │
│  │              Zustand workspace store                 │     │
│  │  filters · activeChallengeId · attempts · stats      │     │
│  │  localStorage persist (skipHydration → AppShell)     │     │
│  └────────────────────────┬────────────────────────────┘     │
│                           │                                   │
│  ┌────────────────────────▼────────────────────────────┐     │
│  │              Content layer (payload split)           │     │
│  │  list views → ChallengeMeta only (from DB or fs)    │     │
│  │  full body → /api/challenges/[id] (cached, ISR 1h)  │     │
│  │  source.ts: DB-first, fs fallback (anonymous-safe)  │     │
│  └────────────────────────┬────────────────────────────┘     │
└───────────────────────────┼─────────────────────────────────┘
                            │
          ┌─────────────────┴──────────────────┐
          │           Supabase (optional)        │
          │  • PostgreSQL + RLS                  │
          │  • submit_attempt RPC (server XP)    │
          │  • merge_local_progress RPC          │
          │  • Email OTP auth                    │
          └──────────────────────────────────────┘
```

**Key design decisions:**
- **Anonymous-first.** The app is fully functional without a database. Supabase is additive.
- **Payload split.** List views ship `ChallengeMeta` (title, difficulty, sector) only. Full challenge bodies are fetched on demand via `/api/challenges/[id]` and cached client-side in a Map. Keeps First Load JS under 200 kB even with 60 challenges.
- **Zero server-side code execution.** Challenge correctness is evaluated against a pre-authored `correct_option` index in the JSON — no `eval`, no sandbox.
- **ISR everywhere.** Static pages with 1-hour revalidation. The daily challenge route is `force-dynamic` (UTC-day seed).

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, TypeScript strict) |
| Styling | Tailwind CSS v4 + design tokens (`--bg`, `--panel`, `--accent`, …) |
| State | Zustand (persist to localStorage) |
| Auth + DB | Supabase (email OTP, PostgreSQL, RLS, Edge RPCs) |
| Content | JSON files in `/content`, validated with Zod, seeded to Postgres |
| Testing | Vitest (unit, 84 tests) + Playwright (e2e, 16 tests) |
| Package manager | pnpm ≥ 9, Node ≥ 20 |

---

## Local development

### Prerequisites

- Node ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Docker Desktop (only for Supabase local stack — optional)

### Quick start (anonymous-local, no database)

```bash
git clone https://github.com/your-username/jupyter-arena
cd jupyter-arena
pnpm install
cp .env.example .env.local   # optional: leave vars empty for anonymous mode
pnpm dev                     # → http://localhost:3000
```

All 60 challenges are served directly from `/content`. Progress is stored in `localStorage`. No database needed.

### With local Supabase (auth + persistent XP)

```bash
# 1. Start Docker Desktop, then:
pnpm db:start                           # spins up local Supabase stack

# 2. Copy the printed credentials into .env.local:
pnpm exec supabase status -o env        # prints ANON_KEY, SERVICE_ROLE_KEY, URL

# 3. Seed challenge content into Postgres:
pnpm content:seed                       # idempotent; safe to re-run

# 4. Start the dev server:
pnpm dev
```

### Commands

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Dev server at http://localhost:3000 |
| `pnpm build` | Production build |
| `pnpm check` | lint + typecheck + unit tests + content:validate (CI gate) |
| `pnpm test` | Vitest unit tests |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm e2e` | Playwright e2e (starts dev server) |
| `pnpm db:start` | Start local Supabase (Docker) |
| `pnpm db:reset` | Re-apply all migrations |
| `pnpm content:seed` | Upsert `/content` into Postgres |
| `pnpm test:db` | Auth/RPC integration suite against local stack |
| `pnpm content:validate` | Zod + QA checks over all challenge JSON |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |

---

## Deployment

### 1. Supabase (production project)

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, apply the migrations in order:

```bash
# Link to your production project (one-time):
pnpm exec supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations:
pnpm exec supabase db push
```

3. Note your project's **URL**, **anon key**, and **service_role key** from **Project Settings → API**.

4. Seed content:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ... pnpm content:seed
```

### 2. Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Add environment variables (Settings → Environment Variables):

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` | No trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Public — safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Secret — never expose to client |

4. Deploy. Vercel auto-detects the Next.js App Router and configures ISR correctly.

> **Note:** `SUPABASE_SERVICE_ROLE_KEY` is only needed at build/seed time. It is never included in the client bundle (verified by `grep -r "service_role" .next/static/` → empty).

### 3. Custom domain (optional)

Add your domain in Vercel **Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL` to match.

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SITE_URL` | prod only | `http://localhost:3000` | Canonical origin for sitemap, OG images, robots.txt |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | — | Supabase project URL (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | — | Supabase anon key (public, RLS-gated) |
| `SUPABASE_SERVICE_ROLE_KEY` | seed only | — | Supabase service role key — **never expose to the client** |

Without `NEXT_PUBLIC_SUPABASE_*` the app runs in anonymous-local mode: challenges come from the filesystem and XP is stored in `localStorage` only.

---

## Project structure

```
.
├── content/
│   ├── sectors.json              # Sector definitions (ml, dl, fullstack, db)
│   └── challenges/{sector}/     # 60 challenge JSON files (Zod-validated)
├── e2e/                          # Playwright specs (5 journeys, 16+ tests)
├── reports/                      # Phase acceptance reports
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── challenge/[id]/       # ISR challenge pages + OG image
│   │   ├── daily/                # force-dynamic daily pick
│   │   ├── portfolio/            # Static portfolio dashboard
│   │   └── api/challenges/[id]/ # Force-static API route (ISR 1h)
│   ├── components/
│   │   ├── notebook/             # Workspace cells (code/output/control/solve)
│   │   ├── app-shell.tsx         # Root layout + keyboard shortcuts
│   │   └── sidebar.tsx           # Explorer + filters + tutorials
│   ├── lib/
│   │   ├── content/              # Schema (Zod), source (DB-or-fs), loader
│   │   ├── game/                 # XP/streak math (pure, tested)
│   │   ├── supabase/             # Env-gated browser + server clients
│   │   └── tokenizer/            # Line-based syntax highlighter (py/js/sql)
│   ├── store/workspace.ts        # Zustand store (filters, attempts, stats)
│   └── i18n/en.ts                # All user-visible strings
├── supabase/
│   ├── migrations/               # 7 SQL migrations (schema → RLS → RPCs)
│   └── tests/db/                 # Integration acceptance suite
└── .env.example                  # Template for environment variables
```

---

## Content authoring

Add a JSON file to `content/challenges/{sector}/` following the schema in `src/lib/content/schema.ts`. Required fields:

```jsonc
{
  "id": "ml-016-your-challenge",   // sector-NNN-slug
  "sector": "ml",
  "title": "Broken notebook title",
  "difficulty": "easy",            // easy | medium | hard | very_hard
  "description": "One sentence.",
  "broken_code": "...",            // Python/SQL/JSX with the bug
  "traceback": "...",              // Must exactly match broken_code output
  "options": [                     // Exactly 4; exactly one correct
    { "label": "Fix A", "code": "...", "output": "...", "rationale": "..." },
    ...
  ],
  "correct_option": 0,             // 0-based index
  "hints": ["Hint 1", "Hint 2"],   // Exactly 2
  "explanation": "Why fix A works.",
  "video_links": [                 // YouTube search URLs only
    { "label": "Title", "url": "https://youtube.com/results?search_query=..." }
  ]
}
```

Then run `pnpm content:validate` to check all rules, and `pnpm content:seed` to push to Postgres.

---

## Security

- **CSP** — `default-src 'self'`; `'unsafe-eval'` is **dev-only** (webpack source maps). Production CSP has no eval.
- **No `dangerouslySetInnerHTML`** — markdown rendered via `react-markdown` without `rehype-raw`.
- **Service role key never touches the client bundle** — verified at build (`grep -r "service_role" .next/static/` → empty).
- **RLS** — all Supabase tables deny by default; `submit_attempt` and `merge_local_progress` are server-side RPCs with `SECURITY DEFINER`.
- **`pnpm audit`** — zero known vulnerabilities.

---

## License

MIT — see [LICENSE](LICENSE).

---

*Built with Next.js, Supabase, and Tailwind CSS.*
