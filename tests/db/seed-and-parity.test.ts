import { describe, expect, it } from "vitest";
import { loadChallenges } from "@/lib/content/load";
import { CHALLENGE_SELECT, mapChallengeRow } from "@/lib/content/source";
import { seedContent } from "../../scripts/seed-content";
import { admin, anonClient, UNPUBLISHED_ID } from "./helpers";

/** Seed idempotency (exact row counts) + DB↔fs content parity. */

async function countRows(table: string): Promise<number> {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

describe("seed idempotency", () => {
  it("re-running the seed changes no row counts", async () => {
    await seedContent(admin); // global setup already ran it once
    const before = {
      sectors: await countRows("sectors"),
      challenges: await countRows("challenges"),
      options: await countRows("challenge_options"),
      hints: await countRows("challenge_hints"),
      tutorials: await countRows("tutorials"),
      videos: await countRows("tutorial_videos"),
    };

    await seedContent(admin);

    expect({
      sectors: await countRows("sectors"),
      challenges: await countRows("challenges"),
      options: await countRows("challenge_options"),
      hints: await countRows("challenge_hints"),
      tutorials: await countRows("tutorials"),
      videos: await countRows("tutorial_videos"),
    }).toEqual(before);
  });

  it("does not resurrect unpublished rows", async () => {
    const { data } = await admin
      .from("challenges")
      .select("is_published")
      .eq("id", UNPUBLISHED_ID)
      .maybeSingle();
    if (data) expect(data.is_published).toBe(false);
  });
});

describe("content parity", () => {
  it("DB-served content deep-equals the fs content for every challenge", async () => {
    const fromFs = loadChallenges();
    const { data, error } = await anonClient().from("challenges").select(CHALLENGE_SELECT);
    expect(error).toBeNull();

    const fromDb = new Map(
      (data ?? []).map((row) => {
        const challenge = mapChallengeRow(row as Parameters<typeof mapChallengeRow>[0]);
        return [challenge.id, challenge] as const;
      }),
    );

    expect(fromDb.size).toBe(fromFs.length);
    for (const challenge of fromFs) {
      expect(fromDb.get(challenge.id)).toEqual(challenge);
    }
  });
});
