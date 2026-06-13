-- 019_glossary — in-context glossary on each challenge. A nullable jsonb
-- column with the shape [{ term, definitionMd }, ...]. Capped at 8 entries
-- per challenge by the Zod schema in src/lib/content/schema.ts. The UI
-- renders a small <details>-style disclosure next to the briefing when
-- the field is non-null. Existing 115 rows stay null and the UI hides.
-- No backfill, no RLS change. Same shape as 016 (learn_first) and 017
-- (graph_figures).
alter table public.challenges
  add column glossary jsonb;
