-- 004_rls — deny-by-default Row Level Security on every table
-- (MASTER_BRIEF.md Sections 5 and 11).

alter table public.sectors                  enable row level security;
alter table public.challenges               enable row level security;
alter table public.challenge_options        enable row level security;
alter table public.challenge_hints          enable row level security;
alter table public.tutorials                enable row level security;
alter table public.tutorial_videos          enable row level security;
alter table public.profiles                 enable row level security;
alter table public.user_stats               enable row level security;
alter table public.user_challenge_progress  enable row level security;
alter table public.attempts                 enable row level security;
alter table public.xp_events                enable row level security;

-- Belt-and-braces on top of RLS: clients never write any table directly.
-- Content is written by the seed script (service role); user-state writes go
-- exclusively through the security-definer RPCs.
revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ── Content: readable when the (parent) challenge is published ─────────────
create policy "sectors are readable"
  on public.sectors for select
  to anon, authenticated
  using (true);

create policy "published challenges are readable"
  on public.challenges for select
  to anon, authenticated
  using (is_published);

create policy "options of published challenges are readable"
  on public.challenge_options for select
  to anon, authenticated
  using (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.is_published
  ));

create policy "hints of published challenges are readable"
  on public.challenge_hints for select
  to anon, authenticated
  using (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.is_published
  ));

create policy "tutorials of published challenges are readable"
  on public.tutorials for select
  to anon, authenticated
  using (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.is_published
  ));

create policy "videos of published challenges are readable"
  on public.tutorial_videos for select
  to anon, authenticated
  using (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.is_published
  ));

-- ── Profiles: owner reads/updates own row; public exposure via view only ───
create policy "own profile is readable"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "own profile is updatable"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- The update policy is intentionally the only direct client write in the
-- schema (username/display_name/is_public); re-grant just that surface.
grant update (username, display_name, is_public) on public.profiles to authenticated;

-- PostgREST has no column-level RLS: the public read contract
-- (username + display_name where is_public) is a view. security_invoker off
-- (owner view) — the WHERE clause is the gate; future leaderboard surface.
create view public.public_profiles
  with (security_invoker = off) as
  select username, display_name
  from public.profiles
  where is_public;

grant select on public.public_profiles to anon, authenticated;

-- ── User state: owner-only select; zero write policies ─────────────────────
create policy "own stats are readable"
  on public.user_stats for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "own progress is readable"
  on public.user_challenge_progress for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "own attempts are readable"
  on public.attempts for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "own xp events are readable"
  on public.xp_events for select
  to authenticated
  using (user_id = (select auth.uid()));
