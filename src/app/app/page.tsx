import { getChallengeMetas, getSectors } from "@/lib/content/source";
import { AppShell } from "@/components/app-shell";

// List views ship metadata only (Section 11); bodies load on demand from
// /api/challenges/[id]. Reads go through the anon-key client (RLS) when
// Supabase env is present; ISR keeps it static-fast. fs fallback otherwise.
export const revalidate = 3600;

export default async function AppPage() {
  const [challenges, sectors] = await Promise.all([getChallengeMetas(), getSectors()]);
  return <AppShell challenges={challenges} sectors={sectors} />;
}
