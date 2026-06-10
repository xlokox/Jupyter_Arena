import type { Metadata } from "next";
import { loadChallenges } from "@/lib/content/load";
import { PortfolioView } from "@/components/portfolio-view";
import { en } from "@/i18n/en";

export const metadata: Metadata = {
  title: `${en.portfolio.title} — ${en.app.name}`,
  description: en.portfolio.linkedinLine,
};

export default function PortfolioPage() {
  const challenges = loadChallenges();
  return <PortfolioView challenges={challenges} />;
}
