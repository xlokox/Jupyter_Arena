"use client";

import { RotateCcw, TerminalSquare } from "lucide-react";
import { en } from "@/i18n/en";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <TerminalSquare className="size-12 text-danger" aria-hidden />
      <h1 className="text-xl font-bold text-text">{en.errors.boundaryTitle}</h1>
      <p className="max-w-md text-sm text-muted">{en.errors.boundaryBody}</p>
      <button
        type="button"
        onClick={reset}
        className="flex min-h-[44px] items-center gap-2 rounded-md bg-accent px-5 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <RotateCcw className="size-4" aria-hidden />
        {en.errors.tryAgain}
      </button>
    </main>
  );
}
