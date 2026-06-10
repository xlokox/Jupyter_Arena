# Phase 1 Report — Content Engine

**Date:** 2026-06-10
**Status:** Complete. All checks green. Awaiting Daniel's review before Phase 2.

## What was built

- **Schema** ([src/lib/content/schema.ts](../src/lib/content/schema.ts)): Zod `ChallengeSchema` exactly as written in brief Section 6, plus `SectorSchema`/`SectorsFileSchema` and exported TS types. Mirrors the Phase 4 Postgres columns 1:1.
- **Validator** ([src/lib/content/validate.ts](../src/lib/content/validate.ts)): pure, unit-testable functions implementing the Section 6 QA pipeline — Zod parse, duplicate-ID check, exactly-one-correct check, line-range bounds check, banned-pattern scan (`youtube.com/watch`, `TODO`, `lorem`) — plus two consistency checks beyond the brief: file name must equal `{id}.json`, and the directory must match the declared sector.
- **CLI** ([scripts/validate-content.ts](../scripts/validate-content.ts)): `pnpm content:validate` walks `/content`, prints every failure, exits non-zero. Wired into `pnpm check`.
- **CI** ([.github/workflows/ci.yml](../.github/workflows/ci.yml)): `pnpm check` + Playwright e2e on every push/PR.
- **Tests**: 17 validator tests — every QA rule proven by deliberate violation (invalid JSON, bad id pattern, 0 and 2 correct options, out-of-bounds and inverted line ranges, hardcoded YouTube link, TODO, lorem, filename mismatch, wrong sector dir, short tutorial) plus duplicate-ID and sectors-file cases. 21 tests total in the suite.
- **Content**: `content/sectors.json` + 8 fully authored challenges.

## The 8 challenges

| ID | Difficulty | Bug → fix |
|---|---|---|
| `ml-001-kmeans-scaling` *(spec seed)* | easy | Raw age/income into KMeans → StandardScaler |
| `ml-002-test-set-leakage` | easy | `fit_transform` on X_test → `transform` only |
| `dl-001-device-mismatch` *(spec seed)* | hard | CPU batches into CUDA model → `.to(device)` in loop |
| `dl-002-missing-zero-grad` | easy | Gradient accumulation explosion → `optimizer.zero_grad()` |
| `fullstack-001-stale-closure` *(spec seed)* | medium | Stale `clicks` sent to API → local `next` variable |
| `fullstack-002-index-keys` | easy | `key={index}` on reorderable list → stable `task.id` |
| `db-001-pool-leak` *(spec seed)* | very_hard | Early return skips `putconn` + holds FOR UPDATE lock → `try/finally` + rollback |
| `db-002-sql-injection` | easy | f-string SQL → parameterized query |

Every challenge has: 3 options with full `patchCode` and realistic per-option failure/success logs (wrong answers run too), 2-stage hints, mechanism+principle explanation, senior-voice recruiter review, 400–700-word tutorial ending with a "common variations" list, and 2 YouTube **search-query** video cards.

## Verification of technical truth (manual, per brief Section 6 QA)

- **Tracebacks**: real exception classes and message formats — `RuntimeError: Expected all tensors to be on the same device... (when checking argument for argument mat1 in method wrapper_CUDA_addmm)` (and the `target`/`nll_loss` variant for the wrong option), `psycopg2.pool.PoolError: connection pool exhausted`, sklearn's verbatim `ConvergenceWarning` text, `AttributeError: 'DataLoader' object has no attribute 'to'`. Line numbers in every traceback/result log were hand-checked against the exact line numbering of the code they claim to run (one off-by-one found and fixed in db-002 option C during authoring).
- **Non-crashing bugs** (KMeans scaling, stale closure, index keys) are surfaced through in-code assertions or failing-test output, so the red log is genuinely producible by the code shown — no fabricated warnings.
- **Wrong options** each compile conceptually and show their own realistic outcome, including two deliberate "the gate turns green but you're still wrong" silent-failure teaches (ml-002 fit-before-split, db-002 quote-escaping).

## Deviations from the brief

1. **`tsx` added as devDependency** — TypeScript runner for the validator CLI; dev-only, no runtime impact. (Declared here per the locked-list rule.)
2. **Two validator checks added beyond Section 6** (filename↔id, directory↔sector) — they make the Phase 4 seed script safer and cost nothing. Flagging as additive, not a changed decision.
3. New challenges' display filenames continue the original spec's numbering (05–08) rather than restarting per sector — purely cosmetic; IDs follow the brief's `{sector}-{nnn}-{slug}` exactly.
4. CI workflow added in Phase 1 (the brief shows CI gates from Phase 1 but lists e2e-in-CI under Phase 6 testing; both jobs are in now — noted, not weakened).

## Known gaps / weak spots

- Authored outputs (loss curves, accuracy numbers, cluster tables) are *plausible* rather than machine-reproduced; per the brief, headless execution lands with the Pyodide flag in v1.5 and manual verification is recorded in commit messages until then.
- The CI workflow has not yet run on GitHub (no remote configured); it is untested config until first push.
- `estMinutes` values are editorial estimates.

## Suggested next (Phase 2)

Notebook engine: Zustand store, workspace cells (markdown briefing, code cell with tokenizer highlighting + bug-region band, output cell with red→green transition and wrong-path logs), option panel, 2-stage hints, explanation + recruiter card, filters, sidebar tabs, mobile drawer, keyboard support — all against these 8 seeds.
