import { createClient } from "@supabase/supabase-js";
import {
  ChallengeSchema,
  SectorsFileSchema,
  toMeta,
  type Challenge,
  type ChallengeMeta,
  type Sector,
} from "./schema";
import { UNLOCK_LEVELS } from "@/lib/game/xp";
import { loadChallenges, loadSectors } from "./load";

/**
 * Content source — MASTER_BRIEF.md Section 4 data flow: the app reads
 * published challenges via the anon-key client (RLS-gated), server-side.
 * When Supabase env is absent (offline dev, env-less CI), it falls back to
 * the validated /content fs loader — both paths share the same Zod schema,
 * so malformed content can never ship either way. Server modules only.
 */

interface ChallengeRow {
  id: string;
  sector_id: string;
  difficulty: string;
  title: string;
  language: string;
  icon: string;
  concept_tags: string[];
  description_md: string;
  initial_code: string;
  buggy_line_start: number;
  buggy_line_end: number;
  traceback: string;
  correct_output: string;
  recruiter_review: string;
  explanation_md: string;
  est_minutes: number;
  version: number;
  concept_card?: string | null;
  line_notes?: Array<{ line: number; noteMd: string }> | null;
  takeaway?: string | null;
  figure_svg?: string | null;
  figure_caption?: string | null;
  track?: string | null;
  glossary?: Array<{ term: string; definitionMd: string }> | null;
  challenge_options: Array<{
    option_key: string;
    label: string;
    patch_code: string;
    is_correct: boolean;
    result_log: string;
    rationale: string;
    result_figure_svg?: string | null;
  }>;
  challenge_hints: Array<{ hint_order: number; hint_md: string }>;
  tutorials: {
    body_md: string;
    tutorial_videos: Array<{ title: string; url: string; position: number }>;
  } | null;
}

export const CHALLENGE_SELECT =
  "*, challenge_options(*), challenge_hints(*), tutorials(body_md, tutorial_videos(*))";

function searchQueryFromUrl(url: string): string {
  try {
    return new URL(url).searchParams.get("search_query") ?? url;
  } catch {
    return url;
  }
}

/** Maps a DB row (with embedded children) back to the canonical Challenge. */
export function mapChallengeRow(row: ChallengeRow): Challenge {
  const hints = [...row.challenge_hints].sort((a, b) => a.hint_order - b.hint_order);
  const videos = [...(row.tutorials?.tutorial_videos ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  return ChallengeSchema.parse({
    id: row.id,
    sector: row.sector_id,
    difficulty: row.difficulty,
    title: row.title,
    language: row.language,
    icon: row.icon,
    conceptTags: row.concept_tags,
    descriptionMd: row.description_md,
    initialCode: row.initial_code,
    buggyLineStart: row.buggy_line_start,
    buggyLineEnd: row.buggy_line_end,
    traceback: row.traceback,
    correctOutput: row.correct_output,
    options: [...row.challenge_options]
      .sort((a, b) => a.option_key.localeCompare(b.option_key))
      .map((option) => ({
        key: option.option_key,
        label: option.label,
        patchCode: option.patch_code,
        isCorrect: option.is_correct,
        resultLog: option.result_log,
        rationale: option.rationale,
        resultFigureSvg: option.result_figure_svg ?? undefined,
      })),
    hints: [hints[0]?.hint_md ?? "", hints[1]?.hint_md ?? ""],
    explanationMd: row.explanation_md,
    recruiterReview: row.recruiter_review,
    tutorial: {
      bodyMd: row.tutorials?.body_md ?? "",
      videos: videos.map((video) => ({
        title: video.title,
        searchQuery: searchQueryFromUrl(video.url),
      })),
    },
    estMinutes: row.est_minutes,
    version: row.version,
    conceptCard: row.concept_card ?? undefined,
    lineNotes: row.line_notes ?? undefined,
    takeaway: row.takeaway ?? undefined,
    figureSvg: row.figure_svg ?? undefined,
    figureCaption: row.figure_caption ?? undefined,
    track:
      row.track === "debugging" || row.track === "reasoning" ? row.track : undefined,
    glossary: row.glossary ?? undefined,
  });
}

function supabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

const SECTOR_ORDER: Record<string, number> = { py: 0, da: 1, ml: 2, dl: 3, fullstack: 4, db: 5 };

export async function getChallenges(): Promise<Challenge[]> {
  const env = supabaseEnv();
  if (!env) return loadChallenges();

  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false } });
  const { data, error } = await anon.from("challenges").select(CHALLENGE_SELECT);
  if (error) throw new Error(`content read failed: ${error.message}`);
  return (data as unknown as ChallengeRow[])
    .map(mapChallengeRow)
    .sort(
      (a, b) =>
        (SECTOR_ORDER[a.sector] ?? 9) - (SECTOR_ORDER[b.sector] ?? 9) || a.id.localeCompare(b.id),
    );
}

