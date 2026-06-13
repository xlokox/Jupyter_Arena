import { Loader2 } from "lucide-react";
import type { Challenge } from "@/lib/content/schema";
import type { AttemptState } from "@/store/workspace";
import { en } from "@/i18n/en";
import { FigurePanel } from "./figure-panel";

interface OutputCellProps {
  challenge: Challenge;
  attempt: AttemptState;
}

export function OutputCell({ challenge, attempt }: OutputCellProps) {
  const { runState, lastRunOption } = attempt;
  const ranOption =
    lastRunOption ? challenge.options.find((o) => o.key === lastRunOption) : undefined;
  // Post-fix figure: only on a successful run AND only when the option ships one.
  const postFigureSvg =
    runState === "solved" && ranOption?.resultFigureSvg ? ranOption.resultFigureSvg : null;

  let body: React.ReactNode;
  let tone = "text-danger";
  // Solved output expands into place; a failed run gives the cell one shake.
  const anim =
    runState === "solved"
      ? "motion-safe:animate-[output-reveal_0.35s_ease-out]"
      : runState === "failed"
        ? "motion-safe:animate-[shake_0.3s_ease-in-out]"
        : "";

  if (runState === "running") {
    body = (
      <span className="flex items-center gap-2 text-muted">
        <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
        {en.workspace.outputRunning}
      </span>
    );
    tone = "text-muted";
  } else if (runState === "solved") {
    body = ranOption?.resultLog ?? challenge.correctOutput;
    tone = "text-success";
  } else if (runState === "failed") {
    body = ranOption?.resultLog ?? challenge.traceback;
    tone = "text-danger";
  } else {
    // Idle: the notebook arrives broken — the red traceback is the starting state.
    body = challenge.traceback;
  }

  return (
    <section aria-label={en.workspace.outputCellAria} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <span className="hidden w-16 shrink-0 pt-3 text-end font-mono text-xs text-danger sm:block">
          {en.workspace.outLabel} [1]:
        </span>
        <div
          aria-live="polite"
          className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-code-bg"
        >
          <pre
            key={`${runState}-${lastRunOption ?? "none"}`}
            className={`overflow-x-auto whitespace-pre-wrap p-3 font-mono text-xs leading-5 motion-safe:transition-colors ${tone} ${anim}`}
          >
            {body}
          </pre>
        </div>
      </div>
      {postFigureSvg && challenge.figureCaption && (
        <div className="sm:ms-[76px]">
          <FigurePanel
            svg={postFigureSvg}
            caption={challenge.figureCaption}
            variant="after"
          />
        </div>
      )}
    </section>
  );
}
