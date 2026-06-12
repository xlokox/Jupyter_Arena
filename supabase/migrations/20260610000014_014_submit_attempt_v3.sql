-- 014_submit_attempt_v3 — server-side achievements (Phase 5.6b).
-- Extends the attempt path with: streak-freeze (bridge a single missed day for a
-- token, earn one every 7th day, capped at 2), a per-UTC-day solve goal, and
-- badge awards. Section 9 XP is untouched — none of these change an XP amount;
-- with zero freeze tokens the streak is byte-identical to migration 010.
-- award_badges() is the SQL twin of src/lib/game/badges.ts (kept in lockstep by
-- tests/db/badge-parity.test.ts); applyDailyStreakTick / tickDailyGoal mirror
-- the streak + goal blocks here.

-- ── award_badges: evaluate the user's aggregate state, insert newly-qualified ─
-- Returns the badge ids inserted on THIS call (idempotent via the unique
-- constraint + ON CONFLICT DO NOTHING). Shared by submit_attempt and the merge.
create or replace function public.award_badges(p_user uuid, p_trigger text default null)
returns text[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_awarded text[];
begin
  with solved as (
    select c.sector_id, c.difficulty, c.language, p.hints_used
    from public.user_challenge_progress p
    join public.challenges c on c.id = p.challenge_id
    where p.user_id = p_user and p.solved_at is not null and c.is_published
  ),
  agg as (
    select
      (select count(*) from solved)                                                          as solved_n,
      (select count(*) from public.xp_events
         where user_id = p_user and reason = 'first_try_bonus')                              as flawless_n,
      (select count(*) from solved where sector_id = 'ml')                                   as ml_n,
      (select count(*) from solved where sector_id = 'dl')                                   as dl_n,
      (select count(*) from solved where sector_id = 'fullstack')                            as fs_n,
      (select count(*) from solved where sector_id = 'db')                                   as db_n,
      (select count(*) from public.challenges where sector_id='ml' and is_published)         as ml_total,
      (select count(*) from public.challenges where sector_id='dl' and is_published)         as dl_total,
      (select count(*) from public.challenges where sector_id='fullstack' and is_published)  as fs_total,
      (select count(*) from public.challenges where sector_id='db' and is_published)         as db_total,
      coalesce((select bool_or(difficulty in ('hard','very_hard') and hints_used = 0)
                from solved), false)                                                         as no_hints,
      coalesce((select bool_or(language = 'python') from solved), false)                     as has_py,
      coalesce((select bool_or(language = 'sql') from solved), false)                        as has_sql,
      coalesce((select bool_or(language in ('jsx','javascript')) from solved), false)        as has_js,
      coalesce((select longest_streak from public.user_stats where user_id = p_user), 0)     as longest,
      (select count(*) from public.user_daily_goals
         where user_id = p_user and completed_at is not null)                                as daily_goals_n
  ),
  qualified as (
    select bd.id
    from public.badge_definitions bd, agg b
    where (bd.id = 'first_blood'            and b.solved_n   >= 1)
       or (bd.id = 'traceback_hunter'       and b.solved_n   >= 25)
       or (bd.id = 'flawless_five'          and b.flawless_n >= 5)
       or (bd.id = 'sector_sweep_ml'        and b.ml_total > 0 and b.ml_n >= b.ml_total)
       or (bd.id = 'sector_sweep_dl'        and b.dl_total > 0 and b.dl_n >= b.dl_total)
       or (bd.id = 'sector_sweep_fullstack' and b.fs_total > 0 and b.fs_n >= b.fs_total)
       or (bd.id = 'sector_sweep_db'        and b.db_total > 0 and b.db_n >= b.db_total)
       or (bd.id = 'no_hints_needed'        and b.no_hints)
       or (bd.id = 'polyglot'               and b.has_py and b.has_sql and b.has_js)
       or (bd.id = 'streak_keeper_3'        and b.longest >= 3)
       or (bd.id = 'streak_keeper_7'        and b.longest >= 7)
       or (bd.id = 'streak_keeper_30'       and b.longest >= 30)
       or (bd.id = 'daily_devoted'          and b.daily_goals_n >= 10)
  ),
  ins as (
    insert into public.user_badges (user_id, badge_id, triggered_by_challenge_id)
    select p_user, q.id, p_trigger from qualified q
    on conflict (user_id, badge_id) do nothing
    returning badge_id
  )
  select coalesce(array_agg(badge_id), '{}') into v_awarded from ins;

  return v_awarded;
end;
$$;

revoke execute on function public.award_badges(uuid, text) from public, anon, authenticated;

-- ── submit_attempt v3 — carries 010 verbatim plus blocks A–D ─────────────────
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
  v_freeze_tokens  int   := 0;
  v_freeze_spent   boolean := false;
  v_goal_progress  int;
  v_goal_target    int;
  v_newly_awarded  text[] := '{}';
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

  -- Level-gating (default level 1 for new users; effective unlock = override or rule).
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

  -- The daily featured challenge is exempt from gating.
  if v_user_level < coalesce(v_unlock_level, 1) then
    if p_challenge_id is distinct from public.daily_challenge_id() then
      raise exception 'challenge_locked';
    end if;
  end if;

  -- Validate the target and read correctness server-side.
  select o.is_correct into v_is_correct
  from public.challenge_options o
  join public.challenges c on c.id = o.challenge_id
  where o.challenge_id = p_challenge_id
    and o.option_key = p_option_key
    and c.is_published;
  if not found then
    raise exception 'invalid_challenge_or_option';
  end if;

  insert into public.profiles (id) values (v_user) on conflict (id) do nothing;
  insert into public.user_stats (user_id) values (v_user) on conflict (user_id) do nothing;

  insert into public.user_challenge_progress as p (user_id, challenge_id, hints_used)
  values (v_user, p_challenge_id, least(greatest(coalesce(p_hints_used, 0), 0), 2))
  on conflict (user_id, challenge_id) do update
    set hints_used = greatest(p.hints_used, excluded.hints_used)
  returning (p.solved_at is not null), p.attempts, p.hints_used
    into v_already_solved, v_prior_attempts, v_hints;

  select xp, current_streak, longest_streak, last_active, streak_freeze_tokens
    into v_xp, v_streak, v_longest, v_last, v_freeze_tokens
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
      -- Block A: streak tick with the freeze bridge (inert at 0 tokens).
      if v_last = v_today - 1 then
        v_streak := v_streak + 1;
      elsif v_last = v_today - 2 and v_freeze_tokens > 0 then
        v_freeze_tokens := v_freeze_tokens - 1;   -- spend to bridge a single gap
        v_streak        := v_streak + 1;
        v_freeze_spent  := true;
      else
        v_streak := 1;
      end if;
      -- Block B: earn a freeze token every 7th day, capped at 2.
      if v_streak % 7 = 0 and v_freeze_tokens < 2 then
        v_freeze_tokens := v_freeze_tokens + 1;
      end if;
      v_longest := greatest(v_longest, v_streak);
      v_last    := v_today;
    end if;

    -- Block C: count this correct first solve toward today's daily goal.
    insert into public.user_daily_goals (user_id, goal_date, progress_solves)
    values (v_user, v_today, 1)
    on conflict (user_id, goal_date) do update
      set progress_solves = public.user_daily_goals.progress_solves + 1
    returning progress_solves, target_solves into v_goal_progress, v_goal_target;

    update public.user_daily_goals
       set completed_at = coalesce(
             completed_at,
             case when v_goal_progress >= v_goal_target then now() end)
     where user_id = v_user and goal_date = v_today;
  end if;

  insert into public.xp_events (user_id, challenge_id, delta, reason)
  select v_user, p_challenge_id, (e->>'delta')::int, e->>'reason'
  from jsonb_array_elements(v_events) as e;

  update public.user_stats
     set xp                   = v_xp + v_delta,
         current_streak       = v_streak,
         longest_streak       = v_longest,
         last_active          = v_last,
         streak_freeze_tokens = v_freeze_tokens
   where user_id = v_user;

  -- Block D: award badges on correct first solves (cheap, indexed).
  if v_is_correct and not v_already_solved then
    v_newly_awarded := public.award_badges(v_user, p_challenge_id);
  end if;

  return jsonb_build_object(
    'is_correct',           v_is_correct,
    'xp_delta',             v_delta,
    'new_xp',               v_xp + v_delta,
    'level',                (v_xp + v_delta) / 50 + 1,
    'streak',               v_streak,
    'already_solved',       v_already_solved,
    'events',               v_events,
    'streak_freeze_tokens', v_freeze_tokens,
    'streak_freeze_spent',  v_freeze_spent,
    'daily_goal',
      case when v_goal_target is not null then
        jsonb_build_object(
          'progress',  v_goal_progress,
          'target',    v_goal_target,
          'completed', v_goal_progress >= v_goal_target)
      else null end,
    'newly_awarded',        to_jsonb(v_newly_awarded)
  );
end;
$$;

revoke execute on function public.submit_attempt(text, text, int) from public, anon;
grant execute on function public.submit_attempt(text, text, int) to authenticated;

-- ── merge_local_progress v2 — re-derive badges from the post-merge aggregate ──
-- Carries 007 verbatim; adds a single award_badges() call before returning.
-- Offline daily-goal history and freeze tokens are intentionally NOT imported
-- (client clocks untrusted — same rationale as streak history).
create or replace function public.merge_local_progress(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user     uuid := auth.uid();
  v_today    date := (now() at time zone 'utc')::date;
  v_merged   timestamptz;
  v_xp       int;
  v_streak   int;
  v_longest  int;
  v_last     date;
  v_delta    int;
  v_imported int := 0;
  item       jsonb;
  v_cid      text;
  v_solved   boolean;
  v_wrong    int;
  v_hints    int;
  i          int;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_payload';
  end if;
  if jsonb_array_length(p_items) > 500 then
    raise exception 'too_many_items';
  end if;

  insert into public.profiles (id) values (v_user) on conflict (id) do nothing;
  insert into public.user_stats (user_id) values (v_user) on conflict (user_id) do nothing;

  select local_merged_at into v_merged
  from public.profiles where id = v_user for update;
  if v_merged is not null then
    raise exception 'already_merged';
  end if;

  select xp, current_streak, longest_streak, last_active
    into v_xp, v_streak, v_longest, v_last
  from public.user_stats where user_id = v_user for update;

  for item in select value from jsonb_array_elements(p_items) loop
    v_cid    := item->>'challenge_id';
    v_solved := coalesce((item->>'solved')::boolean, false);
    v_wrong  := least(greatest(coalesce((item->>'wrong_attempts')::int, 0), 0), 100);
    v_hints  := least(greatest(coalesce((item->>'hints_used')::int, 0), 0), 2);

    continue when not exists (
      select 1 from public.challenges c where c.id = v_cid and c.is_published);
    continue when exists (
      select 1 from public.user_challenge_progress p
      where p.user_id = v_user and p.challenge_id = v_cid and p.solved_at is not null);
    continue when not v_solved and v_wrong = 0;

    for i in 1..v_wrong loop
      v_delta := greatest(-5, -v_xp);
      v_xp    := v_xp + v_delta;
      insert into public.xp_events (user_id, challenge_id, delta, reason)
      values (v_user, v_cid, v_delta, 'wrong_fix');
    end loop;

    if v_solved then
      v_xp := v_xp + 10;
      insert into public.xp_events (user_id, challenge_id, delta, reason)
      values (v_user, v_cid, 10, 'correct_fix');

      if v_wrong = 0 and v_hints <= 1 then
        v_xp := v_xp + 5;
        insert into public.xp_events (user_id, challenge_id, delta, reason)
        values (v_user, v_cid, 5, 'first_try_bonus');
      end if;

      v_imported := v_imported + 1;
    end if;

    insert into public.user_challenge_progress as p
      (user_id, challenge_id, solved_at, attempts, hints_used)
    values (
      v_user, v_cid,
      case when v_solved then now() end,
      v_wrong + case when v_solved then 1 else 0 end,
      v_hints)
    on conflict (user_id, challenge_id) do update
      set solved_at  = coalesce(p.solved_at, excluded.solved_at),
          attempts   = p.attempts + excluded.attempts,
          hints_used = greatest(p.hints_used, excluded.hints_used);
  end loop;

  if v_imported > 0 and v_last is distinct from v_today then
    v_xp := v_xp + 5;
    insert into public.xp_events (user_id, challenge_id, delta, reason)
    values (v_user, null, 5, 'daily_first_solve');
    if v_last = v_today - 1 then
      v_streak := v_streak + 1;
    else
      v_streak := 1;
    end if;
    v_longest := greatest(v_longest, v_streak);
    v_last    := v_today;
  end if;

  update public.user_stats
     set xp             = v_xp,
         current_streak = v_streak,
         longest_streak = v_longest,
         last_active    = v_last
   where user_id = v_user;

  update public.profiles set local_merged_at = now() where id = v_user;

  -- Re-derive badges from the merged account aggregate (longest_streak is set).
  perform public.award_badges(v_user);

  return jsonb_build_object(
    'new_xp',   v_xp,
    'level',    v_xp / 50 + 1,
    'streak',   v_streak,
    'imported', v_imported,
    'solved_ids', (
      select coalesce(jsonb_agg(challenge_id), '[]'::jsonb)
      from public.user_challenge_progress
      where user_id = v_user and solved_at is not null)
  );
end;
$$;

revoke execute on function public.merge_local_progress(jsonb) from public, anon;
grant execute on function public.merge_local_progress(jsonb) to authenticated;
