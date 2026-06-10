import { describe, expect, it } from "vitest";
import {
  admin,
  createTestUser,
  DB_002,
  DL_002,
  ensureUnpublishedFixture,
  FS_002,
  getStats,
  ML_001,
  ML_002,
  setStats,
  submit,
  UNPUBLISHED_ID,
  utcDay,
} from "./helpers";

/**
 * Parity matrix with src/lib/game/xp.test.ts — the SQL implementation must
 * match the client math case for case (Section 9).
 */

describe("correct solves", () => {
  it("fresh first-try solve = +10 +5 first-try +5 daily = 20", async () => {
    const user = await createTestUser();
    const result = await submit(user, ML_001, "a");
    expect(result.is_correct).toBe(true);
    expect(result.xp_delta).toBe(20);
    expect(result.new_xp).toBe(20);
    expect(result.level).toBe(1);
    expect(result.streak).toBe(1);
    expect(result.already_solved).toBe(false);
    expect(result.events.map((e) => e.reason)).toEqual([
      "correct_fix",
      "first_try_bonus",
      "daily_first_solve",
    ]);
  });

  it("one hint keeps the bonus; two hints forfeit it", async () => {
    const oneHint = await createTestUser();
    expect((await submit(oneHint, ML_001, "a", 1)).xp_delta).toBe(20);

    const twoHints = await createTestUser();
    expect((await submit(twoHints, ML_001, "a", 2)).xp_delta).toBe(15);
  });

  it("hints ratchet: hints revealed on a failed run forfeit the bonus on the later solve", async () => {
    const user = await createTestUser();
    await submit(user, ML_001, "b", 2); // wrong, with two hints
    const solve = await submit(user, ML_001, "a", 0); // solve claims zero hints
    const bonus = solve.events.find((e) => e.reason === "first_try_bonus");
    expect(bonus).toBeUndefined();
  });

  it("a prior wrong attempt forfeits the first-try bonus", async () => {
    const user = await createTestUser();
    await submit(user, ML_001, "b");
    const solve = await submit(user, ML_001, "a");
    // 0 xp after floored wrong; +10 correct +5 daily, no first-try
    expect(solve.xp_delta).toBe(15);
    expect(solve.events.map((e) => e.reason)).toEqual(["correct_fix", "daily_first_solve"]);
  });

  it("daily bonus fires once per UTC day", async () => {
    const user = await createTestUser();
    await submit(user, ML_001, "a");
    const second = await submit(user, ML_002, "a");
    expect(second.xp_delta).toBe(15); // +10 +5 first-try, no daily
    expect(second.events.some((e) => e.reason === "daily_first_solve")).toBe(false);
  });
});

describe("wrong attempts and the floor", () => {
  it("wrong at 0 XP stays at 0 (delta 0)", async () => {
    const user = await createTestUser();
    const result = await submit(user, ML_001, "b");
    expect(result.is_correct).toBe(false);
    expect(result.xp_delta).toBe(0);
    expect(result.new_xp).toBe(0);
  });

  it("wrong at 3 XP floors to 0 (delta −3)", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { xp: 3 });
    const result = await submit(user, ML_001, "b");
    expect(result.xp_delta).toBe(-3);
    expect(result.new_xp).toBe(0);
  });

  it("wrong at 20 XP costs the full 5", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { xp: 20 });
    const result = await submit(user, ML_001, "c");
    expect(result.xp_delta).toBe(-5);
    expect(result.new_xp).toBe(15);
  });
});

describe("idempotent re-solve", () => {
  it("re-solving grants 0 XP, no events, and leaves streak bookkeeping alone", async () => {
    const user = await createTestUser();
    await submit(user, ML_001, "a");
    const before = await getStats(user.userId);

    const again = await submit(user, ML_001, "a");
    expect(again.already_solved).toBe(true);
    expect(again.xp_delta).toBe(0);
    expect(again.events).toEqual([]);

    const after = await getStats(user.userId);
    expect(after).toEqual(before);

    // The attempt itself is still recorded (review mode is visible in history).
    const { data: attempts } = await admin
      .from("attempts")
      .select("id")
      .eq("user_id", user.userId)
      .eq("challenge_id", ML_001);
    expect(attempts).toHaveLength(2);
    const { data: progress } = await admin
      .from("user_challenge_progress")
      .select("attempts")
      .eq("user_id", user.userId)
      .eq("challenge_id", ML_001)
      .single();
    expect(progress!.attempts).toBe(2);
  });
});

describe("streaks (UTC)", () => {
  it("a solve the day after the last extends the streak", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { current_streak: 3, longest_streak: 3, last_active: utcDay(1) });
    const result = await submit(user, ML_001, "a");
    expect(result.streak).toBe(4);
    expect((await getStats(user.userId)).longest_streak).toBe(4);
  });

  it("a missed day restarts at 1 and preserves the longest", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { current_streak: 5, longest_streak: 7, last_active: utcDay(3) });
    const result = await submit(user, ML_001, "a");
    expect(result.streak).toBe(1);
    expect((await getStats(user.userId)).longest_streak).toBe(7);
  });
});

describe("level boundary", () => {
  it("crossing 50 XP reports the new level", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { xp: 45, last_active: utcDay(0) });
    const result = await submit(user, ML_001, "a"); // +15 (no daily: active today)
    expect(result.new_xp).toBe(60);
    expect(result.level).toBe(2);
  });
});

describe("validation and rate limiting", () => {
  it("rejects an unpublished challenge", async () => {
    await ensureUnpublishedFixture();
    const user = await createTestUser();
    await expect(submit(user, UNPUBLISHED_ID, "a")).rejects.toThrow(/invalid_challenge_or_option/);
  });

  it("rejects an unknown option key", async () => {
    const user = await createTestUser();
    await expect(submit(user, ML_001, "z")).rejects.toThrow(/invalid_challenge_or_option/);
  });

  it("blocks the 31st attempt within a minute", async () => {
    const user = await createTestUser();
    const targets = [ML_001, ML_002, DL_002, FS_002, DB_002];
    for (let i = 0; i < 30; i++) {
      await submit(user, targets[i % targets.length]!, "b");
    }
    await expect(submit(user, ML_001, "b")).rejects.toThrow(/rate_limited/);
  });
});
