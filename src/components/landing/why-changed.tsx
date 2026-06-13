"use client";

import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { en } from "@/i18n/en";
import { useScrollProgress } from "@/lib/use-scroll-progress";
import { DevRobotScene } from "@/components/landing/dev-robot-scene";

const beatWin = (
  inStart: number,
  outStart: number | null,
): CSSProperties =>
  ({
    "--in-start": inStart,
    "--in-span": 0.06,
    "--out-start": outStart ?? 2,
    "--out-span": 0.06,
  }) as CSSProperties;

/**
 * "Programming changed forever" — a pinned stage (~300vh) telling the thesis in
 * three beats (THEN → NOW → AUGMENTED) as the visitor scrolls, with the dev +
 * robot scene animating alongside. Qualitative narrative only — no fabricated
 * statistics. Baseline / reduced-motion / mobile render the three beats as
 * stacked static panels with the same copy (full content parity).
 */
export function WhyChanged() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useScrollProgress({
    rootRef,
    trackRef,
    stageRef,
    stepSelector: ".lv2-beat",
  });

  const s = en.landing.story;
  const beats = [
    { label: s.beat1Label, copy: s.beat1, style: beatWin(0, 0.34) },
    { label: s.beat2Label, copy: s.beat2, style: beatWin(0.3, 0.64) },
    { label: s.beat3Label, copy: s.beat3, style: beatWin(0.6, null), cta: true },
  ];

  return (
    <section
      ref={rootRef}
      id="why"
      aria-labelledby="why-title"
      className="scroll-mt-20 border-b border-border"
    >
      <div ref={trackRef} className="lv2-track" style={{ "--track-h": "300vh" } as CSSProperties}>
        <div ref={stageRef} className="lv2-stage">
          <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-4 py-20">
            <div className="mb-10 max-w-2xl">
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {s.eyebrow}
              </p>
              <h2
                id="why-title"
                className="text-balance font-mono text-3xl font-bold leading-tight tracking-tight text-text md:text-4xl"
              >
                {s.heading}
              </h2>
            </div>

            <div className="grid items-center gap-10 md:grid-cols-2">
              {/* Scene */}
              <figure
                aria-label={s.sceneAria}
                role="img"
                className="order-1 flex justify-center md:justify-start"
              >
                <DevRobotScene />
              </figure>

              {/* Beats — overlapped & crossfaded when scrubbing, stacked otherwise */}
              <div className="relative order-2 min-h-[240px] md:min-h-[300px]">
                {beats.map((beat) => (
                  <article
                    key={beat.label}
                    className="lv2-beat flex flex-col gap-4 md:py-6"
                    style={beat.style}
                  >
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {beat.label}
                    </p>
                    <p className="text-balance text-xl leading-relaxed text-text md:text-2xl">
                      {beat.copy}
                    </p>
                    {beat.cta && (
                      <div>
                        <Link
                          href="/app"
                          className="mt-2 inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-accent px-6 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          {s.cta}
                          <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
