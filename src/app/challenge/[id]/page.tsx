import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChallenge, getChallengeMetas, getSectors } from "@/lib/content/source";
import { AppShell } from "@/components/app-shell";
import { en } from "@/i18n/en";

/**
 * Public per-challenge permalink (Section 4: SSR/SSG for SEO on public
 * challenge pages). The full challenge body is embedded server-side so
 * crawlers see real content; the client seeds its cache from it.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const metas = await getChallengeMetas();
  return metas.map((meta) => ({ id: meta.id }));
}

function descriptionFrom(markdown: string): string {
  const plain = markdown
    .replace(/^#+\s.*$/gm, "")
    .replace(/[`*_#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 155 ? `${plain.slice(0, 152)}…` : plain;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const challenge = await getChallenge(id);
  if (!challenge) return { title: en.errors.notFoundTitle };
  const title = `${challenge.title} — ${en.app.name}`;
  const description = descriptionFrom(challenge.descriptionMd);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: en.app.name,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [challenges, sectors, challenge] = await Promise.all([
    getChallengeMetas(),
    getSectors(),
    getChallenge(id),
  ]);
  if (!challenge) notFound();
  return (
    <AppShell
      challenges={challenges}
      sectors={sectors}
      initialChallengeId={challenge.id}
      initialChallenge={challenge}
    />
  );
}
