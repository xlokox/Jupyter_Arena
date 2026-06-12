"use client";

import { BookOpen, ExternalLink, Loader2, Play } from "lucide-react";
import type { Challenge, ChallengeMeta } from "@/lib/content/schema";
import { useChallenge } from "@/lib/content/use-challenge";
import { Markdown } from "@/components/markdown";
import { ChallengeIcon } from "@/components/challenge-icon";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { useWorkspaceStore } from "@/store/workspace";
import { en } from "@/i18n/en";

export function TutorialView({ meta }: { meta: ChallengeMeta }) {
  const { challenge, failed } = useChallenge(meta.id);
  if (!challenge) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6" aria-busy={!failed}>
        <div
          role={failed ? "alert" : "status"}
          className={`flex items-center gap-2 rounded-md border p-4 text-sm ${failed ? "border-danger/50 bg-danger/10 text-danger" : "border-border bg-panel text-muted"}`}
        >
          {!failed && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />}
          {failed ? en.workspace.loadFailed : en.workspace.loadingNotebook}
        </div>
      </div>
    );
  }
  return <LoadedTutorial challenge={challenge} />;
}

function LoadedTutorial({ challenge }: { challenge: Challenge }) {
  const openMission = useWorkspaceStore((s) => s.openMission);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-accent">
          <BookOpen className="size-3" aria-hidden />
          {en.tutorial.badge}
        </span>
        <ChallengeIcon name={challenge.icon} className="size-5 text-accent" />
        <h1 className="font-mono text-base font-semibold text-text md:text-lg">
          {challenge.title}
        </h1>
        <DifficultyBadge difficulty={challenge.difficulty} />
      </header>

      <section className="rounded-md border border-border bg-panel p-4 text-sm md:p-5">
        <Markdown>{challenge.tutorial.bodyMd}</Markdown>
      </section>

      <section aria-label={en.tutorial.videosHeading}>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
          {en.tutorial.videosHeading}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {challenge.tutorial.videos.map((video) => (
            <a
              key={video.searchQuery}
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[44px] flex-col gap-2 rounded-md border border-border bg-panel p-4 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="text-sm font-medium leading-snug text-text group-hover:text-accent">
                {video.title}
              </span>
              <span className="mt-auto flex items-center gap-1.5 text-xs text-muted">
                <ExternalLink className="size-3.5" aria-hidden />
                {en.tutorial.watchOnYoutube}
              </span>
            </a>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => openMission(challenge.id)}
        className="flex min-h-[44px] items-center gap-2 rounded-md bg-accent px-5 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Play className="size-4" aria-hidden />
        {en.tutorial.startMission}
      </button>
    </div>
  );
}
