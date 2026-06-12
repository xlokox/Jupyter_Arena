import type { MetadataRoute } from "next";
import { getChallengeMetas } from "@/lib/content/source";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const metas = await getChallengeMetas();
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/daily`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/portfolio`, changeFrequency: "weekly", priority: 0.4 },
    ...metas.map((meta) => ({
      url: `${SITE_URL}/challenge/${meta.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
