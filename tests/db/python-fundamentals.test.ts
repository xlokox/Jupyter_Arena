import { afterEach, describe, expect, it } from "vitest";
import {
  admin,
  createTestUser,
  dailyChallengeIdServer,
  lockedChallengeOfDifficulty,
  PY_001,
  submit,
} from "./helpers";

/**
 * Python Fundamentals sector — the second ungated on-ramp. Same mechanism as
 * Data Analyst: submit_attempt (015) skips challenge_locked when the sector is
 * not gated, even with a high unlock_level_override. Gated sectors unaffected.
 */

describe("ungated Python Fundamentals sector", () => {
  let originalOverride: number | null = null;

  afterEach(async () => {
    const { error } = await admin
      .from("challenges")
      .update({ unlock_level_override: originalOverride })
      .eq("id", PY_001);
    if (error) throw new Error(error.message);
  });

  it("accepts an underleveled user on a PY challenge but rejects a gated locked one", async () => {
    const { data: before, error: readError } = await admin
      .from("challenges")
      .select("unlock_level_override")
      .eq("id", PY_001)
      .single();
    if (readError) throw new Error(readError.message);
    originalOverride = (before as { unlock_level_override: number | null }).unlock_level_override;

    const { error: lockError } = await admin
      .from("challenges")
      .update({ unlock_level_override: 50 })
      .eq("id", PY_001);
    if (lockError) throw new Error(lockError.message);

    // Exclude today's daily pick — exempt from gating, would collide with the
    // alphabetically-first hard gated challenge on some UTC days.
    const daily = await dailyChallengeIdServer();
    const gatedLocked = await lockedChallengeOfDifficulty("hard", daily);
    const user = await createTestUser(); // fresh => level 1

    const result = await submit(user, PY_001, "a");
    expect(result.is_correct).toBeDefined();

    await expect(submit(user, gatedLocked, "a")).rejects.toThrow(/challenge_locked/);
  });

  it("a PY solve still awards XP", async () => {
    const user = await createTestUser();
    const result = await submit(user, PY_001, "a");
    expect(result.is_correct).toBe(true);
    expect(result.xp_delta).toBeGreaterThan(0);
  });
});
