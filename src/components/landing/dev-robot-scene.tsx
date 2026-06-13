import type { CSSProperties } from "react";

/** Inline CSS-custom-property helper (unitless values stay unitless). */
const win = (
  start: number,
  span: number,
  extra?: Record<string, string | number>,
): CSSProperties => ({ "--start": start, "--span": span, ...extra }) as CSSProperties;

/**
 * Original geometric line-art — a developer at a desk and an AI robot, drawn
 * in the Section 8 token palette (amber accent, zinc strokes). The scene is
 * one SVG with layered groups; the choreography CSS animates them per beat
 * (THEN → NOW → AUGMENTED). Decorative: aria-hidden, meaning lives in the copy.
 */
export function DevRobotScene() {
  return (
    <svg
      viewBox="0 0 640 380"
      aria-hidden
      className="h-auto w-full max-w-2xl"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Team halo — warms as the two end side by side. */}
      <g className="lv2-svg-glow">
        <ellipse cx="116" cy="216" rx="104" ry="120" className="fill-accent" fillOpacity="0.05" />
        <ellipse cx="518" cy="224" rx="108" ry="124" className="fill-accent" fillOpacity="0.05" />
      </g>

      {/* Desk */}
      <line x1="24" y1="312" x2="616" y2="312" className="stroke-border" strokeWidth="2" />

      {/* ── Developer (leans toward the code in the AUGMENTED beat) ───────── */}
      <g className="lv2-svg-lean">
        {/* head */}
        <circle cx="96" cy="206" r="18" className="fill-code-bg stroke-text" strokeWidth="2" />
        {/* torso */}
        <path
          d="M70 304 Q72 252 96 250 Q120 252 122 304 Z"
          className="fill-panel stroke-muted"
          strokeWidth="2"
        />
        {/* arm reaching for the keyboard */}
        <path d="M114 262 L168 292" className="stroke-text" strokeWidth="2.5" />
        {/* chair back */}
        <path d="M58 300 L58 244" className="stroke-border" strokeWidth="3" />
      </g>

      {/* keyboard */}
      <rect x="156" y="288" width="60" height="11" rx="3" className="fill-panel-2 stroke-border" strokeWidth="1.5" />

      {/* monitor */}
      <g>
        <line x1="231" y1="250" x2="231" y2="288" className="stroke-border" strokeWidth="3" />
        <line x1="206" y1="290" x2="256" y2="290" className="stroke-border" strokeWidth="3" />
        <rect x="150" y="146" width="162" height="104" rx="8" className="fill-panel stroke-border" strokeWidth="2" />
        {/* hand-typed code lines — appear slowly, one by one (THEN beat) */}
        <rect x="166" y="166" width="66" height="7" rx="2.5" className="fill-accent lv2-svg-fade" style={win(0.02, 0.08)} />
        <rect x="166" y="181" width="104" height="7" rx="2.5" className="fill-muted lv2-svg-fade" style={win(0.1, 0.08)} />
        <rect x="166" y="196" width="80" height="7" rx="2.5" className="fill-muted lv2-svg-fade" style={win(0.18, 0.08)} />
        <rect x="166" y="211" width="112" height="7" rx="2.5" className="fill-muted lv2-svg-fade" style={win(0.26, 0.08)} />
        <rect x="166" y="226" width="58" height="7" rx="2.5" className="fill-muted lv2-svg-fade" style={win(0.32, 0.08)} />
      </g>

      {/* ── AI robot — slides in from the right in the NOW beat ───────────── */}
      <g className="lv2-svg-x" style={win(0.3, 0.16, { "--shift": "90px" })}>
        {/* body */}
        <rect x="470" y="208" width="96" height="92" rx="14" className="fill-panel-2 stroke-muted" strokeWidth="2" />
        {/* head */}
        <rect x="486" y="148" width="64" height="58" rx="16" className="fill-panel stroke-accent" strokeWidth="2" />
        {/* eyes */}
        <circle cx="504" cy="176" r="6" className="fill-accent" />
        <circle cx="532" cy="176" r="6" className="fill-accent" />
        {/* mouth grille */}
        <line x1="504" y1="192" x2="532" y2="192" className="stroke-accent" strokeWidth="2" />
        {/* antenna */}
        <line x1="518" y1="148" x2="518" y2="132" className="stroke-muted" strokeWidth="2" />
        <circle cx="518" cy="128" r="4" className="fill-accent" />
        {/* arm, gesturing the stream toward the developer */}
        <path d="M470 244 L432 252" className="stroke-muted" strokeWidth="2.5" />
      </g>

      {/* ── Streamed code blocks — fast, between robot and developer ──────── */}
      <rect x="402" y="242" width="40" height="18" rx="4" className="fill-success/10 stroke-success/60 lv2-svg-fade" strokeWidth="1.5" style={win(0.34, 0.06)} />
      <rect x="360" y="230" width="44" height="18" rx="4" className="fill-success/10 stroke-success/60 lv2-svg-fade" strokeWidth="1.5" style={win(0.4, 0.06)} />
      <rect x="316" y="248" width="40" height="18" rx="4" className="fill-success/10 stroke-success/60 lv2-svg-fade" strokeWidth="1.5" style={win(0.46, 0.06)} />
      <rect x="300" y="226" width="42" height="18" rx="4" className="fill-success/10 stroke-success/60 lv2-svg-fade" strokeWidth="1.5" style={win(0.5, 0.06)} />

      {/* The block that ships broken (NOW) → flips green when read (AUGMENTED). */}
      <rect
        x="344"
        y="268"
        width="48"
        height="22"
        rx="4"
        className="fill-danger/15 stroke-danger lv2-svg-show2 motion-safe:animate-[lv2-block-pulse_1.4s_ease-in-out_infinite]"
        strokeWidth="2"
      />
      <rect
        x="344"
        y="268"
        width="48"
        height="22"
        rx="4"
        className="fill-success/15 stroke-success lv2-svg-in3"
        strokeWidth="2"
      />

      {/* Magnifier sweep — finds the defect, transient. */}
      <g className="lv2-svg-mag">
        <circle cx="368" cy="278" r="19" className="stroke-text" strokeWidth="2.5" />
        <line x1="382" y1="292" x2="398" y2="308" className="stroke-text" strokeWidth="4" />
      </g>
    </svg>
  );
}
