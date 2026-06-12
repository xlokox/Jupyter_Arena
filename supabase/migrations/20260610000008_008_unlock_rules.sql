-- 008_unlock_rules — difficulty → minimum level mapping + per-challenge override
-- (MASTER_BRIEF.md Phase 5.5; enforce server-side in 009_submit_attempt_locked)

create table public.unlock_rules (
  difficulty text primary key
    check (difficulty in ('easy','medium','hard','very_hard')),
  min_level  int  not null check (min_level >= 1)
);

insert into public.unlock_rules (difficulty, min_level) values
  ('easy',      1),
  ('medium',    3),
  ('hard',      6),
  ('very_hard', 10);

-- Per-challenge override: COALESCE(override, rule) = effective unlock level.
-- NULL means "use the difficulty rule" (the common case).
alter table public.challenges
  add column if not exists unlock_level_override int;

-- RLS: readable by everyone (drives client-side UX display; enforcement is in the RPC)
alter table public.unlock_rules enable row level security;

create policy "unlock_rules_read" on public.unlock_rules
  for select to anon, authenticated using (true);
