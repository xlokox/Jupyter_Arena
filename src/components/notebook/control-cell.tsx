"use client";

import { ArrowRight, Check, Lightbulb, Play, X } from "lucide-react";
import type { Challenge } from "@/lib/content/schema";
import type { AttemptState, OptionKey } from "@/store/workspace";
import { MAX_HINTS } from "@/store/workspace";
import { en } from "@/i18n/en";

interface ControlCellProps {
  challenge: Challenge;
  attempt: AttemptState;
  onSelect: (option: OptionKey) => void;
  onRun: () => void;
  onHint: () => void;
  onNext: () => void;
}

export function ControlCell({
  challenge,
  attempt,
  onSelect,
  onRun,
  onHint,
  onNext,
}: ControlCellProps) {
  const { selectedOption, runState, lastRunOption, hintsRevealed, solved } = attempt;
  const locked = solved || runState === "running";

  return (
    <section className="flex gap-3">
      <span className="hidden w-16 shrink-0 sm:block" aria-hidden />
      <div className="min-w-0 flex-1 space-y-4">
        <fieldset role="radiogroup" aria-label={en.workspace.optionsAria} className="space-y-2">
          <legend className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
            {en.workspace.optionsHeading}
          </legend>
          {challenge.options.map((option) => {
            const isSelected = selectedOption === option.key;
            const ranThis = lastRunOption === option.key && runState !== "running";
            const showFailed = ranThis && runState === "failed";
            const showSolved = ranThis && runState === "solved";
            const border = showSolved
              ? "border-success"
              : showFailed
                ? "border-danger motion-safe:animate-[shake_0.3s_ease-in-out]"
                : isSelected
                  ? "border-accent"
                  : "border-border hover:border-accent-hover/60";
            return (
              <div key={option.key}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={locked && !isSelected}
                  onClick={() => onSelect(option.key)}
                  className={`flex w-full items-start gap-3 rounded-md border bg-panel px-3 py-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${border}`}
                >
                  <span
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs uppercase ${
                      isSelected ? "border-accent text-accent" : "border-border text-muted"
                    }`}
                    aria-hidden
                  >
                    {showSolved ? (
                      <Check className="size-3.5 text-success" />
                    ) : showFailed ? (
                      <X className="size-3.5 text-danger" />
                    ) : (
                      option.key
                    )}
                  </span>
                  <span className="text-sm leading-relaxed text-text/90">{option.label}</span>
                </button>
                {ranThis && (
                  <p
                    className={`mt-1 rounded-md border px-3 py-2 text-xs leading-relaxed ${
                      showSolved
                        ? "border-success/40 bg-success/5 text-success"
                        : "border-danger/40 bg-danger/5 text-danger"
                    }`}
                  >
                    <span className="font-semibold">
                      {showSolved ? en.workspace.solvedBadge : en.workspace.failedBadge}
                    </span>{" "}
                    <span className="text-text/80">{option.rationale}</span>
                  </p>
                )}
              </div>
            );
          })}
        </fieldset>

        {hintsRevealed > 0 && (
          <div aria-label={en.workspace.hintsAria} className="space-y-2">
            {challenge.hints.slice(0, hintsRevealed).map((hint, index) => (
              <p
                key={index}
                className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-text/90"
              >
                <span className="font-mono text-accent">
                  {en.workspace.hintLabel} {index + 1}/{MAX_HINTS}:
                </span>{" "}
                {hint}
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-run-cell
            onClick={onRun}
            disabled={!selectedOption || locked}
            className="flex min-h-[44px] items-center gap-2 rounded-md bg-accent px-4 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="size-4" aria-hidden />
            {en.workspace.runCell}
          </button>
          <button
            type="button"
            onClick={onHint}
            disabled={hintsRevealed >= MAX_HINTS}
            className="flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-panel-2 px-4 text-sm text-text transition-colors hover:border-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Lightbulb className="size-4 text-accent" aria-hidden />
            {en.workspace.aiHint} ({hintsRevealed}/{MAX_HINTS})
          </button>
          <button
            type="button"
            onClick={onNext}
            className={`ms-auto flex min-h-[44px] items-center gap-2 rounded-md border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              solved
                ? "border-success bg-success/10 text-success hover:bg-success/20"
                : "border-border bg-panel-2 text-muted hover:border-accent-hover hover:text-text"
            }`}
          >
            {en.workspace.nextNotebook}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
