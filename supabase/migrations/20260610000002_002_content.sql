-- 002_content — content tables, MASTER_BRIEF.md Section 5.

create table public.sectors (
  id        text primary key,            -- 'ml' | 'dl' | 'fullstack' | 'db'
  name      text not null,
  position  int  not null default 0
);

create table public.challenges (
  id               text primary key,     -- 'ml-001-kmeans-scaling'
  sector_id        text not null references public.sectors(id),
  difficulty       text not null check (difficulty in ('easy','medium','hard','very_hard')),
  title            text not null,        -- display filename
  language         text not null check (language in ('python','jsx','javascript','sql')),
  icon             text not null,        -- lucide icon name
  concept_tags     text[] not null default '{}',
  description_md   text not null,
  initial_code     text not null,
  buggy_line_start int  not null,
  buggy_line_end   int  not null,
  traceback        text not null,
  correct_output   text not null,
  recruiter_review text not null,
  explanation_md   text not null,
  est_minutes      int  not null default 5,
  version          int  not null default 1,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now()
);

create table public.challenge_options (
  id           uuid primary key default gen_random_uuid(),
  challenge_id text not null references public.challenges(id) on delete cascade,
  option_key   text not null check (option_key in ('a','b','c')),
  label        text not null,
  patch_code   text not null,
  is_correct   boolean not null,
  result_log   text not null,
  rationale    text not null,
  unique (challenge_id, option_key)
);

create table public.challenge_hints (
  id           uuid primary key default gen_random_uuid(),
  challenge_id text not null references public.challenges(id) on delete cascade,
  hint_order   int  not null check (hint_order in (1,2)),
  hint_md      text not null,
  unique (challenge_id, hint_order)
);

create table public.tutorials (
  challenge_id text primary key references public.challenges(id) on delete cascade,
  body_md      text not null
);

create table public.tutorial_videos (
  id           uuid primary key default gen_random_uuid(),
  challenge_id text not null references public.tutorials(challenge_id) on delete cascade,
  title        text not null,
  url          text not null,             -- YouTube SEARCH URL only — never a video ID
  position     int  not null default 0,
  -- Refinement over the brief: natural key makes the seed upsert idempotent.
  unique (challenge_id, position)
);

create index on public.challenges (sector_id, difficulty) where is_published;
