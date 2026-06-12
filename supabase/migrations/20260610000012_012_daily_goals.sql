-- 012_daily_goals — per-UTC-day solve goal (Phase 5.6b).
-- A progress counter only: completing the goal grants no XP (Section 9 is
-- frozen). "Daily Devoted" badge counts completed goals. Rows are written only
-- by submit_attempt v3 (security definer); clients never write.

create table public.user_daily_goals (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  goal_date       date not null,
  target_solves   int  not null default 3 check (target_solves > 0),
  progress_solves int  not null default 0 check (progress_solves >= 0),
  completed_at    timestamptz,
  primary key (user_id, goal_date)
);

alter table public.user_daily_goals enable row level security;

revoke insert, update, delete on public.user_daily_goals from anon, authenticated;

create policy "own daily goals are readable"
  on public.user_daily_goals for select
  to authenticated
  using (user_id = (select auth.uid()));
