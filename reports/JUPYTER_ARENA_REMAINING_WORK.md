# JUPYTER ARENA — REMAINING WORK REPORT

**Date:** June 2026 · **Baseline:** `MASTER_BRIEF.md` v1.0 · **Evidence:** session report through commit `6ea67b0`
**Honesty note:** This report is reconstructed from the session log, not a live repo scan. Step 0 below verifies every count against the actual working tree before any new work starts.

---

## 1. BOTTOM LINE

| Phase | Status |
|---|---|
| 0 — Foundation | ✅ Done (inferred: app shell, config, CI conventions in place) |
| 1 — Content engine (8 seeds) | ✅ Done (`*-001` and `*-002` exist in all four sectors) |
| 2 — Notebook engine UI | ✅ Done (notebook-view, sidebar, app-shell all live and being refined) |
| 3 — Gamification / tutorials / portfolio | ✅ Done (gamification e2e, tutorial-view, portfolio-view exist) — **daily challenge unverified, see §4** |
| 4 — Supabase + auth | ✅ Done (sign-in-dialog + `auth-merge.spec.ts` local→account merge test exist) |
| 5 — Content sprint to 60 | 🔶 **35 / 60 challenges** — ML and DL complete, Full Stack and Databases barely started |
| 6 — Hardening | 🔶 Roughly one-third done (SEO routes, CSP, error boundaries, payload split shipped; budgets, a11y pass, security evidence, full e2e remain) |
| 7 — Launch | ⬜ Not started |

The single biggest block of remaining work is **25 challenges, all in Full Stack and Databases**, followed by the Phase 6 verification checklist and the entire launch phase.

---

## 2. STEP 0 — VERIFY BEFORE BUILDING

Run these and reconcile against this report before authoring anything:

```bash
ls content/challenges/*/ | sort            # actual challenge inventory
pnpm check                                  # lint + typecheck + unit + content:validate
pnpm test:e2e                               # confirm which journeys actually pass
```

The session log never shows `pnpm content:validate` running after the 27 new challenges and 4 fixes were committed. Treat the 35 existing challenges as **unverified until the validator passes** — Non-Negotiable #4 (every challenge technically true) applies retroactively.

---

## 3. PHASE 5 REMAINDER — 25 CHALLENGES

Current inventory (per session evidence): ML **15/15** ✅ · DL **15/15** ✅ · Full Stack **3/15** · Databases **2/15**.

Author the following from the Section 7 catalog in `MASTER_BRIEF.md`. The catalog rows are the source of truth — do not invent replacements, do not "rebalance" difficulties (the original-spec seeds fix `fs-001` at medium and `db-001` at very_hard, so these two sectors land at 4 easy / 5 medium / 3 hard / 3 very_hard; that is accepted).

### Full Stack — 12 missing (`fullstack-004` → `fullstack-015`)

| ID | Diff | Concept |
|---|---|---|
| fullstack-004 | easy | Controlled input with `value=` but no `onChange` — frozen field |
| fullstack-005 | easy | `res.json()` without checking `res.ok` — parsing an HTML error page |
| fullstack-006 | medium | Object literal in a `useEffect` dependency array — infinite render loop |
| fullstack-007 | medium | Search race condition — slow earlier response overwrites newer one (`AbortController`) |
| fullstack-008 | medium | `addEventListener` in an effect with no cleanup — duplicate handlers / leak |
| fullstack-009 | medium | Sequential `await` in a loop for independent requests — `Promise.all` |
| fullstack-010 | hard | CORS "fixed" client-side — correct server `Access-Control-Allow-*` headers |
| fullstack-011 | hard | `Date.now()` rendered during SSR — hydration mismatch |
| fullstack-012 | hard | Debounced function recreated every render — never debounces (stable ref) |
| fullstack-013 | very_hard | JWT in `localStorage` read by XSS — httpOnly + SameSite cookie |
| fullstack-014 | very_hard | Async Express route throws, error middleware never reached — `next(err)` |
| fullstack-015 | very_hard | State set on unmounted component after slow fetch — abort on cleanup |

### Databases — 13 missing (`db-003` → `db-015`)

| ID | Diff | Concept |
|---|---|---|
| db-003 | easy | `WHERE deleted_at = NULL` returns nothing — `IS NULL` |
| db-004 | easy | Full scan on `orders.customer_email` — add index, read the plan |
| db-005 | easy | Naive `timestamp` columns mixing local times — `timestamptz` |
| db-006 | medium | ORM N+1 on the orders page — join / eager load |
| db-007 | medium | Two-statement money transfer without a transaction — atomic transfer |
| db-008 | medium | `OFFSET 100000` deep pagination — keyset (cursor) pagination |
| db-009 | medium | `WHERE lower(email) = $1` ignores the plain index — expression index |
| db-010 | medium | `LIKE '%term%'` can't use b-tree — `pg_trgm` GIN / full-text search |
| db-011 | hard | Two workers lock rows in opposite order — consistent ordering, `SKIP LOCKED` |
| db-012 | hard | Index `(status, created_at)` unused when filtering only `created_at` — column order |
| db-013 | hard | Read-modify-write race on inventory count — atomic UPDATE / `FOR UPDATE` |
| db-014 | very_hard | `ADD COLUMN ... NOT NULL DEFAULT now()` rewrites/locks a huge table — batched backfill |
| db-015 | very_hard | New connection per serverless invocation — pooled connection string |

