import { beforeAll, describe, expect, it } from "vitest";
import { anonClient, createTestUser, getStats, ML_001, submit, type TestUser } from "./helpers";

/** XP must be grantable ONLY via submit_attempt — every other vector fails. */

let user: TestUser;

beforeAll(async () => {
  user = await createTestUser();
  await submit(user, ML_001, "a"); // legit baseline rows
});

describe("direct writes are denied for the authenticated owner", () => {
  it("cannot insert xp_events", async () => {
    const { error } = await user.client
      .from("xp_events")
      .insert({ user_id: user.userId, challenge_id: ML_001, delta: 9999, reason: "correct_fix" });
    expect(error).not.toBeNull();
  });

  it("cannot insert attempts", async () => {
    const { error } = await user.client.from("attempts").insert({
      user_id: user.userId,
      challenge_id: ML_001,
      option_key: "a",
      is_correct: true,
    });
    expect(error).not.toBeNull();
  });

  it("cannot update own user_stats.xp", async () => {
    const { error } = await user.client
      .from("user_stats")
      .update({ xp: 99999 })
      .eq("user_id", user.userId);
    expect(error).not.toBeNull();
    const stats = await getStats(user.userId);
    expect(stats.xp).toBeLessThan(99999);
  });

  it("cannot update own progress.solved_at", async () => {
    const { error } = await user.client
      .from("user_challenge_progress")
      .update({ solved_at: new Date().toISOString() })
      .eq("user_id", user.userId);
    expect(error).not.toBeNull();
  });

  it("cannot delete attempts (no farming the rate window)", async () => {
    const { error } = await user.client.from("attempts").delete().eq("user_id", user.userId);
    expect(error).not.toBeNull();
  });
});

describe("RPC surface", () => {
  it("anon cannot execute submit_attempt", async () => {
    const { error } = await anonClient().rpc("submit_attempt", {
      p_challenge_id: ML_001,
      p_option_key: "a",
      p_hints_used: 0,
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot execute merge_local_progress", async () => {
    const { error } = await anonClient().rpc("merge_local_progress", { p_items: [] });
    expect(error).not.toBeNull();
  });
});
