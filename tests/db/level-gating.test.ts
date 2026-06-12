import { beforeAll, describe, expect, it } from "vitest";
import {
  createTestUser,
  dailyChallengeIdServer,
  lockedChallengeOfDifficulty,
  ML_001,
  setStats,
  submit,
} from "./helpers";

/**
 * Phase 5.5 — server-side level gating via the unlock_rules table.
 * The submit_attempt RPC must raise challenge_locked when the user's
 * effective level (floor(xp/50)+1) is below the challenge's unlock threshold.
 *
 * Gated targets are chosen dynamically to exclude today's daily pick, which is
 * exempt from gating (010) — see daily-challenge.test.ts for that exemption.
 */

let mediumChallenge: string; // unlocks at level 3
let hardChallenge: string; // unlocks at level 6

beforeAll(async () => {
  const daily = await dailyChallengeIdServer();
  mediumChallenge = await lockedChallengeOfDifficulty("medium", daily);
  hardChallenge = await lockedChallengeOfDifficulty("hard", daily);
});

describe("level gating — medium challenges (unlock at level 3)", () => {
  it("rejects a medium challenge for a level-2 user", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { xp: 50 }); // floor(50/50)+1 = 2
    await expect(submit(user, mediumChallenge, "a")).rejects.toThrow(/challenge_locked/);
  });

  it("allows a medium challenge at exactly level 3", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { xp: 100 }); // floor(100/50)+1 = 3
    const result = await submit(user, mediumChallenge, "a");
    expect(result.is_correct).toBeDefined();
  });
});

describe("level gating — hard challenges (unlock at level 6)", () => {
  it("rejects a hard challenge for a level-5 user", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { xp: 200 }); // floor(200/50)+1 = 5
    await expect(submit(user, hardChallenge, "a")).rejects.toThrow(/challenge_locked/);
  });

  it("allows a hard challenge at exactly level 6", async () => {
    const user = await createTestUser();
    await setStats(user.userId, { xp: 250 }); // floor(250/50)+1 = 6
    const result = await submit(user, hardChallenge, "a");
    expect(result.is_correct).toBeDefined();
  });
});

describe("level gating — easy challenges (always accessible)", () => {
  it("allows an easy challenge at level 1 (fresh user)", async () => {
    const user = await createTestUser();
    const result = await submit(user, ML_001, "a");
    expect(result.is_correct).toBe(true);
  });
});