const META_SELECT =
  "id, sector_id, difficulty, title, language, icon, concept_tags, est_minutes, unlock_level_override, track";

interface MetaRow {
  id: string;
  sector_id: string;
  difficulty: string;
  title: string;
  language: string;
  icon: string;
  concept_tags: string[];
  est_minutes: number;
  unlock_level_override: number | null;
  track: string | null;
}

/** List views ship metadata only (Section 11); bodies come via getChallenge. */
export async function getChallengeMetas(): Promise<ChallengeMeta[]> {
  const env = supabaseEnv();
  const ungated = await ungatedSectorIds();
  if (!env) return loadChallenges().map((c) => toMeta(c, ungated));

  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false } });
  const { data, error } = await anon.from("challenges").select(META_SELECT);
  if (error) throw new Error(`challenge metas read failed: ${error.message}`);
  return (data as MetaRow[])
    .map((row) => ({
      id: row.id,
      sector: row.sector_id as ChallengeMeta["sector"],
      difficulty: row.difficulty as ChallengeMeta["difficulty"],
      title: row.title,
      language: row.language as ChallengeMeta["language"],
      icon: row.icon,
      conceptTags: row.concept_tags,
      estMinutes: row.est_minutes,
      unlockLevel: ungated.has(row.sector_id)
        ? 1
        : (row.unlock_level_override ?? UNLOCK_LEVELS[row.difficulty] ?? 1),
      track: row.track === "reasoning" ? ("reasoning" as const) : ("debugging" as const),
    }))
    .sort(
      (a, b) =>
        (SECTOR_ORDER[a.sector] ?? 9) - (SECTOR_ORDER[b.sector] ?? 9) ||
        a.id.localeCompare(b.id),
    );
}

/** One full challenge body, RLS-gated; null when unknown or unpublished. */
export async function getChallenge(id: string): Promise<Challenge | null> {
  const env = supabaseEnv();
  if (!env) return loadChallenges().find((c) => c.id === id) ?? null;

  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false } });
  const { data, error } = await anon
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`challenge read failed: ${error.message}`);
  return data ? mapChallengeRow(data as unknown as ChallengeRow) : null;
}

export async function getSectors(): Promise<Sector[]> {
  const env = supabaseEnv();
  if (!env) return loadSectors();

  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false } });
  const { data, error } = await anon
    .from("sectors")
    .select("id, name, position, is_gated")
    .order("position");
  if (error) throw new Error(`sectors read failed: ${error.message}`);
  // Map the snake_case column to the camelCase schema field.
  return SectorsFileSchema.parse(
    (data as Array<{ id: string; name: string; position: number; is_gated: boolean }>).map((r) => ({
      id: r.id,
      name: r.name,
      position: r.position,
      isGated: r.is_gated,
    })),
  );
}

/** Sector ids that are ungated (always playable) — drives client unlock display. */
async function ungatedSectorIds(): Promise<Set<string>> {
  return new Set((await getSectors()).filter((s) => !s.isGated).map((s) => s.id));
}
