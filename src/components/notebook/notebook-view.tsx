"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import type { Challenge, ChallengeMeta } from "@/lib/content/schema";
import { useChallenge } from "@/lib/content/use-challenge";
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
  meta: ChallengeMeta;
  /** Server-rendered permalink pages seed the body for SEO + instant paint. */
  initialChallenge?: Challenge | null;
  onNext: () => void;
}

export function NotebookView({ meta, initialChallenge, onNext }: NotebookViewProps) {
  const { challenge, failed } = useChallenge(meta.id, initialChallenge);
  if (!challenge) {
    return <NotebookFallback meta={meta} failed={failed} />;
  }
  return <LoadedNotebook challenge={challenge} onNext={onNext} />;
}

function NotebookFallback({ meta, failed }: { meta: ChallengeMeta; failed: boolean }) {
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6" aria-busy={!failed}>
      <header className="flex flex-wrap items-center gap-3">
        <ChallengeIcon name={meta.icon} className="size-5 text-accent" />
        <h1 className="font-mono text-base font-semibold text-text md:text-lg">{meta.title}</h1>
        <DifficultyBadge difficulty={meta.difficulty} />
      </header>
      {failed ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
        >
          {en.workspace.loadFailed}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-panel-2 px-4 text-sm text-text hover:border-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <RefreshCw className="size-4" aria-hidden />
            {en.workspace.retry}
          </button>
        </div>
      ) : (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-border bg-panel p-4 text-sm text-muted"
        >
          <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
          {en.workspace.loadingNotebook}
        </div>
      )}
    </div>
  );
}

function LoadedNotebook({ challenge, onNext }: { challenge: Challenge; onNext: () => void }) {
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
