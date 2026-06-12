-- 011_badges — achievement definitions + per-user awards (Phase 5.6b).
-- Badges are achievements, NOT XP: they never touch xp_events (whose reason
-- CHECK only allows the four Section-9 XP reasons) and never change an XP
-- amount. Definitions are seeded data; awards are written only by the
-- security-definer RPCs (submit_attempt v3 / merge_local_progress v2), never by
-- clients. The award criteria live in code (src/lib/game/badges.ts ⇄ the SQL
-- award_badges() in 014) — kept in lockstep with a parity test.

create table public.badge_definitions (
  id              text primary key,
  name_key        text not null,
  description_key text not null,
  icon            text not null,            -- a challenge-icon.tsx ICONS map key
  tier            text not null check (tier in ('bronze', 'silver', 'gold')),
  sort            int  not null
);

create table public.user_badges (
  user_id                   uuid not null references public.profiles(id) on delete cascade,
  badge_id                  text not null references public.badge_definitions(id),
  earned_at                 timestamptz not null default now(),
  triggered_by_challenge_id text references public.challenges(id),
  unique (user_id, badge_id)
);

create index on public.user_badges (user_id);

-- ── RLS: definitions readable by everyone; awards owner-only; zero writes ────
alter table public.badge_definitions enable row level security;
alter table public.user_badges        enable row level security;

-- The blanket revoke in 004 only covered tables that existed then; re-assert it
-- for the new tables so clients can never write awards directly.
revoke insert, update, delete on public.badge_definitions, public.user_badges
  from anon, authenticated;

create policy "badge definitions are readable"
  on public.badge_definitions for select
  to anon, authenticated
  using (true);

create policy "own badges are readable"
  on public.user_badges for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ── Seed the starter set (idempotent) ───────────────────────────────────────
-- icon values must be keys registered in src/components/challenge-icon.tsx.
-- Sector Sweep thresholds are derived from the published catalog at eval time
-- (not encoded here), so the set stays correct as the library grows.
insert into public.badge_definitions (id, name_key, description_key, icon, tier, sort) values
  ('first_blood',            'badges.first_blood.name',            'badges.first_blood.description',            'zap',          'bronze', 10),
  ('streak_keeper_3',        'badges.streak_keeper_3.name',        'badges.streak_keeper_3.description',        'flame',        'bronze', 20),
  ('flawless_five',          'badges.flawless_five.name',          'badges.flawless_five.description',          'sparkles',     'silver', 30),
  ('no_hints_needed',        'badges.no_hints_needed.name',        'badges.no_hints_needed.description',        'shield-check', 'silver', 40),
  ('polyglot',               'badges.polyglot.name',               'badges.polyglot.description',               'languages',    'silver', 50),
  ('streak_keeper_7',        'badges.streak_keeper_7.name',        'badges.streak_keeper_7.description',        'flame',        'silver', 60),
  ('traceback_hunter',       'badges.traceback_hunter.name',       'badges.traceback_hunter.description',       'target',       'gold',   70),
  ('sector_sweep_ml',        'badges.sector_sweep_ml.name',        'badges.sector_sweep_ml.description',        'brain',        'gold',   80),
  ('sector_sweep_dl',        'badges.sector_sweep_dl.name',        'badges.sector_sweep_dl.description',        'layers',       'gold',   90),
  ('sector_sweep_fullstack', 'badges.sector_sweep_fullstack.name', 'badges.sector_sweep_fullstack.description', 'server',       'gold',   100),
  ('sector_sweep_db',        'badges.sector_sweep_db.name',        'badges.sector_sweep_db.description',        'database',     'gold',   110),
  ('streak_keeper_30',       'badges.streak_keeper_30.name',       'badges.streak_keeper_30.description',       'flame',        'gold',   120),
  ('daily_devoted',          'badges.daily_devoted.name',          'badges.daily_devoted.description',          'crown',        'gold',   130)
on conflict (id) do update set
  name_key        = excluded.name_key,
  description_key = excluded.description_key,
  icon            = excluded.icon,
  tier            = excluded.tier,
  sort            = excluded.sort;
