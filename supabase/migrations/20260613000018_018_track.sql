-- 018_track — the reasoning vs debugging track field. Single nullable, additive
-- column on challenges; existing rows stay null and are read as 'debugging' on
-- the client (default). The set of valid values is kept to the TS enum in
-- src/lib/content/schema.ts (no DB CHECK) so future track additions don't need
-- a migration. No backfill, no RLS change.
alter table public.challenges
  add column track text;
