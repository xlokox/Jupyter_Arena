/**
 * Public Supabase env (anon key only — the service-role key must never be
 * imported anywhere under src/). All call sites no-op gracefully when these
 * are absent so env-less dev/CI keeps working on the fs/localStorage paths.
 */
export function publicSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}
