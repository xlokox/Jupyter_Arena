import { describe, expect, it } from "vitest";
import {
  evaluateBadges,
  languageFamily,
  type BadgeContext,
  type SolvedFact,
} from "@/lib/game/badges";
import type { SectorId } from "@/lib/content/schema";
import {
  admin,
  challengeOfDifficulty,
  createTestUser,
  easyChallenges,
  getBadges,
  publishedSectorIds,
  seedCompletedDailyGoals,
  seedSolved,
  setStats,
  submit,
  utcDay,
} from "./helpers";

/**
 * Phase 5.6b — the SQL award_badges() must award exactly the set that the TS
 * evaluateBadges() computes from the same raw account state (the
 * daily-challenge.test.ts pattern). We drive a rich scenario through the RPC,
 * then rebuild the TS BadgeContext from the DB rows and assert the sets match.
 */

const SECTORS: SectorId[] = ["ml", "dl", "fullstack", "db"];

async function buildContextFromDb(userId: string): Promise<BadgeContext> {
  const { data: solvedRows, error } = await admin
    .from("user_challenge_progress")
    .select("challenge_id, hints_used, challenges(sector_id, difficulty, language)")
    .eq("user_id", userId)
    .not("solved_at", "is", null);
  if (error) throw new Error(error.message);

  const { data: ftb } = await admin
    .from("xp_events")
    .select("challenge_id")
    .eq("user_id", userId)
    .eq("reason", "first_try_bonus");
  const flawlessIds = new Set((ftb ?? []).map((r) => (r as { challenge_id: string }).challenge_id));

  const solved: SolvedFact[] = (solvedRows ?? []).map((row) => {
    const r = row as unknown as {
      challenge_id: string;
      hints_used: number;
      challenges: { sector_id: SectorId; difficulty: SolvedFact["difficulty"]; language: string };
    };
    return {
      sector: r.challenges.sector_id,
      difficulty: r.challenges.difficulty,
      language: languageFamily(r.challenges.language),
      flawless: flawlessIds.has(r.challenge_id),
      hintsUsed: r.hints_used,
    };
  });

  const sectorTotals = {} as Record<SectorId, number>;
  for (const s of SECTORS) sectorTotals[s] = (await publishedSectorIds(s)).length;

  const { data: stat } = await admin
    .from("user_stats")
    .select("longest_streak")
    .eq("user_id", userId)
    .single();

  const { count } = await admin
    .from("user_daily_goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  return {
    solved,
    sectorTotals,
    longestStreak: (stat as { longest_streak: number }).longest_streak,
    dailyGoalsCompleted: count ?? 0,
  };
}

describe("badge parity (SQL award_badges ⇄ TS evaluateBadges)", () => {
  it("awards exactly the TS-computed set for a rich scenario", async () => {
    const user = await createTestUser();
    // High level (bypass gating) + a fixed longest streak that solves won't beat.
    await setStats(user.userId, { xp: 1000, longest_streak: 7, last_active: utcDay(10) });

    // The clean solves we'll drive through the RPC last (they must be genuine
    // first-solves to emit first_try_bonus, so keep them OUT of the seed set):
    // 5 distinct, covering flawless_five + Polyglot + no-hints.
    const py = await easyChallenges(2, "python");
    const sql = (await easyChallenges(1, "sql"))[0]!;
    const js = (await easyChallenges(1, "javascript"))[0]!;
    const hard = await challengeOfDifficulty("hard");
    const real = [...py, sql, js, hard];
    const realIds = real.map((c) => c.id);

    // Seed the bulk (admin bypass) for the count thresholds + daily_devoted,
    // disjoint from the real solves. award_badges runs only via the RPC, so the
    // real solves below are what actually evaluate the full state.
    await seedCompletedDailyGoals(user.userId, 10);
    const ml = await publishedSectorIds("ml");
    const filler = await fillerExcluding([...ml, ...realIds], 14);
    await seedSolved(user.userId, [...ml.filter((id) => !realIds.includes(id)), ...filler]);

    for (const c of real) await submit(user, c.id, c.option, 0); // last submit triggers full eval

    const sqlAwarded = await getBadges(user.userId);
    const tsAwarded = [...evaluateBadges(await buildContextFromDb(user.userId))].sort();

    expect(tsAwarded).toEqual(sqlAwarded);
    // Sanity: the scenario is rich enough to exercise several criteria.
    expect(sqlAwarded).toEqual(
      expect.arrayContaining([
        "first_blood",
        "flawless_five",
        "traceback_hunter",
        "sector_sweep_ml",
        "no_hints_needed",
        "polyglot",
        "streak_keeper_3",
        "streak_keeper_7",
        "daily_devoted",
      ]),
    );
    expect(sqlAwarded).not.toContain("streak_keeper_30");
  });
});

/** N published ids not in `exclude` (for padding the solve count). */
async function fillerExcluding(exclude: string[], n: number): Promise<string[]> {
  const { data } = await admin
    .from("challenges")
    .select("id")
    .eq("is_published", true)
    .order("id")
    .limit(60);
  const ids = (data as Array<{ id: string }>).map((r) => r.id).filter((id) => !exclude.includes(id));
  return ids.slice(0, n);
}
