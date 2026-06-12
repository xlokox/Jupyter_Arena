-- 010_submit_attempt_daily_exempt — the daily featured challenge is curated for
-- everyone that day, so it must always be playable regardless of player level.
-- This (a) reproduces the deterministic daily-pick algorithm in SQL and
-- (b) replaces submit_attempt so the challenge_locked gate is skipped for
-- today's pick. Keep daily_challenge_id() in lockstep with
-- src/lib/game/daily.ts; the gating change is otherwise identical to 009.

-- Deterministic daily challenge — mirrors dailyChallengeId() in
-- src/lib/game/daily.ts: FNV-1a (32-bit) over the UTC day string, modulo the
-- count of published challenge ids sorted in byte order. Marked STABLE: within
-- a statement the UTC day and published set don't change.
create or replace function public.daily_challenge_id()
returns text
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_day   text   := to_char((now() at time zone 'utc')::date, 'YYYY-MM-DD');
  v_hash  bigint := 2166136261;   -- 0x811c9dc5, FNV-1a offset basis
  v_ids   text[];
  v_count int;
  i       int;
begin
  -- FNV-1a over the day string. All arithmetic is kept in [0, 2^32) so the
  -- bigint math matches JS's `Math.imul(hash, prime) >>> 0` bit for bit.
  for i in 1 .. length(v_day) loop
    v_hash := v_hash # ascii(substr(v_day, i, 1));   -- XOR the byte
    v_hash := (v_hash * 16777619) & 4294967295;      -- * 0x01000193, mod 2^32
  end loop;

  -- COLLATE "C" => byte order, matching JavaScript's default String.sort()
  -- (the locale collation would order punctuation differently and diverge).
  select array_agg(id order by id collate "C")
    into v_ids
  from public.challenges
  where is_published;

  v_count := coalesce(array_length(v_ids, 1), 0);
  if v_count = 0 then
    return null;
  end if;

  -- Postgres arrays are 1-indexed; the JS pick is sorted[hash % length].
  return v_ids[(v_hash % v_count) + 1];
end;
$$;

-- Public knowledge (the client computes the same pick openly); no revoke.
comment on function public.daily_challenge_id() is
  'Deterministic UTC-day featured challenge; mirrors src/lib/game/daily.ts.';

create or replace function public.submit_attempt(
  p_challenge_id text,
  p_option_key   text,
  p_hints_used   int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user           uuid := auth.uid();
  v_today          date := (now() at time zone 'utc')::date;
  v_is_correct     boolean;
  v_already_solved boolean;
  v_prior_attempts int;
  v_hints          int;
  v_xp             int;
  v_streak         int;
  v_longest        int;
  v_last           date;
  v_delta          int   := 0;
  v_events         jsonb := '[]'::jsonb;
  v_recent         int;
  v_user_level     int;
  v_unlock_level   int;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  -- Rate guard: at most 30 recorded attempts per user per minute.
  select count(*) into v_recent
  from public.attempts
  where user_id = v_user and created_at > now() - interval '1 minute';
  if v_recent >= 30 then
    raise exception 'rate_limited';
  end if;

  -- Level-gating: compute the user's current level (default 1 for new users
  -- with no stats row yet) and the challenge's effective unlock level
  -- (COALESCE(per-challenge override, difficulty rule)).
  select (xp / 50 + 1) into v_user_level
  from public.user_stats where user_id = v_user;
  if not found then
    v_user_level := 1;
  end if;

  select coalesce(c.unlock_level_override, ur.min_level)
    into v_unlock_level
  from public.challenges c
  join public.unlock_rules ur on ur.difficulty = c.difficulty
  where c.id = p_challenge_id and c.is_published;
  -- If challenge not found here, the harder check below raises invalid_challenge_or_option.

  -- The daily featured challenge is exempt from gating — it is curated for
  -- everyone that day. Only pay the daily_challenge_id() cost when actually
  -- underleveled (kept in lockstep with notebook-view.tsx on the client).
  if v_user_level < coalesce(v_unlock_level, 1) then
    if p_challenge_id is distinct from public.daily_challenge_id() then
      raise exception 'challenge_locked';
    end if;
  end if;

  -- Validate the target and read correctness server-side — the client's
  -- claim is never trusted for XP.
  select o.is_correct into v_is_correct
  from public.challenge_options o
  join public.challenges c on c.id = o.challenge_id
  where o.challenge_id = p_challenge_id
    and o.option_key = p_option_key
    and c.is_published;
  if not found then
    raise exception 'invalid_challenge_or_option';
  end if;

  -- Defensive bootstrap (signup trigger normally created these).
  insert into public.profiles (id) values (v_user) on conflict (id) do nothing;
  insert into public.user_stats (user_id) values (v_user) on conflict (user_id) do nothing;

  insert into public.user_challenge_progress as p (user_id, challenge_id, hints_used)
  values (v_user, p_challenge_id, least(greatest(coalesce(p_hints_used, 0), 0), 2))
  on conflict (user_id, challenge_id) do update
    set hints_used = greatest(p.hints_used, excluded.hints_used)
  returning (p.solved_at is not null), p.attempts, p.hints_used
    into v_already_solved, v_prior_attempts, v_hints;

  select xp, current_streak, longest_streak, last_active
    into v_xp, v_streak, v_longest, v_last
  from public.user_stats
  where user_id = v_user
  for update;

  insert into public.attempts (user_id, challenge_id, option_key, is_correct, hints_used)
  values (v_user, p_challenge_id, p_option_key, v_is_correct, v_hints);

  update public.user_challenge_progress
     set attempts  = attempts + 1,
         solved_at = coalesce(solved_at, case when v_is_correct then now() end)
   where user_id = v_user and challenge_id = p_challenge_id;

  if not v_is_correct then
    v_delta  := greatest(-5, -v_xp);
    v_events := jsonb_build_array(
      jsonb_build_object('reason', 'wrong_fix', 'delta', v_delta));
  elsif not v_already_solved then
    v_delta  := 10;
    v_events := jsonb_build_array(
      jsonb_build_object('reason', 'correct_fix', 'delta', 10));

    if v_prior_attempts = 0 and v_hints <= 1 then
      v_delta  := v_delta + 5;
      v_events := v_events ||
        jsonb_build_object('reason', 'first_try_bonus', 'delta', 5);
    end if;

    if v_last is distinct from v_today then
      v_delta  := v_delta + 5;
      v_events := v_events ||
        jsonb_build_object('reason', 'daily_first_solve', 'delta', 5);
      if v_last = v_today - 1 then
        v_streak := v_streak + 1;
      else
        v_streak := 1;
      end if;
      v_longest := greatest(v_longest, v_streak);
      v_last    := v_today;
    end if;
  end if;

  insert into public.xp_events (user_id, challenge_id, delta, reason)
  select v_user, p_challenge_id, (e->>'delta')::int, e->>'reason'
  from jsonb_array_elements(v_events) as e;

  update public.user_stats
     set xp             = v_xp + v_delta,
         current_streak = v_streak,
         longest_streak = v_longest,
         last_active    = v_last
   where user_id = v_user;

  return jsonb_build_object(
    'is_correct',     v_is_correct,
    'xp_delta',       v_delta,
    'new_xp',         v_xp + v_delta,
    'level',          (v_xp + v_delta) / 50 + 1,
    'streak',         v_streak,
    'already_solved', v_already_solved,
    'events',         v_events
  );
end;
$$;

revoke execute on function public.submit_attempt(text, text, int) from public, anon;
grant execute on function public.submit_attempt(text, text, int) to authenticated;
