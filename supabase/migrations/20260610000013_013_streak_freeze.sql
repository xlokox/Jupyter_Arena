-- 013_streak_freeze — streak-protection tokens (Phase 5.6b).
-- A sanctioned extension to the Section-9 streak rule: a token bridges a single
-- missed UTC day so the streak survives. With zero tokens, streak behavior is
-- byte-identical to migration 010 (the bridge in submit_attempt v3 only fires
-- when tokens > 0). The +5 daily XP is unchanged. Earn/spend logic lives in
-- submit_attempt v3 (014) mirrored by src/lib/game/streak.ts.

alter table public.user_stats
  add column streak_freeze_tokens int not null default 0
    check (streak_freeze_tokens between 0 and 2);
