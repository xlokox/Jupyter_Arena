-- 006_submit_attempt — the only write path for attempts/XP
-- (MASTER_BRIEF.md Section 5 RPC contract; math = Section 9, mirrored from
--  src/lib/game/xp.ts — keep the two in lockstep).

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
  v_today          date := (now() at time zone 'utc')::date;  -- UTC pinned explicitly
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

  -- Upsert-and-lock the per-(user, challenge) row; RETURNING reflects the
  -- pre-existing solved state and prior attempt count (attempts not yet
  -- incremented; solved_at untouched by this update). Hints only ratchet up.
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
    -- Wrong attempt: −5, floored so XP never drops below 0.
    v_delta  := greatest(-5, -v_xp);
    v_events := jsonb_build_array(
      jsonb_build_object('reason', 'wrong_fix', 'delta', v_delta));
  elsif not v_already_solved then
    -- First solve: +10; +5 first-try (no prior attempts — all pre-solve
    -- attempts are wrong by definition — and ≤1 hint); +5 first solve of the
    -- UTC day with the streak tick. Re-solves skip all of this (0 XP).
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
