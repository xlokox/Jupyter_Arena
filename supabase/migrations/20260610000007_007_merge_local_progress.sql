-- 007_merge_local_progress — one-time import of anonymous localStorage
-- progress at signup. XP is recomputed server-side from scratch by replaying
-- per-challenge events; client XP totals, streak history, and timestamps are
-- never trusted (MASTER_BRIEF.md Section 9).

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

    -- Only published challenges; skip anything already solved on the account.
    continue when not exists (
      select 1 from public.challenges c where c.id = v_cid and c.is_published);
    continue when exists (
      select 1 from public.user_challenge_progress p
      where p.user_id = v_user and p.challenge_id = v_cid and p.solved_at is not null);
    continue when not v_solved and v_wrong = 0;

    -- Replay wrong attempts sequentially: −5 each, floored at 0.
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

  -- A single daily tick for the merge day (client clocks are untrusted, so
  -- anonymous streak history is not imported).
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
