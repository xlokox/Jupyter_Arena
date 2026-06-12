import type { Metadata } from "next";
import { getChallengeMetas } from "@/lib/content/source";
import { PortfolioView } from "@/components/portfolio-view";
import { en } from "@/i18n/en";

export const metadata: Metadata = {
  title: `${en.portfolio.title} — ${en.app.name}`,
  description: en.portfolio.linkedinLine,
};

export const revalidate = 3600;

export default async function PortfolioPage() {
  const challenges = await getChallengeMetas();
  return <PortfolioView challenges={challenges} />;
}
