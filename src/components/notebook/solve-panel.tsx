import { BadgeCheck, GraduationCap, Sparkles, UserRound } from "lucide-react";
import type { Challenge } from "@/lib/content/schema";
import { Markdown } from "@/components/markdown";
import { en } from "@/i18n/en";

/** Explanation + recruiter review — expands once the challenge is solved. */
export function SolvePanel({ challenge }: { challenge: Challenge }) {
  return (
    <div className="space-y-4">
      <section
        aria-label={en.workspace.explanationHeading}
        className="rounded-md border border-border bg-panel p-4 motion-safe:animate-[toast-in_0.4s_ease-out_both]"
      >
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
          <GraduationCap className="size-4 text-accent" aria-hidden />
          {en.workspace.explanationHeading}
        </h3>
        <div className="text-sm">
          <Markdown>{challenge.explanationMd}</Markdown>
        </div>
      </section>

      <section
        aria-label={en.workspace.recruiterHeading}
        className="relative overflow-hidden rounded-md border border-success/40 bg-panel p-4 motion-safe:animate-[toast-in_0.4s_ease-out_0.12s_both]"
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full border border-border bg-panel-2">
            <UserRound className="size-5 text-muted" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-text">{en.workspace.recruiterHeading}</p>
            <p className="text-xs text-muted">{en.workspace.recruiterRole}</p>
          </div>
          <span className="ms-auto flex items-center gap-1 rounded border border-success px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-success">
            <BadgeCheck className="size-3.5" aria-hidden />
            {en.workspace.approvedStamp}
          </span>
        </div>
        <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-text/90">
          {challenge.recruiterReview}
        </p>
      </section>

      {challenge.takeaway && (
        <section
          aria-label={en.workspace.takeawayHeading}
          className="flex items-start gap-3 rounded-md border border-accent/40 bg-accent/5 p-4 motion-safe:animate-[toast-in_0.4s_ease-out_0.24s_both]"
        >
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
              {en.workspace.takeawayHeading}
            </p>
            <p className="mt-0.5 text-sm text-text">{challenge.takeaway}</p>
          </div>
        </section>
      )}
    </div>
  );
}
