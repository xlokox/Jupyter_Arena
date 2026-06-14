# Phase Report — Junior Foundations (Gap-Fill Content + Glossary + Sub-Sectors)

**Date:** 2026-06-14 · **Branch:** `feat/learn-first-layer` · **Status:** Content complete, checks green

The execution arm of [`JUNIOR_NEEDS_AUDIT.md`](JUNIOR_NEEDS_AUDIT.md). The audit found that every
sector had 6–10 employability-critical topics uncovered and that the platform threw jargon with no
inline definition. This phase answers both: it ships **two new content mechanisms** (in-context
**glossary**, migration 019; **sub-sectors**, migration 020) and **+70 gap-fill missions** that take
the catalog from the audit's 115 to **185 challenges**. Existing content is untouched; both
mechanisms are additive, optional, nullable schema fields.

This report also records the **esbuild security patch** (migration-independent) landed on the same
branch.

## Catalog: before → after

| Sector | Audit baseline | Now | Δ | New ID range |
|---|---:|---:|---:|---|
| **py** | 30 | **45** | +15 | py-031..045 |
| **da** | 25 | **40** | +15 | da-026..030, 036..040, 046..050 |
| **ml** | 15 | **20** | +5 | ml-016..020 |
| **dl** | 15 | **20** | +5 | dl-016..020 |
| **fullstack** | 15 | **40** | +25 | fullstack-016..040 |
| **db** | 15 | **20** | +5 | db-016..020 |
| **Total** | **115** | **185** | **+70** | |

### Difficulty spread (current, all 185)

| Sector | Easy | Medium | Hard | Very Hard |
|---|---:|---:|---:|---:|
| py | 24 | 15 | 6 | 0 |
| da | 19 | 18 | 3 | 0 |
| ml | 6 | 7 | 5 | 2 |
| dl | 5 | 7 | 5 | 3 |
| fullstack | 13 | 21 | 6 | 0 |
| db | 6 | 9 | 4 | 1 |

**Reads at a glance:** the audit's note that "da is top-heavy" has eased (19 easy / 18 medium now,
vs 17/7 before — the new da batches are numpy + reasoning at medium). ml/dl keep the cleanest spread
across all four tiers. py and fullstack still cap at `hard` by design — these sectors' ceiling is
"tricky but known," which is correct for foundational debugging.

## Acceptance checklist

| Item | Status |
|------|--------|
| `pnpm check` (lint + typecheck + 134 unit + content:validate, 185 challenges) | **PASS** |
| `pnpm build` — `/app` First Load JS < 200 KB | **PASS — 200 kB** |
| `pnpm audit` — no known vulnerabilities | **PASS** (esbuild patched, see below) |
| Glossary mechanism (migration 019 + schema field + disclosure UI) | Done — 30 challenges carry entries |
| Sub-sector mechanism (migration 020 + `SUB_SECTOR_MAP` + sidebar filter) | Done — 25 challenges tagged |
| +70 gap-fill missions, every wrong option carries a named failure mode | Done |
| Existing 115 challenges untouched; new fields optional/nullable | Done |
| `pnpm test:db` (local stack) | **NOT RUN** — see Weak/unverified |
| `pnpm e2e` | **NOT RUN** — see Weak/unverified |

## What changed

### Mechanisms

- **Migration 019 — glossary** (`challenges.glossary jsonb`, nullable, no backfill, no RLS change).
  Threaded through `schema.ts` (optional Zod field), `source.ts` (`ChallengeRow` + `mapChallengeRow`),
  and `seed-content.ts`. UI is a small disclosure block in the notebook view; terms are defined
  inline so a junior never has to leave the mission to look up "leakage", "hydration", or "p-value".
  **30 challenges** carry glossary entries today.
- **Migration 020 — sub-sectors** (`challenges.sub_sector text`, nullable, no CHECK constraint).
  Valid values live in a TS registry (`src/lib/content/sub-sectors.ts`, `SUB_SECTOR_MAP`), validated
  by `checkSubSector` at `content:validate` time. Sidebar grows a third chip-row (below the track
  filter) that appears only when ≥1 sub-sector is tagged in the visible set. **25 fullstack missions**
  are tagged across `data-flow`, `error-handling`, `state-and-ui`, `async-and-network`. Other
  sectors' sub-sectors are registered in the map but not yet populated — future batches fill them
  one at a time.

### Content (the +70)

- **py-031..045** (15) — gap-fill on the audit's named py holes: type conversion, f-string format,
  accumulator pattern, return-vs-print, try/except, plus the late batch (list indexing, string
  immutability, dict `KeyError`, mutate-while-iterating, mutable default argument).
- **da-026..030, 036..040, 046..050** (15) — numpy foundations + histograms/heatmaps (figure
  pipeline), the reasoning-track easy batch, and joins / reshape / window functions / CTEs / EXPLAIN.
- **ml-016..020** (5) — `test_size` inversion, preprocessing leakage (`imputer.fit` on full data),
  the `C` inverse-regularization trap, `make_scorer` sign error, nested-CV evaluation bias.
- **dl-016..020** (5) — `CrossEntropyLoss` vs `BCEWithLogitsLoss`, loss-tensor accumulation memory
  leak, `scheduler.step()` per-batch vs per-epoch, `model.train()` left on in the eval loop,
  `clip_grad_norm_` called after `optimizer.step()`.
