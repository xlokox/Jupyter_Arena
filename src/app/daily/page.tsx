import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getChallenges, getSectors } from "@/lib/content/source";
import { dailyChallengeId } from "@/lib/game/daily";
import { utcDayOf } from "@/lib/game/xp";
import { AppShell } from "@/components/app-shell";
import { en } from "@/i18n/en";

// The featured challenge depends on the request-time UTC date, so this
// route renders dynamically instead of freezing the date at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Daily Challenge — ${en.app.name}`,
  description: en.app.tagline,
};

const cachedChallenges = unstable_cache(getChallenges, ["daily-challenges"], {
  revalidate: 3600,
});
const cachedSectors = unstable_cache(getSectors, ["daily-sectors"], { revalidate: 3600 });

export default async function DailyPage() {
  const challenges = await cachedChallenges();
  const sectors = await cachedSectors();
  const todaysId = dailyChallengeId(
    challenges.map((c) => c.id),
    utcDayOf(new Date()),
  );
  return <AppShell challenges={challenges} sectors={sectors} initialChallengeId={todaysId} />;
}
