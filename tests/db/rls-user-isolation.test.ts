import { beforeAll, describe, expect, it } from "vitest";
import { admin, anonClient, createTestUser, ML_001, submit, type TestUser } from "./helpers";

/** User A must never read user B's rows; public_profiles exposes opt-ins only. */

let a: TestUser;
let b: TestUser;

beforeAll(async () => {
  a = await createTestUser();
  b = await createTestUser();
  // Give B real rows in every user table via the legitimate path.
  await submit(b, ML_001, "b");
  await submit(b, ML_001, "a");
});

const USER_TABLES = ["user_stats", "user_challenge_progress", "attempts", "xp_events"];

describe("cross-user isolation", () => {
  it("B has rows in every user table (sanity)", async () => {
    for (const table of USER_TABLES) {
      const { data } = await admin.from(table).select("user_id").eq("user_id", b.userId);
      expect(data!.length, table).toBeGreaterThan(0);
    }
  });

  it("A cannot read any of B's rows", async () => {
    for (const table of USER_TABLES) {
      const { data, error } = await a.client.from(table).select("*").eq("user_id", b.userId);
      expect(error, table).toBeNull();
      expect(data, table).toEqual([]);
    }
  });

  it("A reads exactly their own rows back", async () => {
    await submit(a, ML_001, "a");
    const { data } = await a.client.from("user_stats").select("user_id");
    expect(data).toEqual([{ user_id: a.userId }]);
  });

  it("anon reads nothing from any user table", async () => {
    for (const table of USER_TABLES) {
      const { data, error } = await anonClient().from(table).select("*");
      expect(error, table).toBeNull();
      expect(data, table).toEqual([]);
    }
  });

  it("A cannot read B's profile", async () => {
    const { data } = await a.client.from("profiles").select("*").eq("id", b.userId);
    expect(data).toEqual([]);
  });
});

describe("public_profiles", () => {
  it("exposes only opted-in usernames and display names", async () => {
    const username = `arena_${a.userId.slice(0, 8)}`;
    await admin
      .from("profiles")
      .update({ username, display_name: "Public Tester", is_public: true })
      .eq("id", a.userId);

    const { data, error } = await anonClient().from("public_profiles").select("*");
    expect(error).toBeNull();
    const names = (data ?? []).map((row) => row.username);
    expect(names).toContain(username);
    // B never opted in.
    expect(data!.every((row) => Object.keys(row).sort().join() === "display_name,username")).toBe(
      true,
    );

    await admin.from("profiles").update({ is_public: false }).eq("id", a.userId);
    const { data: after } = await anonClient().from("public_profiles").select("*");
    expect((after ?? []).map((row) => row.username)).not.toContain(username);
  });

  it("profile owner can update username but not local_merged_at", async () => {
    const { error: allowed } = await a.client
      .from("profiles")
      .update({ display_name: "Renamed" })
      .eq("id", a.userId);
    expect(allowed).toBeNull();

    const { error: denied } = await a.client
      .from("profiles")
      .update({ local_merged_at: new Date().toISOString() })
      .eq("id", a.userId);
    expect(denied).not.toBeNull();
  });
});

describe("achievement tables (5.6b)", () => {
  // Seed B real rows via admin (bypasses RLS) so the read policies are tested
  // independently of submit_attempt v3.
  beforeAll(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const badge = await admin
      .from("user_badges")
      .insert({ user_id: b.userId, badge_id: "first_blood" });
    expect(badge.error).toBeNull();
    const goal = await admin
      .from("user_daily_goals")
      .insert({ user_id: b.userId, goal_date: today, progress_solves: 1 });
    expect(goal.error).toBeNull();
  });

  const NEW_TABLES = ["user_badges", "user_daily_goals"];

  it("badge_definitions are world-readable (drives the trophy case)", async () => {
    const { data, error } = await anonClient().from("badge_definitions").select("id");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("A and anon cannot read B's badges or daily goals", async () => {
    for (const table of NEW_TABLES) {
      const seen = await a.client.from(table).select("*").eq("user_id", b.userId);
      expect(seen.error, table).toBeNull();
      expect(seen.data, table).toEqual([]);

      const anon = await anonClient().from(table).select("*");
      expect(anon.error, table).toBeNull();
      expect(anon.data, table).toEqual([]);
    }
  });

  it("clients cannot write achievement rows directly", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const badge = await a.client
      .from("user_badges")
      .insert({ user_id: a.userId, badge_id: "first_blood" });
    expect(badge.error).not.toBeNull();

    const goal = await a.client
      .from("user_daily_goals")
      .insert({ user_id: a.userId, goal_date: today, progress_solves: 1 });
    expect(goal.error).not.toBeNull();
  });
});
