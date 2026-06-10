import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Fail-loud harness: a skipped authz suite must never look green
 * (Working Agreement 3), so missing env throws instead of skipping.
 */

export function requireEnv(): { url: string; anonKey: string; serviceRoleKey: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? process.env.API_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      "DB integration tests need a running local Supabase stack.\n" +
        "  pnpm db:start\n" +
        "  eval $(pnpm exec supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)')\n" +
        "  NEXT_PUBLIC_SUPABASE_URL=$API_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY pnpm test:db",
    );
  }
  return { url, anonKey, serviceRoleKey };
}

const env = requireEnv();

/** Service-role client — test setup only, never the surface under test. */
export const admin: SupabaseClient = createClient(env.url, env.serviceRoleKey, {
  auth: { persistSession: false },
});

/** A fresh anon-key client with no session: the anonymous attack surface. */
export const anonClient = (): SupabaseClient =>
  createClient(env.url, env.anonKey, { auth: { persistSession: false } });

export interface TestUser {
  client: SupabaseClient;
  userId: string;
  email: string;
}

/**
 * Real GoTrue users with real JWTs. Password sign-in is test-only plumbing;
 * the product flow is email OTP.
 */
export async function createTestUser(): Promise<TestUser> {
  const email = `arena-test-${crypto.randomUUID()}@example.com`;
  const password = `pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);

  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`signIn failed: ${signInError.message}`);
  return { client, userId: data.user.id, email };
}

export const utcDay = (daysAgo = 0): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

/** Rewrites streak bookkeeping to simulate prior days (admin bypasses RLS). */
export async function setStats(
  userId: string,
  patch: Partial<{
    xp: number;
    current_streak: number;
    longest_streak: number;
    last_active: string | null;
  }>,
): Promise<void> {
  const { error } = await admin.from("user_stats").update(patch).eq("user_id", userId);
  if (error) throw new Error(`setStats failed: ${error.message}`);
}

export async function getStats(userId: string) {
  const { data, error } = await admin.from("user_stats").select("*").eq("user_id", userId).single();
  if (error) throw new Error(`getStats failed: ${error.message}`);
  return data;
}

export interface SubmitResult {
  is_correct: boolean;
  xp_delta: number;
  new_xp: number;
  level: number;
  streak: number;
  already_solved: boolean;
  events: Array<{ reason: string; delta: number }>;
}

export async function submit(
  user: TestUser,
  challengeId: string,
  optionKey: string,
  hintsUsed = 0,
): Promise<SubmitResult> {
  const { data, error } = await user.client.rpc("submit_attempt", {
    p_challenge_id: challengeId,
    p_option_key: optionKey,
    p_hints_used: hintsUsed,
  });
  if (error) throw new Error(error.message);
  return data as SubmitResult;
}

/** Known seed content: ml-001 has correct option "a"; "b"/"c" are wrong. */
export const ML_001 = "ml-001-kmeans-scaling";
export const ML_002 = "ml-002-test-set-leakage";
export const DL_001 = "dl-001-device-mismatch";
export const DL_002 = "dl-002-missing-zero-grad";
export const FS_001 = "fullstack-001-stale-closure";
export const FS_002 = "fullstack-002-index-keys";
export const DB_002 = "db-002-sql-injection";

/** An unpublished challenge fixture (plus children) for invisibility tests. */
export const UNPUBLISHED_ID = "ml-099-unpublished-fixture";

export async function ensureUnpublishedFixture(): Promise<void> {
  const { error } = await admin.from("challenges").upsert(
    {
      id: UNPUBLISHED_ID,
      sector_id: "ml",
      difficulty: "easy",
      title: "99_unpublished.ipynb",
      language: "python",
      icon: "users",
      concept_tags: ["fixture"],
      description_md: "Unpublished fixture for RLS tests.",
      initial_code: "print('draft')",
      buggy_line_start: 1,
      buggy_line_end: 1,
      traceback: "Draft traceback for the unpublished RLS fixture row.",
      correct_output: "Draft output for the fixture.",
      recruiter_review: "Draft review.",
      explanation_md: "Draft explanation.",
      is_published: false,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`fixture challenge failed: ${error.message}`);

  const { error: optionError } = await admin.from("challenge_options").upsert(
    {
      challenge_id: UNPUBLISHED_ID,
      option_key: "a",
      label: "Fixture option",
      patch_code: "print('fixed')",
      is_correct: true,
      result_log: "Fixture result log text.",
      rationale: "Fixture rationale text for the unpublished challenge option row.",
    },
    { onConflict: "challenge_id,option_key" },
  );
  if (optionError) throw new Error(`fixture option failed: ${optionError.message}`);

  const { error: hintError } = await admin
    .from("challenge_hints")
    .upsert(
      { challenge_id: UNPUBLISHED_ID, hint_order: 1, hint_md: "Fixture hint." },
      { onConflict: "challenge_id,hint_order" },
    );
  if (hintError) throw new Error(`fixture hint failed: ${hintError.message}`);

  const { error: tutorialError } = await admin
    .from("tutorials")
    .upsert({ challenge_id: UNPUBLISHED_ID, body_md: "Fixture tutorial." });
  if (tutorialError) throw new Error(`fixture tutorial failed: ${tutorialError.message}`);

  const { error: videoError } = await admin.from("tutorial_videos").upsert(
    {
      challenge_id: UNPUBLISHED_ID,
      title: "Fixture video",
      url: "https://www.youtube.com/results?search_query=fixture",
      position: 0,
    },
    { onConflict: "challenge_id,position" },
  );
  if (videoError) throw new Error(`fixture video failed: ${videoError.message}`);
}
