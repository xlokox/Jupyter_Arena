import { loadChallenges, loadSectors } from "@/lib/content/load";
import { AppShell } from "@/components/app-shell";

export default function Home() {
  const challenges = loadChallenges();
  const sectors = loadSectors();
  return <AppShell challenges={challenges} sectors={sectors} />;
}
