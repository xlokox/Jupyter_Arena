import type { Metadata } from "next";
import { RankLadder } from "@/components/rank-ladder";
import { en } from "@/i18n/en";

export const metadata: Metadata = {
  title: `${en.rankLadder.title} — ${en.app.name}`,
  description: en.rankLadder.subtitle,
};

export default function RanksPage() {
  return <RankLadder />;
}
