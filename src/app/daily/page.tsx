import type { Metadata } from "next";
import { loadChallenges, loadSectors } from "@/lib/content/load";
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

export default function DailyPage() {
  const challenges = loadChallenges();
  const sectors = loadSectors();
  const todaysId = dailyChallengeId(
    challenges.map((c) => c.id),
    utcDayOf(new Date()),
  );
  return <AppShell challenges={challenges} sectors={sectors} initialChallengeId={todaysId} />;
}
