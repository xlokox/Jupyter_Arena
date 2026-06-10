"use client";

import { useEffect, useRef, useState } from "react";
import type { Challenge } from "@/lib/content/schema";
import { Markdown } from "@/components/markdown";
import { ChallengeIcon } from "@/components/challenge-icon";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { CodeCell } from "./code-cell";
import { OutputCell } from "./output-cell";
import { ControlCell } from "./control-cell";
import { SolvePanel } from "./solve-panel";
import { useWorkspaceStore, getAttempt, type OptionKey } from "@/store/workspace";
import { useAuthStore } from "@/store/auth";
import { submitAttemptServer } from "@/lib/game/server-progress";
import { en } from "@/i18n/en";

const RUN_SIMULATION_MS = 700;
const RUN_SIMULATION_REDUCED_MS = 200;

interface NotebookViewProps {
  challenge: Challenge;
  onNext: () => void;
}

export function NotebookView({ challenge, onNext }: NotebookViewProps) {
  const attempt = useWorkspaceStore((s) => getAttempt(s.attempts, challenge.id));
  const selectOption = useWorkspaceStore((s) => s.selectOption);
  const startRun = useWorkspaceStore((s) => s.startRun);
  const completeRun = useWorkspaceStore((s) => s.completeRun);
  const abortRun = useWorkspaceStore((s) => s.abortRun);
  const applyServerOutcome = useWorkspaceStore((s) => s.applyServerOutcome);
  const revealHint = useWorkspaceStore((s) => s.revealHint);
  const isAuthed = useAuthStore((s) => s.status === "signedIn");
  const [runError, setRunError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleRun() {
    const { selectedOption, solved, runState } = attempt;
    if (!selectedOption || solved || runState === "running") return;
    const option = challenge.options.find((o) => o.key === selectedOption);
    if (!option) return;
    setRunError(null);
    startRun(challenge.id);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delayMs = reduced ? RUN_SIMULATION_REDUCED_MS : RUN_SIMULATION_MS;

    if (isAuthed) {
      // Authed users: the server is the only XP authority. Keep the run
      // simulation feel with a minimum delay alongside the RPC.
      const minDelay = new Promise((resolve) => setTimeout(resolve, delayMs));
      void Promise.all([
        submitAttemptServer(challenge.id, selectedOption, attempt.hintsRevealed),
        minDelay,
      ])
        .then(([result]) => applyServerOutcome(challenge.id, result))
        .catch(() => {
          abortRun(challenge.id);
          setRunError(en.auth.runError);
        });
    } else {
      timerRef.current = setTimeout(() => completeRun(challenge.id, option.isCorrect), delayMs);
    }
  }

  function handleSelect(option: OptionKey) {
    selectOption(challenge.id, option);
  }

  // The displayed code is the last-executed option's patch; until a run
  // completes, the original buggy code with the amber bug band.
  const ranOption =
    attempt.lastRunOption && attempt.runState !== "running"
      ? challenge.options.find((o) => o.key === attempt.lastRunOption)
      : null;
  const displayedCode = ranOption ? ranOption.patchCode : challenge.initialCode;
  const bugRegion = ranOption
    ? null
    : { start: challenge.buggyLineStart, end: challenge.buggyLineEnd };

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <ChallengeIcon name={challenge.icon} className="size-5 text-accent" />
        <h1 className="font-mono text-base font-semibold text-text md:text-lg">
          {challenge.title}
        </h1>
        <DifficultyBadge difficulty={challenge.difficulty} />
        <span className="text-xs text-muted">{en.sectors[challenge.sector]}</span>
      </header>

      <section
        aria-label={en.workspace.briefingAria}
        className="rounded-md border border-border bg-panel p-4 text-sm"
      >
        <Markdown>{challenge.descriptionMd}</Markdown>
      </section>

      <CodeCell
        code={displayedCode}
        language={challenge.language}
        bugRegion={bugRegion}
        title={challenge.title}
      />

      <OutputCell challenge={challenge} attempt={attempt} />

      {runError && (
        <p
          role="alert"
          className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {runError}
        </p>
      )}

      <ControlCell
        challenge={challenge}
        attempt={attempt}
        onSelect={handleSelect}
        onRun={handleRun}
        onHint={() => revealHint(challenge.id)}
        onNext={onNext}
      />

      {attempt.solved && <SolvePanel challenge={challenge} />}
    </div>
  );
}
