import { describe, expect, it } from "vitest";
import {
  admin,
  createTestUser,
  getFreezeTokens,
  ML_001,
  setStats,
  submit,
  utcDay,
} from "./helpers";

/** Set the freeze-token balance directly (admin bypass). */
async function setTokens(userId: string, tokens: number): Promise<void> {
  const { error } = await admin
    .from("user_stats")
    .update({ streak_freeze_tokens: tokens })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

/**
 * Phase 5.6b — streak-freeze tokens (a sanctioned extension to the Section-9
 * streak rule). Earn one every 7th day (capped at 2); spend one to bridge a
 * single missed UTC day. At zero tokens, behavior is identical to migration 010.
 */

describe("earning tokens", () => {
  it("earns a token when the streak reaches 7", async () => {
    const user = await createTestUser();
    await setStats(user.userId, {
      current_streak: 6,
      longest_streak: 6,
      last_active: utcDay(1),
    });
    const result = await submit(user, ML_001, "a");
    expect(result.streak).toBe(7);
    expect(result.streak_freeze_tokens).toBe(1);
  });

  it("never exceeds the cap of 2", async () => {
    const user = await createTestUser();
    await setStats(user.userId, {
      current_streak: 13,
      longest_streak: 13,
      last_active: utcDay(1),
    });
    await setTokens(user.userId, 2);
    const result = await submit(user, ML_001, "a");
    expect(result.streak).toBe(14);
    expect(result.streak_freeze_tokens).toBe(2);
  });
});

describe("spending tokens", () => {
  it("bridges a single missed day, spending one token", async () => {
    const user = await createTestUser();
    await setStats(user.userId, {
      current_streak: 5,
      longest_streak: 5,
      last_active: utcDay(2), // one missed day
    });
    await setTokens(user.userId, 1);
    const result = await submit(user, ML_001, "a");
    expect(result.streak).toBe(6); // bridged, not reset
    expect(result.streak_freeze_spent).toBe(true);
    expect(result.streak_freeze_tokens).toBe(0);
  });

  it("does not spend on a multi-day gap", async () => {
    const user = await createTestUser();
    await setStats(user.userId, {
      current_streak: 5,
      longest_streak: 5,
      last_active: utcDay(3), // two missed days
    });
    await setTokens(user.userId, 2);
    const result = await submit(user, ML_001, "a");
    expect(result.streak).toBe(1);
    expect(result.streak_freeze_spent).toBe(false);
    expect(result.streak_freeze_tokens).toBe(2);
  });

  it("at zero tokens, a single missed day resets to 1 (Section 9 unchanged)", async () => {
    const user = await createTestUser();
    await setStats(user.userId, {
      current_streak: 5,
      longest_streak: 5,
      last_active: utcDay(2),
    });
    const result = await submit(user, ML_001, "a");
    expect(result.streak).toBe(1);
    expect(result.streak_freeze_spent).toBe(false);
    expect(result.xp_delta).toBe(20); // +10 +5 first-try +5 daily, unchanged
    expect(await getFreezeTokens(user.userId)).toBe(0);
  });
});

