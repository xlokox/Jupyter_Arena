"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, CheckCircle2, Flame } from "lucide-react";
import { en } from "@/i18n/en";
import { useScrollProgress } from "@/lib/use-scroll-progress";

const win = (start: number, span: number, extra?: Record<string, string | number>): CSSProperties =>
  ({ "--start": start, "--span": span, ...extra }) as CSSProperties;

/** One line of the demo cell: gutter + monospace content. */
function CodeRow({ n, children, className = "" }: { n: number; children: ReactNode; className?: string }) {
  return (
    <div className={`flex ${className}`}>
      <span className="w-7 shrink-0 select-none pe-2 text-end text-xs text-muted">{n}</span>
      <span className="flex-1 whitespace-pre">{children}</span>
    </div>
  );
}

const SECTORS = [
  en.sectors.py,
  en.sectors.da,
  en.sectors.ml,
  en.sectors.dl,
  en.sectors.fullstack,
  en.sectors.db,
] as const;

/**
 * Hero V2 — a pinned stage (~200vh of scroll) whose progress debugs a notebook
 * cell and assembles the game HUD around it. The visitor's scroll is the play
 * head. All copy is server-rendered (readable with no JS); the scrub is
 * progressive enhancement driven by the useScrollProgress hook.
 */
export function HeroV2() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useScrollProgress({
    rootRef,
    trackRef,
    stageRef,
    stepSelector: ".lv2-in-up, .lv2-in-x",
  });

  const v2 = en.landing.heroV2;

  return (
    <section ref={rootRef} aria-labelledby="hero-title" className="border-b border-border">
      <div ref={trackRef} className="lv2-track" style={{ "--track-h": "200vh" } as CSSProperties}>
        <div ref={stageRef} className="lv2-stage">
          <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center gap-12 px-4 py-20 md:grid md:grid-cols-2 md:items-center md:gap-10">
            {/* ── Copy (always rendered, the LCP) ─────────────────────────── */}
            <div className="max-w-xl">
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {v2.eyebrow}
              </p>
              <h1
                id="hero-title"
                className="text-balance font-mono text-4xl font-bold leading-[1.08] tracking-tight text-text md:text-5xl lg:text-6xl"
              >
                {v2.headline}
              </h1>
              <p className="mt-5 max-w-md leading-relaxed text-muted md:text-lg">{v2.subheadline}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/app"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-accent px-6 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {v2.primaryCta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <a
                  href="#why"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-border px-6 text-sm text-muted transition-colors hover:border-accent/60 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {v2.secondaryCta}
                  <ArrowDown className="size-4" aria-hidden />
                </a>
              </div>
              <p className="mt-4 text-sm text-muted">
                {en.landing.beginnerCuePrefix}{" "}
                <Link
                  href="/app"
                  className="text-accent underline underline-offset-2 transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {en.landing.beginnerCueLink}
                </Link>{" "}
                {en.landing.beginnerCueSuffix}
              </p>
            </div>

            {/* ── Stage: the notebook that debugs itself + the HUD ────────── */}
            <div aria-hidden className="relative">
              {/* floating reward */}
              <div
                className="lv2-in-up pointer-events-none absolute -top-3 end-4 z-10 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 font-mono text-xs font-semibold text-success"
                style={win(0.5, 0.1, { "--rise": "30px" })}
              >
                {v2.xpChip}
              </div>

              {/* notebook card */}
              <div className="overflow-hidden rounded-xl border border-border bg-panel font-mono text-sm shadow-2xl shadow-black/40">
                {/* cell header */}
                <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                  <span className="text-xs text-muted">In&nbsp;[1]:</span>
                  <span className="text-xs text-muted">{v2.cellTab}</span>
                  <span className="ms-auto grid">
                    <span
                      className="lv2-out col-start-1 row-start-1 rounded bg-danger/20 px-1.5 py-0.5 text-xs font-medium text-danger"
                      style={win(0.4, 0.08)}
                    >
                      ✗ {v2.statusError}
                    </span>
                    <span
                      className="lv2-in-up col-start-1 row-start-1 rounded bg-success/20 px-1.5 py-0.5 text-xs font-medium text-success"
                      style={win(0.5, 0.08, { "--rise": "0px" })}
                    >
                      ✓ {v2.statusFixed}
                    </span>
                  </span>
                </div>

                {/* code */}
                <div className="bg-code-bg px-4 py-3 text-[13px] leading-6">
                  <CodeRow n={1}>
                    <span className="text-text">prices </span>
                    <span className="text-muted">= </span>
                    <span className="text-text">[</span>
                    <span className="text-syntax-number">19.99</span>
                    <span className="text-muted">, </span>
                    <span className="text-syntax-number">4.50</span>
                    <span className="text-muted">, </span>
                    <span className="text-syntax-number">12.00</span>
                    <span className="text-text">]</span>
                  </CodeRow>
                  <CodeRow n={2}>
                    <span className="text-text">total </span>
                    <span className="text-muted">= </span>
                    <span className="text-syntax-function">sum</span>
                    <span className="text-text">(prices)</span>
                  </CodeRow>
                  {/* line 3 — the fix swaps in place */}
                  <div className="grid">
                    <div
                      className="lv2-out col-start-1 row-start-1 flex border-s-2 border-accent bg-accent/10"
                      style={win(0.34, 0.08)}
                    >
                      <span className="w-7 shrink-0 select-none pe-2 text-end text-xs text-muted">3</span>
                      <span className="flex-1 whitespace-pre">
                        <span className="text-text">avg </span>
                        <span className="text-muted">= </span>
                        <span className="text-text">total </span>
                        <span className="text-muted">/ </span>
                        <span className="text-syntax-function">len</span>
                        <span className="text-text">(</span>
                        <span className="text-danger underline decoration-danger/60 decoration-wavy underline-offset-4">
                          price
                        </span>
                        <span className="text-text">)</span>
                      </span>
                    </div>
                    <div
                      className="lv2-in-up col-start-1 row-start-1 flex border-s-2 border-success/50"
                      style={win(0.4, 0.1, { "--rise": "0px" })}
                    >
                      <span className="w-7 shrink-0 select-none pe-2 text-end text-xs text-muted">3</span>
                      <span className="flex-1 whitespace-pre">
                        <span className="text-text">avg </span>
                        <span className="text-muted">= </span>
                        <span className="text-text">total </span>
                        <span className="text-muted">/ </span>
                        <span className="text-syntax-function">len</span>
                        <span className="text-text">(</span>
                        <span className="text-syntax-string">prices</span>
                        <span className="text-text">)</span>
                      </span>
                    </div>
                  </div>
                  <CodeRow n={4}>
                    <span className="text-syntax-function">print</span>
                    <span className="text-text">(</span>
                    <span className="text-syntax-string">f&quot;Average: ${"{"}avg:.2f{"}"}&quot;</span>
                    <span className="text-text">)</span>
                  </CodeRow>
                </div>

                {/* output — traceback collapses, success slides in */}
                <div className="grid min-h-[92px] border-t border-border px-4 py-3">
                  <pre
                    data-testid="hero-traceback"
                    className="col-start-1 row-start-1 whitespace-pre-wrap text-xs leading-5 text-danger"
                  >
                    <span className="lv2-out block" style={win(0.02, 0.1)}>
                      Traceback (most recent call last):
                    </span>
                    <span className="lv2-out block" style={win(0.09, 0.1)}>
                      {"  "}File &quot;report.py&quot;, line 3, in &lt;module&gt;
                    </span>
                    <span className="lv2-out block" style={win(0.16, 0.1)}>
                      {"    "}avg = total / len(price)
                    </span>
                    <span className="lv2-out block font-semibold" style={win(0.23, 0.1)}>
                      NameError: name &apos;price&apos; is not defined
                    </span>
                  </pre>
                  <pre
                    data-testid="hero-success"
                    className="lv2-in-up col-start-1 row-start-1 whitespace-pre-wrap text-xs leading-5 text-success"
                    style={win(0.46, 0.12, { "--rise": "8px" })}
                  >
                    {`Average: $12.16\n✓ all 3 prices counted\n→ fix verified — prices now resolves`}
                  </pre>
                </div>
              </div>

              {/* ── Game HUD assembles around the cell ─────────────────────── */}
              <div
                data-testid="hero-hud"
                className="lv2-in-up mt-4 rounded-xl border border-border bg-panel px-3 py-3"
                style={win(0.62, 0.08)}
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span
                    className="lv2-in-up rounded-md border border-border bg-panel-2 px-2 py-0.5 font-mono text-xs text-accent"
                    style={win(0.66, 0.07)}
                  >
                    {v2.hudLevel}
                  </span>
                  <span className="lv2-in-up font-mono text-xs text-muted" style={win(0.7, 0.07)}>
                    {v2.hudRank}
                  </span>
                  <div className="lv2-in-up flex items-center gap-2" style={win(0.72, 0.08)}>
                    <div className="h-2 w-24 overflow-hidden rounded-full border border-border bg-panel-2">
                      <div className="lv2-xpfill h-full rounded-full bg-accent" />
                    </div>
                    <span className="font-mono text-[10px] text-muted">{v2.hudXpLabel}</span>
                  </div>
                  <div className="lv2-in-up flex items-center gap-1.5" style={win(0.8, 0.07)}>
                    <Flame className="size-4 text-accent" aria-hidden />
                    <span className="font-mono text-[10px] text-muted">{v2.hudStreak}</span>
                  </div>
                  <div className="lv2-in-up flex items-center gap-1.5" style={win(0.82, 0.07)}>
                    <CheckCircle2 className="size-4 text-muted" aria-hidden />
                    <span className="font-mono text-[10px] text-muted">1 solved</span>
                  </div>
                </div>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {SECTORS.map((label, i) => (
                    <li
                      key={label}
                      className="lv2-in-x rounded-full border border-border bg-panel-2 px-2 py-0.5 font-mono text-[10px] text-muted"
                      style={win(0.82 + i * 0.02, 0.08, { "--shift": "16px" })}
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* scroll cue */}
            <div
              aria-hidden
              className="lv2-out pointer-events-none absolute inset-x-0 bottom-6 hidden flex-col items-center gap-1 text-muted md:flex"
              style={win(0, 0.08)}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{v2.scrollCue}</span>
              <ArrowDown className="size-4 motion-safe:animate-[lv2-cue_1.8s_ease-in-out_infinite]" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