**Process:** batches of 4–5 challenges per commit (Working Agreement #7 — the 63-file commit `6ea67b0` bundled too many concerns; return to small labeled commits). Every batch passes `pnpm content:validate` before the next begins. Each challenge ships complete per the Section 6 authoring rules: 3 options with wrong-path result logs, 2 hints, explanation, recruiter review, 400–700-word tutorial, 2 YouTube **search** links.

**Phase close:** validator green on all 60 → spot-check protocol documented → `reports/PHASE_REPORT_5.md` written (none of the phase reports appear in the log — confirm `reports/` exists and backfill if missing).

---

## 4. PHASE 6 REMAINDER

Already shipped (verify, don't redo): `robots.ts`, `sitemap.ts`, `error.tsx`, `not-found.tsx`, CSP + security headers in `next.config.ts`, Section-11 payload split (meta-only sidebar + on-demand bodies), focus trap, `auth-merge.spec.ts`, updated gamification + workspace e2e.

Still open, with the brief's acceptance bar:

1. **Performance budgets** — Lighthouse on a throttled mid-tier mobile profile; workspace route JS < 200 KB gzipped, LCP < 2.5s, CLS < 0.1; record the numbers in the phase report.
2. **Accessibility pass** — axe clean on workspace, tutorial, and portfolio; keyboard-only solve flow; contrast ≥ 4.5:1 on every amber-on-dark pairing; `prefers-reduced-motion` honored; output cells `aria-live="polite"`.
3. **Security checklist with evidence** (Section 11, line by line): authz tests proving user A cannot read user B's rows and unpublished content is invisible; grep the production client bundle for the service key and any `SUPABASE_SERVICE` string; verify `submit_attempt` rate limit fires; confirm markdown renders with raw HTML disabled and zero `dangerouslySetInnerHTML`; `pnpm audit` clean or exceptions documented.
4. **E2E coverage** — five journeys required: solve happy path, wrong-answer path, filter/search, tutorial nav, anonymous→signup merge. Merge exists; audit which of the other four are genuinely covered by the updated specs and fill the gaps.
5. **Daily challenge** — not visible anywhere in the session evidence. Verify it exists (route + deterministic-per-UTC-date test). If it was never built in Phase 3, build it now; it is a MUST.
6. **SEO finish** — per-challenge metadata/OG tags on the new permalink pages; OG image generation remains an optional SHOULD.

---

## 5. PHASE 7 — LAUNCH (entirely remaining)

Production Vercel + Supabase config and env documentation; run migrations + seed against production; `README.md` with screenshots and architecture diagram (this is also the portfolio artifact — do it properly); launch checklist (domain, privacy-light analytics, error monitoring, content repo backup); tag `v1.0.0`. Acceptance: a cold-start anonymous user on a phone solves a challenge end-to-end on the production URL.

---

## 6. HOUSEKEEPING

1. `rm -rf .dl007-tmp/` — leftover scratch dir from dl-007 authoring.
2. **Skill fix:** `next-best-practices` failed because it lives in a different repo than the one tried. Correct command: `npx skills add vercel-labs/next-skills`. (`context-mode` and `code-simplifier` were never part of the recommended set — drop them.)
3. Optional: 20 skills are active and all load as context. Safe to prune the superpowers you won't use (`writing-skills`, `receiving-code-review`, `using-git-worktrees`) to keep sessions lean.
4. Confirm `reports/` phase reports exist for Phases 0–4; backfill brief ones if not (they are the audit trail the brief requires).

---

## 7. PASTE-READY NEXT WORK ORDER FOR CLAUDE CODE

```
Read MASTER_BRIEF.md and JUPYTER_ARENA_REMAINING_WORK.md in full.

1. Execute Step 0 of the remaining-work report: inventory content/challenges, run
   pnpm check and pnpm test:e2e, and reconcile actual state against the report.
   Post the reconciliation before writing anything.
2. Finish Phase 5: author fullstack-004..015 and db-003..015 exactly per the
   catalog tables, in batches of 4-5 per commit, validator green between batches.
   Close with reports/PHASE_REPORT_5.md.
3. Stop for my review before starting the Phase 6 checklist.
Follow MASTER_BRIEF.md Section 12 at all times. Do not touch anything in Phase 7.
```

*End of report.*
