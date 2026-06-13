-- 016_learn_first — the learn-first layer for beginner sectors (py, da).
-- Three nullable, additive columns on challenges. Existing rows stay null;
-- beginner challenges get values on the next content:seed. No backfill, no RLS
-- change (published challenges are already world-readable). conceptCard + a
-- line-by-line notes array are authored as data and rendered before/inside the
-- notebook; takeaway is a one-line post-solve chip. The validator (TS-side)
-- requires conceptCard + lineNotes for py/da only.
alter table public.challenges
  add column concept_card text,
  add column line_notes   jsonb,
  add column takeaway     text;
