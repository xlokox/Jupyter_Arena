"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, GraduationCap, Loader2, Lock, RefreshCw } from "lucide-react";
import type { Challenge, ChallengeMeta } from "@/lib/content/schema";
import { useChallenge } from "@/lib/content/use-challenge";
import { Markdown } from "@/components/markdown";
import { ChallengeIcon } from "@/components/challenge-icon";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { CodeCell } from "./code-cell";
import { OutputCell } from "./output-cell";
import { ControlCell } from "./control-cell";
import { SolvePanel } from "./solve-panel";
import { FigurePanel } from "./figure-panel";
import { GlossaryDisclosure } from "./glossary-disclosure";
import { useWorkspaceStore, getAttempt, type OptionKey } from "@/store/workspace";
import { useAuthStore } from "@/store/auth";
import { submitAttemptServer } from "@/lib/game/server-progress";
import { levelForXp, XP_PER_LEVEL } from "@/lib/game/xp";
import { en } from "@/i18n/en";

const RUN_SIMULATION_MS = 700;
const RUN_SIMULATION_REDUCED_MS = 200;

interface NotebookViewProps {
  meta: ChallengeMeta;
  /** Server-rendered permalink pages seed the body for SEO + instant paint. */
  initialChallenge?: Challenge | null;
  /** Today's featured pick is always playable, regardless of player level. */
  isDaily?: boolean;
  onNext: () => void;
}

