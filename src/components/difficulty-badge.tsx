import type { Difficulty } from "@/lib/content/schema";
import { en } from "@/i18n/en";

const STYLES: Record<Difficulty, string> = {
  easy: "text-success border-success/40 bg-success/10",
  medium: "text-accent border-accent/40 bg-accent/10",
  hard: "text-accent-hover border-accent-hover/40 bg-accent-hover/10",
  very_hard: "text-danger border-danger/40 bg-danger/10",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STYLES[difficulty]}`}
    >
      {en.difficulty[difficulty]}
    </span>
  );
}
