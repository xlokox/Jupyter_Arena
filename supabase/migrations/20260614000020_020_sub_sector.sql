-- 020_sub_sector — the optional sub-sector tag for organising challenges by
-- the real-world job a programmer does (e.g. "data-flow" inside Full Stack).
-- Single nullable text column, additive, no RLS change, no backfill. Same
-- shape as 018 (track) and 019 (glossary). Valid values are kept in the
-- TS map src/lib/content/sub-sectors.ts; no DB CHECK constraint so adding
-- a new sub-sector is a TS edit only.
alter table public.challenges
  add column sub_sector text;
