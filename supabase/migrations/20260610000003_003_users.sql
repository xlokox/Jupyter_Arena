-- 003_users — user tables, MASTER_BRIEF.md Section 5
-- (+ profiles.local_merged_at, a declared addition enforcing the one-time
--  local→account merge).

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name    text,
  is_public       boolean not null default false,
  local_merged_at timestamptz,
  created_at      timestamptz not null default now()
);

create table public.user_stats (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  xp             int  not null default 0 check (xp >= 0),
  current_streak int  not null default 0,
  longest_streak int  not null default 0,
  last_active    date
);

create table public.user_challenge_progress (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  challenge_id text not null references public.challenges(id),
  solved_at    timestamptz,
  attempts     int not null default 0,
  hints_used   int not null default 0,
  primary key (user_id, challenge_id)
);

create table public.attempts (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  challenge_id text not null references public.challenges(id),
  option_key   text not null,
  is_correct   boolean not null,
  hints_used   int  not null default 0,
  created_at   timestamptz not null default now()
);

create table public.xp_events (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  challenge_id text references public.challenges(id),
  delta        int  not null,
  reason       text not null check (reason in ('correct_fix','wrong_fix','first_try_bonus','daily_first_solve')),
  created_at   timestamptz not null default now()
);

create index on public.attempts (user_id, created_at desc);
create index on public.user_challenge_progress (user_id) where solved_at is not null;
