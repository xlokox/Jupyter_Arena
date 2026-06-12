import { NextResponse } from "next/server";
import { getChallenge, getChallengeMetas } from "@/lib/content/source";

/**
 * On-demand challenge bodies (Section 11: list views ship metadata only).
 * Statically generated per challenge at build, revalidated hourly.
 */
export const revalidate = 3600;
export const dynamic = "force-static";

export async function generateStaticParams() {
  const metas = await getChallengeMetas();
  return metas.map((meta) => ({ id: meta.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = await getChallenge(id);
  if (!challenge) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(challenge);
}
