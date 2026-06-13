import { LineChart } from "lucide-react";
import { en } from "@/i18n/en";

/**
 * Defense-in-depth gate matching the Zod refinement in schema.ts. A bad string
 * is silently swallowed (renders nothing) rather than thrown, so a single
 * compromised seed can never crash the notebook view.
 */
const SVG_DANGER_RE = /<script\b|javascript:|\son[a-z]+\s*=/i;
function isSafeSvg(svg: string): boolean {
  return (
    /^\s*<svg[\s>]/i.test(svg) && /<\/svg>\s*$/i.test(svg) && !SVG_DANGER_RE.test(svg)
  );
}

interface FigurePanelProps {
  svg: string;
  caption: string;
  /** Distinguishes the pre-solve figure (above briefing) from the post-fix one (output cell). */
  variant?: "before" | "after";
}

export function FigurePanel({ svg, caption, variant = "before" }: FigurePanelProps) {
  if (!isSafeSvg(svg)) return null;
  const tone =
    variant === "before"
      ? "border-accent/40 bg-panel"
      : "border-success/40 bg-success/5";
  const label =
    variant === "before" ? en.workspace.figureBeforeFix : en.workspace.figureAfterFix;
  return (
    <figure
      role="img"
      aria-label={`${caption} — ${label}`}
      className={`rounded-md border ${tone} p-4 motion-safe:animate-[toast-in_0.3s_ease-out_both]`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <LineChart className="size-3.5 text-accent" aria-hidden />
        <span>{label}</span>
      </div>
      <div
        className="figure-svg-host overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption className="mt-2 text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}
