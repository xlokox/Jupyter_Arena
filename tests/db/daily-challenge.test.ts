import { afterEach, describe, expect, it } from "vitest";
import { dailyChallengeId } from "@/lib/game/daily";
import { utcDayOf } from "@/lib/game/xp";
import {
  admin,
  createTestUser,
  dailyChallengeIdServer,
  submit,
  ungatedSectorIds,
} from "./helpers";

/**
 * Phase 5.6b — the daily featured challenge is curated for everyone that day,
 * so it must always be playable regardless of player level. submit_attempt
 * exempts today's deterministic pick from the challenge_locked gate (010),
 * and daily_challenge_id() must stay in lockstep with src/lib/game/daily.ts.
 */

async function publishedIds(): Promise<string[]> {
  const { data, error } = await admin
    .from("challenges")
    .select("id")
    .eq("is_published", true);
  if (error) throw new Error(error.message);
  return (data as Array<{ id: string }>).map((r) => r.id);
}

describe("daily pick parity (SQL ⇄ src/lib/game/daily.ts)", () => {
  it("the SQL daily_challenge_id() matches the TypeScript algorithm", async () => {
    const ids = await publishedIds();
    const expected = dailyChallengeId(ids, utcDayOf(new Date()));
    expect(expected).toBeTruthy();
    expect(await dailyChallengeIdServer()).toBe(expected);
  });
});

describe("daily challenge is exempt from level gating", () => {
  // The test forces today's pick to be hard-locked; restore so it cannot leak
  // into other (serial) suites.
  let dailyId: string;
  let originalOverride: number | null = null;

  afterEach(async () => {
    if (!dailyId) return;
    const { error } = await admin
      .from("challenges")
      .update({ unlock_level_override: originalOverride })
      .eq("id", dailyId);
    if (error) throw new Error(error.message);
  });

  it("an underleveled user CAN submit the daily but CANNOT submit a non-daily locked challenge", async () => {
    const id = await dailyChallengeIdServer();
    expect(id).toBeTruthy();
    dailyId = id!;

    // Force the daily pick well above any fresh user's reach, so a level-1
    // user submitting it proves the exemption (not an already-easy pick).
    const { data: before, error: readError } = await admin
      .from("challenges")
      .select("unlock_level_override")
      .eq("id", dailyId)
      .single();
    if (readError) throw new Error(readError.message);
    originalOverride = (before as { unlock_level_override: number | null }).unlock_level_override;

    const { error: lockError } = await admin
      .from("challenges")
      .update({ unlock_level_override: 50 })
      .eq("id", dailyId);
    if (lockError) throw new Error(lockError.message);

    // A guaranteed-locked challenge that is NOT today's daily.
    const ungated = await ungatedSectorIds();
    let nonDailyQuery = admin
      .from("challenges")
      .select("id")
      .eq("is_published", true)
      .in("difficulty", ["medium", "hard", "very_hard"])
      .neq("id", dailyId);
    if (ungated.length > 0) {
      nonDailyQuery = nonDailyQuery.not("sector_id", "in", `(${ungated.join(",")})`);
    }
    const { data: nonDaily, error: nonDailyError } = await nonDailyQuery.limit(1).single();
    if (nonDailyError) throw new Error(nonDailyError.message);
    const nonDailyId = (nonDaily as { id: string }).id;

    const user = await createTestUser(); // fresh => level 1

    // The daily is exempt: submit returns an outcome instead of raising
    // challenge_locked (option "a" exists for every challenge; correctness is
    // irrelevant to the gate).
    const result = await submit(user, dailyId, "a");
    expect(result.is_correct).toBeDefined();

    // A non-daily locked challenge still rejects the same level-1 user.
    await expect(submit(user, nonDailyId, "a")).rejects.toThrow(/challenge_locked/);
  });
});
