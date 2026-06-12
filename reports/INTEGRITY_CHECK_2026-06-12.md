# Integrity & Functional Health Check — 2026-06-12

Diagnostic pass, not a build. Three reported failures — **login broken**, **missions don't
work**, **placement quiz unknown** — investigated against the running local stack. Findings,
root causes, the minimal fixes applied, full verification output, and a per-journey pass/fail.

Branch: `feat/learn-first-layer`. Two small commits added (`b6d5940`, `7f2733b`); the
pre-existing landing-V2 working-tree changes were left untouched.

---

## TL;DR

| # | Report | Verdict | Root cause | Action |
|---|--------|---------|-----------|--------|
| 1 | Login broken | **Confirmed → fixed** | No `.env.local` — local dev was never wired to the running Supabase stack, so the browser client was null and OTP send failed | Created `.env.local` (gitignored **config**, not a code bug) |
| 2 | Missions don't work | **Not reproducible as a bug** | Downstream symptom of login being dead (no env) and/or the beginner concept-card gate reading as "won't open" | None — anon + authed mission flows both work end-to-end |
| 3 | Placement quiz | **Confirmed MISSING** | Never built (no route, no content, no xp reason) | Did **not** build it; added an honest signup notice + TODO |
| 4 | *(found during journey-e)* anon→account merge **data loss** on standalone /login,/signup | **Confirmed → fixed** | Store never rehydrated on those pages → merge collected nothing → `hydrateFromServer(0)` overwrote localStorage | One-line fix: `await persist.rehydrate()` before collecting merge items |

---

## Environment & config sanity (done before assuming any code bug)