export function NotebookView({ meta, initialChallenge, isDaily, onNext }: NotebookViewProps) {
  const { challenge, failed } = useChallenge(meta.id, initialChallenge);
  if (!challenge) {
    return <NotebookFallback meta={meta} failed={failed} />;
  }
  return <LoadedNotebook challenge={challenge} meta={meta} isDaily={isDaily} onNext={onNext} />;
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

function LockedPanel({ unlockLevel }: { unlockLevel: number }) {
  const stats = useWorkspaceStore((s) => s.stats);
  const setSidebarOpen = useWorkspaceStore((s) => s.setSidebarOpen);
  const xp = stats.xp;
  const xpNeeded = (unlockLevel - 1) * XP_PER_LEVEL;
  const xpPercent = Math.min(100, (xp / xpNeeded) * 100);

  return (
    <section
      aria-label={en.lock.lockedPanelTitle}
      className="flex flex-col items-center gap-5 rounded-md border border-border bg-panel p-8 text-center"
    >
      <Lock className="size-10 text-muted" aria-hidden />
      <div>
        <h2 className="font-mono text-base font-semibold text-text">{en.lock.lockedPanelTitle}</h2>
        <p className="mt-1 text-sm text-muted">
          {en.lock.lockedPanelBody.replace("{level}", String(unlockLevel))}
        </p>
      </div>
      <div className="w-full max-w-xs">
        <div className="mb-1.5 flex justify-between font-mono text-xs text-muted">
          <span>{xp} XP</span>
          <span>{xpNeeded} XP</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={xpNeeded}
          aria-valuenow={xp}
          aria-label={`XP toward Level ${unlockLevel}`}
          className="h-2 w-full overflow-hidden rounded-full border border-border bg-panel-2"
        >
          <div
            className="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-500"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-panel-2 px-4 text-sm text-text transition-colors hover:border-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {en.lock.lockedPanelCta}
      </button>
    </section>
  );
}

function LoadedNotebook({
  challenge,
  meta,
  isDaily,
  onNext,
}: {
  challenge: Challenge;
  meta: ChallengeMeta;
  isDaily?: boolean;
  onNext: () => void;
}) {
  const stats = useWorkspaceStore((s) => s.stats);
  const userLevel = levelForXp(stats.xp);
  // The daily featured challenge bypasses gating (see app-shell + submit_attempt).
  const isLocked = meta.unlockLevel > userLevel && !isDaily;
  const attempt = useWorkspaceStore((s) => getAttempt(s.attempts, challenge.id));
  const selectOption = useWorkspaceStore((s) => s.selectOption);
  const startRun = useWorkspaceStore((s) => s.startRun);
  const completeRun = useWorkspaceStore((s) => s.completeRun);
  const abortRun = useWorkspaceStore((s) => s.abortRun);
  const applyServerOutcome = useWorkspaceStore((s) => s.applyServerOutcome);
  const revealHint = useWorkspaceStore((s) => s.revealHint);
  const openTutorial = useWorkspaceStore((s) => s.openTutorial);
  const isAuthed = useAuthStore((s) => s.status === "signedIn");
  const [runError, setRunError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Learn-first: beginner sectors show a concept card before the notebook.
  const hasConceptCard =
    (challenge.sector === "py" || challenge.sector === "da") && Boolean(challenge.conceptCard);
  const [conceptDismissed, setConceptDismissed] = useState(false);
  useEffect(() => {
    setConceptDismissed(false); // a fresh mission shows its card again
  }, [challenge.id]);
  const showConceptGate = hasConceptCard && !conceptDismissed && !attempt.solved;

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

  const headerBlock = (
    <header className="flex flex-wrap items-center gap-3">
      <ChallengeIcon name={challenge.icon} className="size-5 text-accent" />
      <h1 className="font-mono text-base font-semibold text-text md:text-lg">{challenge.title}</h1>
      <DifficultyBadge difficulty={challenge.difficulty} />
      {challenge.track === "reasoning" && (
        <span
          data-reasoning-badge
          title={en.workspace.reasoningBadge}
          className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent"
        >
          <Brain className="size-3" aria-hidden />
          {en.workspace.reasoningBadge}
        </span>
      )}
      <span className="text-xs text-muted">{en.sectors[challenge.sector]}</span>
    </header>
  );

  // Learn-first gate: in beginner sectors, the concept card comes first.
  if (showConceptGate && challenge.conceptCard) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
        {headerBlock}
        <section
          aria-label={en.workspace.conceptCardHeading}
          className="rounded-md border border-accent/40 bg-panel p-5 motion-safe:animate-[toast-in_0.3s_ease-out_both]"
        >
          <h2 className="mb-3 flex items-center gap-2 font-mono text-sm font-semibold text-accent">
            <GraduationCap className="size-4" aria-hidden />
            {en.workspace.conceptCardHeading}
          </h2>
          <div className="text-sm">
            <Markdown>{challenge.conceptCard}</Markdown>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setConceptDismissed(true)}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-accent px-5 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {en.workspace.conceptCardProceed}
            </button>
            <button
              type="button"
              onClick={() => openTutorial(challenge.id)}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-border bg-panel-2 px-5 text-sm text-muted transition-colors hover:border-accent-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {en.workspace.conceptCardViewLesson}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      {headerBlock}

      <section
        aria-label={en.workspace.briefingAria}
        className="rounded-md border border-border bg-panel p-4 text-sm"
      >
        <Markdown>{challenge.descriptionMd}</Markdown>
      </section>

      {challenge.glossary && challenge.glossary.length > 0 && (
        <GlossaryDisclosure entries={challenge.glossary} />
      )}

      {challenge.figureSvg && challenge.figureCaption && (
        <FigurePanel
          svg={challenge.figureSvg}
          caption={challenge.figureCaption}
          variant="before"
        />
      )}

      <CodeCell
        code={displayedCode}
        language={challenge.language}
        bugRegion={bugRegion}
        title={challenge.title}
        justSolved={attempt.runState === "solved"}
        lineNotes={ranOption ? undefined : challenge.lineNotes}
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

      {isLocked ? (
        <LockedPanel unlockLevel={meta.unlockLevel} />
      ) : (
        <>
          <ControlCell
            challenge={challenge}
            attempt={attempt}
            onSelect={handleSelect}
            onRun={handleRun}
            onHint={() => revealHint(challenge.id)}
            onNext={onNext}
          />
          {attempt.solved && <SolvePanel challenge={challenge} />}
        </>
      )}
    </div>
  );
}
