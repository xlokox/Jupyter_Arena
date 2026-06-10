import { describe, expect, it } from "vitest";
import { createTestUser, DB_002, getStats, ML_001, ML_002, submit, type TestUser } from "./helpers";

/** merge_local_progress: recompute server-side, one-time, clamped, skip-solved. */

async function merge(user: TestUser, items: unknown) {
  const { data, error } = await user.client.rpc("merge_local_progress", { p_items: items });
  if (error) throw new Error(error.message);
  return data as {
    new_xp: number;
    level: number;
    streak: number;
    imported: number;
    solved_ids: string[];
  };
}

describe("merge_local_progress", () => {
  it("replays events per challenge and grants a single daily tick", async () => {
    const user = await createTestUser();
    const result = await merge(user, [
      { challenge_id: ML_001, solved: true, wrong_attempts: 0, hints_used: 0 },
      { challenge_id: ML_002, solved: true, wrong_attempts: 2, hints_used: 2 },
      { challenge_id: DB_002, solved: false, wrong_attempts: 1, hints_used: 0 },
      { challenge_id: "ml-404-not-a-challenge", solved: true, wrong_attempts: 0, hints_used: 0 },
    ]);

    // 0 → +15 (ml-001 clean) → −5 −5 +10 (ml-002) → −5 (db-002 wrong-only)
    // → +5 single daily tick = 15
    expect(result.new_xp).toBe(15);
    expect(result.imported).toBe(2);
    expect(result.streak).toBe(1);
    expect(result.solved_ids.sort()).toEqual([ML_001, ML_002]);

    const stats = await getStats(user.userId);
    expect(stats.xp).toBe(15);
    expect(stats.current_streak).toBe(1);
  });

  it("is strictly one-time", async () => {
    const user = await createTestUser();
    await merge(user, [{ challenge_id: ML_001, solved: true, wrong_attempts: 0, hints_used: 0 }]);
    await expect(
      merge(user, [{ challenge_id: ML_002, solved: true, wrong_attempts: 0, hints_used: 0 }]),
    ).rejects.toThrow(/already_merged/);
  });

  it("skips challenges already solved on the account (no double XP)", async () => {
    const user = await createTestUser();
    const solve = await submit(user, ML_001, "a"); // 20 XP
    const result = await merge(user, [
      { challenge_id: ML_001, solved: true, wrong_attempts: 0, hints_used: 0 },
      { challenge_id: ML_002, solved: true, wrong_attempts: 0, hints_used: 0 },
    ]);
    // Only ml-002 imports: +15; already active today so no extra daily tick.
    expect(result.imported).toBe(1);
    expect(result.new_xp).toBe(solve.new_xp + 15);
  });

  it("rejects oversized and malformed payloads, clamps absurd counts", async () => {
    const big = await createTestUser();
    await expect(
      merge(
        big,
        Array.from({ length: 501 }, (_, i) => ({
          challenge_id: `ml-${i}`,
          solved: false,
          wrong_attempts: 1,
          hints_used: 0,
        })),
      ),
    ).rejects.toThrow(/too_many_items/);
    await expect(merge(big, { not: "an array" })).rejects.toThrow(/invalid_payload/);

    const clamped = await createTestUser();
    const result = await merge(clamped, [
      { challenge_id: ML_001, solved: true, wrong_attempts: 999999, hints_used: 50 },
    ]);
    // Wrongs clamp at 100 → XP can only be floored to 0 before the +10 solve;
    // hints clamp at 2 → no first-try bonus. +10 +5 daily = 15.
    expect(result.new_xp).toBe(15);
  });
});
