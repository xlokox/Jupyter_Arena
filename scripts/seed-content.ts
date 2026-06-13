import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadChallenges, loadSectors } from "../src/lib/content/load";

/**
 * content:seed — upserts /content into Postgres (MASTER_BRIEF.md Section 4
 * data flow). Idempotent: natural-key upserts everywhere; challenges that
 * disappear from /content are UNPUBLISHED, never deleted (attempts reference
 * them). Runs with the service-role key, server-side only.
 */

export async function seedContent(admin: SupabaseClient): Promise<{
  sectors: number;
  challenges: number;
  unpublished: number;
}> {
  const sectors = loadSectors();
  const challenges = loadChallenges();

  const { error: sectorError } = await admin.from("sectors").upsert(
    sectors.map((s) => ({ id: s.id, name: s.name, position: s.position, is_gated: s.isGated })),
    { onConflict: "id" },
  );
  if (sectorError) throw new Error(`sectors upsert failed: ${sectorError.message}`);

  for (const challenge of challenges) {
    const { error: challengeError } = await admin.from("challenges").upsert(
      {
        id: challenge.id,
        sector_id: challenge.sector,
        difficulty: challenge.difficulty,
        title: challenge.title,
        language: challenge.language,
        icon: challenge.icon,
        concept_tags: challenge.conceptTags,
        description_md: challenge.descriptionMd,
        initial_code: challenge.initialCode,
        buggy_line_start: challenge.buggyLineStart,
        buggy_line_end: challenge.buggyLineEnd,
        traceback: challenge.traceback,
        correct_output: challenge.correctOutput,
        recruiter_review: challenge.recruiterReview,
        explanation_md: challenge.explanationMd,
        est_minutes: challenge.estMinutes,
        version: challenge.version,
        concept_card: challenge.conceptCard ?? null,
        line_notes: challenge.lineNotes ?? null,
        takeaway: challenge.takeaway ?? null,
        figure_svg: challenge.figureSvg ?? null,
        figure_caption: challenge.figureCaption ?? null,
        is_published: true,
      },
      { onConflict: "id" },
    );
    if (challengeError) {
      throw new Error(`challenge ${challenge.id} upsert failed: ${challengeError.message}`);
    }

    const { error: optionsError } = await admin.from("challenge_options").upsert(
      challenge.options.map((option) => ({
        challenge_id: challenge.id,
        option_key: option.key,
        label: option.label,
        patch_code: option.patchCode,
        is_correct: option.isCorrect,
        result_log: option.resultLog,
        rationale: option.rationale,
        result_figure_svg: option.resultFigureSvg ?? null,
      })),
      { onConflict: "challenge_id,option_key" },
    );
    if (optionsError) {
      throw new Error(`options for ${challenge.id} failed: ${optionsError.message}`);
    }

    const { error: hintsError } = await admin.from("challenge_hints").upsert(
      challenge.hints.map((hint, index) => ({
        challenge_id: challenge.id,
        hint_order: index + 1,
        hint_md: hint,
      })),
      { onConflict: "challenge_id,hint_order" },
    );
    if (hintsError) throw new Error(`hints for ${challenge.id} failed: ${hintsError.message}`);

    const { error: tutorialError } = await admin
      .from("tutorials")
      .upsert(
        { challenge_id: challenge.id, body_md: challenge.tutorial.bodyMd },
        { onConflict: "challenge_id" },
      );
    if (tutorialError) {
      throw new Error(`tutorial for ${challenge.id} failed: ${tutorialError.message}`);
    }

    const { error: videosError } = await admin.from("tutorial_videos").upsert(
      challenge.tutorial.videos.map((video, index) => ({
        challenge_id: challenge.id,
        title: video.title,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`,
        position: index,
      })),
      { onConflict: "challenge_id,position" },
    );
    if (videosError) throw new Error(`videos for ${challenge.id} failed: ${videosError.message}`);
  }

  // Unpublish anything no longer present in /content (never delete).
  const ids = challenges.map((c) => c.id);
  const { data: stale, error: staleError } = await admin
    .from("challenges")
    .update({ is_published: false })
    .not("id", "in", `(${ids.map((id) => `"${id}"`).join(",")})`)
    .eq("is_published", true)
    .select("id");
  if (staleError) throw new Error(`unpublish pass failed: ${staleError.message}`);

  return {
    sectors: sectors.length,
    challenges: challenges.length,
    unpublished: stale?.length ?? 0,
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error(
      "content:seed needs NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.\n" +
        "For local dev: pnpm db:start, then `pnpm exec supabase status -o env` for the values.",
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const result = await seedContent(admin);
  console.log(
    `content:seed done — ${result.sectors} sectors, ${result.challenges} challenges published, ${result.unpublished} unpublished.`,
  );
}

// Only run as a CLI (the integration tests import seedContent directly).
if (process.argv[1]?.endsWith("seed-content.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