- **`.env.local`** — was **absent**. This is the whole login story (see #1). Created it from
  `supabase status` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`. **Gitignored — not committed.**
- **Supabase stack** — running (Docker, `supabase_db_Jupyter_Arena`). Mailpit reachable at
  `127.0.0.1:54324` (OTP delivery verified).
- **Migrations** — applied through `20260610000016` (016 learn-first). `concept_card`,
  `line_notes`, `takeaway` columns present on `public.challenges`.
- **Content seeded** — 90 published challenges (+1 unpublished test fixture `ml-099`), all 6
  sectors present with correct `is_gated` (`py`, `da` ungated).
- **RLS** — no public table without RLS; `on_auth_user_created` trigger present and creating
  `profiles` rows.
- **`xp_events.reason` constraint** — `correct_fix, wrong_fix, first_try_bonus,
  daily_first_solve`. **No `placement`** value — corroborates #3.

---

## 1. Login — CONFIRMED, root-caused, fixed

**Actual failure (captured, not guessed):** the OTP request errored with the form's
"Couldn't send the code." message.

**Root cause:** `publicSupabaseEnv()` returns `null` when `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent → `getBrowserClient()` returns `null` → auth is
disabled and content silently falls back to the fs path. With no `.env.local`, **the local dev
server was never connected to the running Supabase stack.** This is environment config, **not a
code defect** — the anonymous-first fallback behaved exactly as designed.

**Fix:** created `.env.local` (gitignored). Nothing in the codebase changed for login.

**Verified end-to-end (browser, real OTP):** request code → Mailpit delivers → verify → signed
in → redirected to `/app` → `profiles` row auto-created by the trigger → no merge crash.

---

## 2. Missions — NOT a bug (anon + authed both work)

Could **not** reproduce a broken mission. Both paths drive cleanly:

- **Anonymous (fs + local math):** open `py-001` → concept card → "Begin challenge" → pick fix →
  Run → "Fix verified", **+20 XP**, takeaway chip renders.
- **Authed (DB + `submit_attempt` RPC):** open `da-001` → submit → server awards **+20 XP**
  (`correct_fix:10, first_try_bonus:5, daily_first_solve:5`), HUD updates.

Migration 016's jsonb columns did **not** regress `submit_attempt` or the content load
(`mapChallengeRow` round-trips `line_notes`). The most likely origin of the report: with no env
(see #1) you could never sign in, so authed missions were unreachable; and the beginner
**concept-card gate** shows a card *before* the notebook, which can read as "the mission won't
open." No mission code change was warranted, and none was made.

---

## 3. Placement quiz — CONFIRMED MISSING (not built, per instruction)

Evidence it does not exist end-to-end:
- No route under `src/app/` (no `placement/`).
- No `content/placement/`, no placement schema/loader.
- No `'placement'` value in the `xp_events.reason` check constraint.
- Both phase reports list it as the **next** unbuilt foundations deliverable.

Per the instruction ("if MISSING, do NOT build it"), I did not build it. Instead:
- Added an honest notice on `/signup` (commit `b6d5940`): *"the placement quiz … isn't live yet.
  New to coding? Start with Python Fundamentals — it's open to everyone, no level required."*
- **TODO (carried):** build the placement quiz — migration (`'placement'` xp reason +
  `experience_level`), routing, privacy — per the foundations spec.

---

## 4. Found while verifying journey (e): anon→account merge DATA LOSS — fixed

**Symptom:** solve a mission anonymously (20 XP in localStorage), then sign up via the
standalone `/signup` page → land in `/app` signed in with **0 XP, 0 solved**. The anonymous
progress was not merged **and** was destroyed.

**Root cause (plain language):** `AuthProvider.syncAccount` collects merge items from
`useWorkspaceStore.getState().attempts`, but on the standalone `/login` and `/signup` pages the
workspace store is **never rehydrated** from localStorage — `persist.rehydrate()` is only called
by `AppShell`, which mounts under `/app`. So the merge saw an empty store, sent nothing, and the
subsequent `hydrateFromServer(0)` overwrote localStorage to 0. The in-app sign-in **dialog** path
(rendered inside `AppShell`) was already fine; only the dedicated pages lost data. Pre-existing —
not introduced by recent work — but it silently breaks Non-Negotiable #2 (and the page literally
promises "sync your XP").

**Fix (commit `7f2733b`):** `await useWorkspaceStore.persist.rehydrate()` before
`collectMergeItems`. One line, runs only on the env-present path.

**Proof — before/after at the DB level (server-authoritative):**

```
merge-test@example.com   | xp=0  | (no xp_events)                                    # pre-fix: lost
merge-test2@example.com  | xp=20 | correct_fix:10, first_try_bonus:5, daily_first_solve:5  # post-fix: merged
```

Browser confirmed: post-fix the standalone-page signup lands at `/app` with **20 XP, 1 solved**.

---

## Verification output (actual)

**`pnpm check`** — PASS
```
eslint . / tsc --noEmit            (clean)
Test Files  7 passed (7)
     Tests  130 passed (130)
content:validate passed — 90 challenge(s), 90 parsed.
```

**`pnpm test:db`** (local stack) — PASS
```
Test Files  14 passed (14)
     Tests  74 passed (74)
```

**`pnpm e2e`** — PASS
```
31 passed, 1 skipped   (29.1s)
```
> Run on the **fs/anonymous path** (env-less), which is how this suite is tuned and how CI runs
> it. With `.env.local` present the dev server is DB-backed and dev-mode DB latency exceeds the
> suite's 5 s assertions (content-load timeouts), so e2e is intentionally run env-less; the
> auth/DB paths are proven by `test:db` + the manual browser smokes above. The one skip is the
> pre-existing `auth-merge` spec (needs the stack + Mailpit in the runner).

**`pnpm build`** — PASS, `/app` First Load JS **198 kB** (< 200; thin headroom)
```
○ /app       136 B   198 kB
○ /login     124 B   113 kB
○ /signup    124 B   113 kB
```

---

## Five core journeys

| | Journey | Verdict | Evidence |
|---|---|---|---|
| a | Anon solves a `py` mission → XP/level update | **PASS** | Browser: `py-001` +20 XP, HUD updates; `gamification.spec` covers a solve |
| b | Gated challenge shows lock UI + RPC rejects underleveled | **PASS** | `tests/db` level-gating (RPC raises `challenge_locked`); `LockedPanel` renders when `meta.unlockLevel > level` |
| c | Signup → profile created → returns to app | **PASS** | Browser OTP signup; `profiles` row auto-created by trigger; placement notice now shown |
| d | Login (existing user) → open mission → submit | **PASS** | Browser: signed in, `da-001` via `submit_attempt`, +20 XP server-side |
| e | Solve anon → sign up → progress merges | **PASS (after fix #4)** | DB before/after (0 → 20 XP); was **FAIL** before the rehydrate fix |

---

## Weak / unverified — flagged honestly

- **STRUCTURAL (most important):** the login fix is **local config only**. **Production must
  independently** carry `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, have
  migrations applied **through 016**, and have content **seeded** — otherwise prod login and
  DB-backed content fail the same way local did. Not verifiable from here; must be checked on the
  deploy target before shipping.
- **Merge fix is proven by manual browser + DB, not by an automated test.** The `auth-merge` e2e
  spec stays skipped in the standalone run. A regression test for the standalone-page merge would
  be worth adding (out of scope for this diagnostic pass).
- **`/app` headroom is thin (198/200 kB).** Any further `/app` work (placement entry, leaderboard
  links) must watch this and prefer separate routes.
- **Placement quiz remains a TODO** (notice added, feature not built — by instruction).

## Commits

- `b6d5940 fix(auth): note placement quiz is not live yet on signup`
- `7f2733b fix(auth): rehydrate workspace store before merging anon progress`
- `.env.local` — created, **gitignored, not committed** (the login fix is config, not code).
