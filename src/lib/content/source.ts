import { createClient } from "@supabase/supabase-js";
import { ChallengeSchema, SectorsFileSchema, type Challenge, type Sector } from "./schema";
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
  challenge_options: Array<{
    option_key: string;
    label: string;
    patch_code: string;
    is_correct: boolean;
    result_log: string;
    rationale: string;
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
  });
}

function supabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

const SECTOR_ORDER: Record<string, number> = { ml: 0, dl: 1, fullstack: 2, db: 3 };

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

export async function getSectors(): Promise<Sector[]> {
  const env = supabaseEnv();
  if (!env) return loadSectors();

  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false } });
  const { data, error } = await anon.from("sectors").select("*").order("position");
  if (error) throw new Error(`sectors read failed: ${error.message}`);
  return SectorsFileSchema.parse(data);
}
