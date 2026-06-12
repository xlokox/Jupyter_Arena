/**
 * Tiny Web-Audio cue engine — Phase 5.6a. Zero assets, zero dependencies:
 * every sound is synthesized from OscillatorNode + GainNode envelopes, so it
 * adds no bundle weight beyond this file.
 *
 * Non-Negotiables honored:
 *  - Opt-in: callers gate on the store's `soundEnabled` flag (off by default).
 *  - Never autoplay: the AudioContext is created lazily on the FIRST call,
 *    which only happens after a user gesture (the sound toggle, then runs).
 *  - SSR-safe: nothing touches `window`/`AudioContext` at module load.
 */

type Ctor = typeof AudioContext;

let ctx: AudioContext | null = null;

/** Lazily resolve (and resume) a single shared AudioContext, or null if unsupported. */
function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Impl: Ctor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!Impl) return null;
  if (!ctx) {
    try {
      ctx = new Impl();
    } catch {
      return null;
    }
  }
  // Browsers start the context "suspended" until a gesture; resume on demand.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Note {
  /** Frequency in Hz. */
  freq: number;
  /** Start offset from "now", in seconds. */
  at: number;
  /** Duration in seconds. */
  dur: number;
  type?: OscillatorType;
  /** Peak gain (kept low — these are subtle UI cues, not alarms). */
  peak?: number;
}

function play(notes: Note[]): void {
  const context = audioContext();
  if (!context) return;
  const now = context.currentTime;
  for (const note of notes) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = note.type ?? "sine";
    osc.frequency.value = note.freq;

    const start = now + note.at;
    const end = start + note.dur;
    const peak = note.peak ?? 0.12;
    // Short attack, smooth exponential release — no clicks, no harshness.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain).connect(context.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

/** Bright rising two-note — a satisfying "landed it". */
export function playCorrect(): void {
  play([
    { freq: 659.25, at: 0, dur: 0.12 }, // E5
    { freq: 987.77, at: 0.09, dur: 0.16 }, // B5
  ]);
}

/** Soft low blip — mastery framing, deliberately gentle (not a buzzer). */
export function playWrong(): void {
  play([{ freq: 196.0, at: 0, dur: 0.18, type: "triangle", peak: 0.09 }]);
}

/** Three-note rising arpeggio — the level-up celebratory beat. */
export function playLevelUp(): void {
  play([
    { freq: 659.25, at: 0, dur: 0.12 }, // E5
    { freq: 880.0, at: 0.1, dur: 0.12 }, // A5
    { freq: 1318.51, at: 0.2, dur: 0.22 }, // E6
  ]);
}

/** Bright shimmer pair — badge earned (used in 5.6b). */
export function playBadge(): void {
  play([
    { freq: 880.0, at: 0, dur: 0.1 }, // A5
    { freq: 1760.0, at: 0.08, dur: 0.2, peak: 0.1 }, // A6
  ]);
}
