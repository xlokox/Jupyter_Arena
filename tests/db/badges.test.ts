import { describe, expect, it } from "vitest";
import {
  admin,
  challengeOfDifficulty,
  createTestUser,
  easyChallenges,
  getBadges,
  ML_001,
  publishedSectorIds,
  seedCompletedDailyGoals,
  seedSolved,
  setStats,
  submit,
} from "./helpers";

/**
 * Phase 5.6b — submit_attempt v3 awards badges server-side via award_badges().
 * Large-count thresholds are set up by seeding solved rows (admin bypass) and
 * then driving the qualifying badge through one real submit, so the RPC is what
 * actually awards. Each test uses a fresh user.
 */

describe("badge awards", () => {
  it("first_blood on the very first solve, and never twice", async () => {
    const user = await createTestUser();
    const first = await submit(user, ML_001, "a");
    expect(first.newly_awarded).toContain("first_blood");

    const second = await submit(user, "ml-002-test-set-leakage", "a");
    expect(second.newly_awarded).not.toContain("first_blood");
    expect(await getBadges(user.userId)).toEqual(
      expect.arrayContaining(["first_blood"]),
    );
  });

  it("flawless_five after five clean first-try solves", async () => {
    const user = await createTestUser();
    const five = await easyChallenges(5);
    expect(five).toHaveLength(5);
    let last: Awaited<ReturnType<typeof submit>> | null = null;
    for (const c of five) last = await submit(user, c.id, c.option, 0);
    expect(last!.newly_awarded).toContain("flawless_five");
  });

  it("traceback_hunter at 25 solves", async () => {
    const user = await createTestUser();
    const { data } = await admin
      .from("challenges")
      .select("id")
      .eq("is_published", true)
      .neq("id", ML_001)
      .order("id")
      .limit(24);
    await seedSolved(
      user.userId,
      (data as Array<{ id: string }>).map((r) => r.id),
    );
    const result = await submit(user, ML_001, "a"); // the 25th
    expect(result.newly_awarded).toContain("traceback_hunter");
  });

  it("sector_sweep_ml when all ML challenges are solved", async () => {
    const user = await createTestUser();
    const mlIds = await publishedSectorIds("ml");
    await seedSolved(
      user.userId,
      mlIds.filter((id) => id !== ML_001),
    );
    const result = await submit(user, ML_001, "a"); // completes the sector
    expect(result.newly_awarded).toContain("sector_sweep_ml");
    expect(await getBadges(user.userId)).toEqual(expect.arrayContaining(["sector_sweep_ml"]));
  });

  it("no_hints_needed when a hard challenge is solved with zero hints", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { xp: 300 }); // level 7 → hard unlocked
    const hard = await challengeOfDifficulty("hard");
    const result = await submit(user, hard.id, hard.option, 0);
    expect(result.newly_awarded).toContain("no_hints_needed");
  });

  it("polyglot across python, sql, and javascript", async () => {
    const user = await createTestUser();
    const py = (await easyChallenges(1, "python"))[0]!;
    const sql = (await easyChallenges(1, "sql"))[0]!;
    const js = (await easyChallenges(1, "javascript"))[0]!;
    await submit(user, py.id, py.option, 0);
    await submit(user, sql.id, sql.option, 0);
    const result = await submit(user, js.id, js.option, 0);
    expect(result.newly_awarded).toContain("polyglot");
  });

  it("streak_keeper_3 from longest_streak, not streak_keeper_7", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { longest_streak: 3 });
    const result = await submit(user, ML_001, "a");
    expect(result.newly_awarded).toContain("streak_keeper_3");
    expect(result.newly_awarded).not.toContain("streak_keeper_7");
  });

  it("daily_devoted at 10 completed daily goals", async () => {
    const user = await createTestUser();
    await seedCompletedDailyGoals(user.userId, 10);
    const result = await submit(user, ML_001, "a");
    expect(result.newly_awarded).toContain("daily_devoted");
  });

  it("a wrong attempt awards nothing", async () => {
    const user = await createTestUser();
    const result = await submit(user, ML_001, "b"); // wrong
    expect(result.is_correct).toBe(false);
    expect(result.newly_awarded).toEqual([]);
    expect(await getBadges(user.userId)).toEqual([]);
  });
});
