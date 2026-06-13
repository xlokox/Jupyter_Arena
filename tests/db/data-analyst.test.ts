import { afterEach, describe, expect, it } from "vitest";
import {
  admin,
  createTestUser,
  DA_001,
  dailyChallengeIdServer,
  lockedChallengeOfDifficulty,
  submit,
} from "./helpers";

/**
 * Data Analyst sector — ungated on-ramp. submit_attempt (015) skips the
 * challenge_locked gate when the challenge's sector is not gated, even if the
 * challenge carries a high unlock_level_override. Gated sectors are unaffected.
 */

describe("ungated Data Analyst sector", () => {
  // The DA challenge is forced above any fresh user's level to prove the sector
  // flag (not the difficulty) is what lets a level-1 user in. Restore after.
  let originalOverride: number | null = null;

  afterEach(async () => {
    const { error } = await admin
      .from("challenges")
      .update({ unlock_level_override: originalOverride })
      .eq("id", DA_001);
    if (error) throw new Error(error.message);
  });

  it("accepts an underleveled user on a DA challenge but rejects a gated locked one", async () => {
    // Force the DA challenge's effective unlock far above level 1.
    const { data: before, error: readError } = await admin
      .from("challenges")
      .select("unlock_level_override")
      .eq("id", DA_001)
      .single();
    if (readError) throw new Error(readError.message);
    originalOverride = (before as { unlock_level_override: number | null }).unlock_level_override;

    const { error: lockError } = await admin
      .from("challenges")
      .update({ unlock_level_override: 50 })
      .eq("id", DA_001);
    if (lockError) throw new Error(lockError.message);

    // Exclude today's daily pick — it's exempt from gating, so if it happens
    // to be the alphabetically-first hard gated challenge the test would fail
    // by date-collision rather than by a real gating bug.
    const daily = await dailyChallengeIdServer();
    const gatedLocked = await lockedChallengeOfDifficulty("hard", daily); // gated sector, unlock 6

    const user = await createTestUser(); // fresh => level 1

    // Ungated sector: accepted despite the level-50 override.
    const result = await submit(user, DA_001, "a");
    expect(result.is_correct).toBeDefined();

    // Gated sector: the same level-1 user is still locked out.
    await expect(submit(user, gatedLocked, "a")).rejects.toThrow(/challenge_locked/);
  });

  it("a DA solve still awards XP (ungated does not mean unrewarded)", async () => {
    const user = await createTestUser();
    const result = await submit(user, DA_001, "a");
    expect(result.is_correct).toBe(true);
    expect(result.xp_delta).toBeGreaterThan(0); // +10 correct (+ first-try/daily)
  });
});
