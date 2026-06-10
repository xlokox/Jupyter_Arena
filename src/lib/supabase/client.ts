import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "./env";

/**
 * Browser client singleton. This module must only ever be loaded via dynamic
 * `import()` — supabase-js is ~30 kB gz and the bundle budget for the
 * workspace route is hard (MASTER_BRIEF.md Section 11).
 */
let client: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient | null {
  const env = publicSupabaseEnv();
  if (!env) return null;
  client ??= createBrowserClient(env.url, env.anonKey);
  return client;
}
