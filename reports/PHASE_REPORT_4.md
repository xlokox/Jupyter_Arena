# Phase 4 Report — Supabase (Migrations, RLS, RPCs, Seed, Auth, Merge)

**Date:** 2026-06-10
**Status:** Complete. All checks green (84 unit, 42 DB integration, 15 e2e). Built and verified against the Supabase CLI local stack per the approved plan. Awaiting Daniel's review before Phase 5.

## What was built

- **Migrations** (`supabase/migrations/`, timestamps prefixing the brief's 001–007 names):
  schema exactly per Section 5 (+ two declared additions: `profiles.local_merged_at` for the one-time merge; unique `(challenge_id, position)` on `tutorial_videos` for idempotent upserts); deny-by-default **RLS on every table** with explicit write revokes; child-table reads gated on the parent challenge's `is_published` via `exists`; `public_profiles` view (username/display_name where `is_public` — PostgREST has no column-level RLS); `handle_new_user` signup trigger; `submit_attempt` and `merge_local_progress` security-definer RPCs (search_path pinned, `authenticated`-only execute).
- **`submit_attempt`** — server-side Section 9 in one transaction: rate guard (30/min), published-challenge + option validation with `is_correct` read server-side, progress upsert-and-lock (hints ratchet up), wrong = `greatest(-5, -xp)` floor, re-solve = 0 everything, first solve = +10/+5 first-try (`prior attempts = 0 ∧ hints ≤ 1`)/+5 daily with UTC streak math. Returns the locked shape + additive `events`/`already_solved` for the toast.
- **`merge_local_progress`** — one-time, ≤500 items, clamps (wrong ≤100, hints ≤2), published-only, skips account-solved; replays per-challenge events; single daily tick; no streak-history import; no synthetic attempt rows.
- **Seed** ([scripts/seed-content.ts](../scripts/seed-content.ts), `pnpm content:seed`) — reuses the Phase 1 fs loader/validator, natural-key upserts, unpublishes (never deletes) removed ids.
- **Content source** ([src/lib/content/source.ts](../src/lib/content/source.ts)) — anon-key server-side reads with ISR (`/` revalidate 1h; `/daily` `unstable_cache`); fs fallback when env absent; rows re-validated through the same Zod schema.
- **Auth** — email OTP (6-digit code, custom template, no callback route): lazy `SignInDialog`, `AuthProvider` in the root layout (lazy client bootstrap post-hydration, merge-on-first-sign-in, account hydration, sign-out reset), header sign-in/out, `@supabase/ssr` middleware with env-absent no-op.
- **Authed submit path** — `notebook-view` branches: authed = `Promise.all([RPC, min-delay])` → `applyServerOutcome` (server stats verbatim, server events drive the toast); RPC failure → `abortRun` + error alert, **never local XP for authed users**. Anonymous path byte-identical (original 77 tests untouched).
- **CI** — new `db` job: supabase CLI stack on the runner, seed twice, full integration suite.

## Acceptance evidence

| Criterion | Evidence |
|---|---|
| User A cannot read user B's rows | `rls-user-isolation.test.ts`: A reads zero of B's rows across user_stats/progress/attempts/xp_events (B's rows proven to exist via admin); anon reads nothing; profiles isolated; `public_profiles` exposes exactly `{username, display_name}` for opt-ins only |
| Unpublished content invisible | `rls-content.test.ts`: unpublished fixture + **every child table** invisible to anon *and* authenticated; `submit_attempt` also rejects it |
| XP only via the RPC | `xp-only-via-rpc.test.ts`: direct inserts to xp_events/attempts, updates to own `user_stats.xp` / `progress.solved_at`, attempt deletion, and anon RPC execution all denied; owner *can* update only username/display_name/is_public (column grant), not `local_merged_at` |
| Server-side correctness, client never trusted | `submit-attempt.test.ts` parity matrix mirroring `xp.test.ts`: 20/15-XP solve variants, hint ratchet across failed runs, floor at 0/3/20 XP, re-solve = 0 XP with stats deep-equal before/after (attempt still recorded), streak extend/lapse/longest via simulated days, level boundary, rate limit fires on the 31st call |
| Seed idempotent | `seed-and-parity.test.ts`: double-seed leaves exact row counts unchanged (8/24/16/8/16); CI also seeds twice; DB content **deep-equals** fs content challenge-for-challenge |
| Merge correct | `merge.test.ts`: replay math (15 XP for the mixed payload), strict one-time, skip-already-solved (no double XP), payload guards + clamps |
| App still green without a DB | env-less `pnpm check` (84/84) and `pnpm e2e` (15/15) pass on the fs/localStorage paths |
| Bundle + secrets | `/` = **185 kB** first-load (supabase-js lazy-loaded, never in the initial chunk); `grep -ri SUPABASE_SERVICE .next/static` → 0 hits |
| OTP flow real | GoTrue + Mailpit verified end-to-end via API: code email delivered with the custom template, `verifyOtp` returned a real access token |
| DB-backed serving | env-full build renders `/` with challenge content read through the anon-key client (RLS) |

## Declared deviations (per plan, one line each)

1. Content reads use the anon-key client **server-side with ISR + fs fallback** when env is absent — satisfies the RLS read contract while preserving SSG/SEO, the <200 kB budget, and DB-free CI for build/e2e.
2. `profiles.local_merged_at` column added to enforce the brief's one-time merge.
3. Merge grants a single daily tick and does not import streak history (client clocks untrusted).
4. Merge writes no synthetic `attempts` rows → authed accuracy starts at signup (no fabricated data).
5. `submit_attempt` returns additive `events`/`already_solved` keys beyond the locked five (toast needs the per-event breakdown).
6. `profiles` column-level read contract implemented as the `public_profiles` view.
7. Migration filenames carry CLI-required timestamps prefixing the brief's names.
8. Unique `(challenge_id, position)` on `tutorial_videos` (idempotent seed).
9. `supabase` CLI added as devDependency (local stack + migrations + Phase 7 deploys); `NODE_OPTIONS=--experimental-websocket` on seed/test scripts (supabase-js needs a WebSocket global on Node 20).

## Known gaps / weak spots

- **`options.is_correct` is anon-readable by design** — the client-side run simulation requires it; XP truth is server-side regardless. Stated here so the Phase 6 security pass treats it as a decision, not an oversight.
- **Rate guard counts only recorded attempts** — invalid-id spam aborts before any write and so never trips the limiter; PostgREST/GoTrue-level rate limits cover that vector in production.
- After sign-out the localStorage progress is intentionally empty (the anonymous copy was consumed by the merge); a user who signs out mid-session starts fresh locally.
- The `db` CI job is untested until the repo first pushes to GitHub (same caveat as the Phase 1 workflow).
- Authed accuracy counters hydrate from two `count` head-queries per sign-in; fine now, consider a view if it ever shows in latency.
- Manual browser walk-through of the sign-in dialog was not performed; the flow's pieces are covered by the GoTrue/Mailpit API check + integration tests. Worth one manual pass during Phase 6 hardening.

## How to run locally

```
pnpm db:start                          # local stack (Docker)
eval $(pnpm exec supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)')
export NEXT_PUBLIC_SUPABASE_URL=$API_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
pnpm content:seed && pnpm test:db      # seed + acceptance suite
pnpm dev                               # sign-in codes land in Mailpit: http://127.0.0.1:54324
```

## Suggested next (Phase 5)

Content sprint to 60: author the remaining 52 challenges from the Section 7 catalog through the factory rules, batches of 5 per commit, `content:validate` green between batches.
