import { beforeAll, describe, expect, it } from "vitest";
import {
  anonClient,
  createTestUser,
  ensureUnpublishedFixture,
  ML_001,
  UNPUBLISHED_ID,
  type TestUser,
} from "./helpers";

/**
 * Content RLS: published rows readable by everyone; unpublished challenges
 * and ALL their child rows invisible to anon AND authenticated.
 */

let authed: TestUser;

beforeAll(async () => {
  await ensureUnpublishedFixture();
  authed = await createTestUser();
});

const CHILD_TABLES = ["challenge_options", "challenge_hints", "tutorials", "tutorial_videos"];

describe("published content", () => {
  it("is readable by anon", async () => {
    const { data, error } = await anonClient().from("challenges").select("id").eq("id", ML_001);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("exposes child rows of published challenges to anon", async () => {
    for (const table of CHILD_TABLES) {
      const { data, error } = await anonClient()
        .from(table)
        .select("challenge_id")
        .eq("challenge_id", ML_001);
      expect(error, table).toBeNull();
      expect(data!.length, table).toBeGreaterThan(0);
    }
  });

  it("lists only published challenges (the fixture is absent)", async () => {
    const { data } = await anonClient().from("challenges").select("id");
    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(ML_001);
    expect(ids).not.toContain(UNPUBLISHED_ID);
  });
});

describe("unpublished content", () => {
  it("challenge row is invisible to anon and authenticated", async () => {
    for (const client of [anonClient(), authed.client]) {
      const { data, error } = await client.from("challenges").select("id").eq("id", UNPUBLISHED_ID);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    }
  });

  it("every child table hides rows of the unpublished challenge", async () => {
    for (const client of [anonClient(), authed.client]) {
      for (const table of CHILD_TABLES) {
        const { data, error } = await client
          .from(table)
          .select("challenge_id")
          .eq("challenge_id", UNPUBLISHED_ID);
        expect(error, table).toBeNull();
        expect(data, table).toEqual([]);
      }
    }
  });
});

describe("content writes", () => {
  it("anon and authenticated cannot insert or update content", async () => {
    for (const client of [anonClient(), authed.client]) {
      const { error: insertError } = await client
        .from("sectors")
        .insert({ id: "ml", name: "Hacked", position: 99 });
      expect(insertError).not.toBeNull();

      const { error: updateError } = await client
        .from("challenges")
        .update({ is_published: true })
        .eq("id", UNPUBLISHED_ID);
      expect(updateError).not.toBeNull();
    }
  });
});
