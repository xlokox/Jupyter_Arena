import { getChallenges, getSectors } from "@/lib/content/source";
import { AppShell } from "@/components/app-shell";

// Published content is read via the anon-key client (RLS) when Supabase env
// is present; ISR keeps it static-fast. fs fallback otherwise.
export const revalidate = 3600;

export default async function Home() {
  const [challenges, sectors] = await Promise.all([getChallenges(), getSectors()]);
  return <AppShell challenges={challenges} sectors={sectors} />;
}