- **fullstack-016..040** (25) — the data-flow capstone arc plus error-handling (400/401-vs-403/
  404-two-meanings/429/500), state-and-ui (state mutation, zero-renders, stale closure, index key,
  controlled input), and async-and-network (infinite loop, race condition, `Promise.all` fail-fast,
  setState-after-unmount, sequential waterfall).
- **db-016..020** (5) — schema design, isolation levels, EXPLAIN, recursive CTE, cascade foot-gun.

Every mission follows the locked authoring rules: traceback matches the code, exactly one correct
option, each wrong option ships a realistic failure log + a rationale that names the specific failure
mode, YouTube links are search-query URLs only, ≥1200-char tutorial, `recruiterReview` on all.

### Security (same branch, separate concern)

- **esbuild advisory** [GHSA-gv7w-rqvm-qjhr](https://github.com/advisories/GHSA-gv7w-rqvm-qjhr)
  (high) + [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) (low). esbuild
  is a transitive devDependency (`vite>esbuild`, `tsx>esbuild`); patched via a `pnpm.overrides` entry
  forcing `esbuild@<0.28.1 → >=0.28.1`. `pnpm audit` is clean afterward; build is unaffected
  (build-time only, production bundle untouched). Commit `c54d748`.
  - **Note:** the originating Dependabot alert referenced **axios**, which is **not present in this
    repo on any branch** (verified: never in `package.json` or `pnpm-lock.yaml` history; the only
    `axios` string is documentation prose in a fullstack tutorial). esbuild is the actual live
    advisory `pnpm audit` reports.

## How this maps to the audit's gaps

The audit (§ "What's missing for a junior") named specific uncovered topics per sector. Coverage now:

| Audit gap | Addressed by |
|---|---|
| py: file I/O / JSON / regex | **Partial** — error-handling + data-structure gaps filled; file I/O / JSON / regex still open |
| da: window functions / CTEs / reshape | **Yes** — da-046..050 |
| ml: k-fold CV / GridSearch / encoding | **Yes** — make_scorer, nested-CV, leakage (ml-017..020); encoding choice still open |
| dl: `model.eval()` / scheduler / AMP | **Yes** for eval-mode + scheduler (dl-018, dl-019); AMP still open |
| fullstack: forms / a11y / error boundaries / testing | **Partial** — data-flow, error-handling, state, async covered; a11y / error boundaries / testing still open |
| db: schema design / isolation / EXPLAIN | **Yes** — db-016..020 |
| No in-context glossary | **Yes** — migration 019, 30 challenges seeded |

## Weak / unverified

- **`pnpm test:db` not run this phase.** The local Supabase stack is up (containers healthy), but the
  suite fails-loud on missing `SUPABASE_SERVICE_ROLE_KEY` / `.env.local` env wiring in this shell.
  Migrations 019 and 020 are additive nullable columns with no RLS change (same shape as 016/018
  which passed `test:db` previously), so the risk is low — but the parity suite has **not** been
  re-run against the new schema. **Action:** run `pnpm test:db` with env loaded before merge.
- **`pnpm e2e` not run this phase.** No UI behavior changed beyond additive disclosure blocks and a
  conditional sidebar chip-row, but the glossary disclosure and sub-sector chip have **no dedicated
  e2e assertion**. **Action:** add an e2e that opens a glossary-bearing mission and a sub-sector-tagged
  mission before relying on these in production.
- **`/app` First Load JS is at the 200 kB ceiling.** The glossary disclosure + sub-sector chip-row
  sit within budget at the rounded display value, but headroom is effectively zero. Any further
  `/app` additions (leaderboard link, placement entry) must go on separate routes or trim elsewhere.
- **Sub-sectors are fullstack-only.** 25/185 challenges are tagged; the other five sectors' sub-sectors
  are registered in `SUB_SECTOR_MAP` but carry no content. The sidebar correctly hides the chip-row
  where nothing is tagged, so this is invisible to users — but the taxonomy is advertised in code
  ahead of the content. Intentional (per the sub-sector plan), noted for honesty.
- **Glossary coverage is 30/185.** Concentrated on the jargon-heavy non-beginner additions. Sectors
  that throw terms without a glossary entry (older ml/dl/db missions) are unchanged — a future
  back-tagging pass, not in this phase's scope.
- **Audit gaps only partially closed.** py file-I/O/JSON/regex, fullstack a11y/error-boundaries/
  testing, ml encoding choice, and dl AMP remain open (table above). This phase made the catalog
  materially more employable but did not exhaust the audit's list.

## Deferred (named, not built — unchanged from the audit)

Placement quiz · leaderboard (5.6c) · Pyodide / browser execution · public `/portfolio/[username]` ·
portfolio OG card · CI staleness gate on figures. Each is its own sprint; the audit's §5 holds the
rationale and sequencing.

## Verification log (this phase)

```
pnpm check   → PASS (lint + typecheck + 134 unit tests + content:validate: 185 challenges)
pnpm build   → PASS (/app First Load JS 200 kB; compiled successfully, 361 static pages)
pnpm audit   → No known vulnerabilities found (all severities, prod + dev)
pnpm test:db → NOT RUN (missing env in shell; stack is up)
pnpm e2e     → NOT RUN
```

Commits this phase land on `feat/learn-first-layer` and are pushed after each batch per the standing
push-after-every-commit rule.
