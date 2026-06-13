-- 017_graph_figures — the matplotlib figure pipeline for the da graph
-- challenges (da-016..025). Three nullable, additive columns; existing rows
-- stay null and beginner graph rows get values on the next content:seed. No
-- backfill, no RLS change (published challenges are world-readable).
--
-- figure_svg is shown ABOVE the briefing for graph challenges — the learner
-- sees the broken plot before reading anything else. result_figure_svg rides
-- on each option so the correct fix can swap in the corrected chart inside
-- the output cell; wrong options keep the existing text-only result_log.
-- The validator (TS-side) requires figure_svg + figure_caption + correct
-- option result_figure_svg for the GRAPH_CHALLENGE_IDS set only.
alter table public.challenges
  add column figure_svg     text,
  add column figure_caption text;

alter table public.challenge_options
  add column result_figure_svg text;
