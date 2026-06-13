"use client";

import { useEffect, type RefObject } from "react";

/**
 * Scroll-driven stage controller — Landing V2.
 *
 * A sticky stage exposes its scroll progress (0→1) as a CSS custom property
 * (`--lv2-p` by default) which the choreography CSS keys transform/opacity off
 * of. The hook is imperative on purpose: it writes the property straight to the
 * DOM each animation frame, so a 60fps scrub never triggers a React re-render.
 *
 * It also picks the right MODE for the device and tags the section root with a
 * class the CSS branches on:
 *   (no class)     SSR / no-JS    → the static "initial" frame, fully readable.
 *   .is-scrubbing  desktop+motion → continuous scrub via `--lv2-p`.
 *   .is-step       mobile/coarse  → static solved frame; targets fade in on
 *                                    scroll via IntersectionObserver (never
 *                                    hijacks or locks touch scrolling).
 *   .is-reduced    reduced-motion → static solved frame, no motion.
 *
 * Mode is resolved after mount, so the server-rendered HTML (the initial frame
 * with all copy) is what no-JS visitors keep — the animation is enhancement.
 */

// Desktops & tablets scrub; phones (< 768px) fall to step reveals. The scrub
// never hijacks scrolling (native scroll drives a sticky stage via
// transform/opacity), so it stays touch-native at any width ≥ 768px.
const SCRUB_QUERY = "(min-width: 768px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

export interface ScrollProgressOptions {
  /** Section root — receives the mode class. */
  rootRef: RefObject<HTMLElement | null>;
  /** The tall scroll track (e.g. min-h-[200vh]) that drives progress. */
  trackRef: RefObject<HTMLElement | null>;
  /** The sticky stage — receives the `--lv2-p` custom property. */
  stageRef: RefObject<HTMLElement | null>;
  /** CSS custom property to receive 0→1 progress. */
  progressVar?: string;
  /** Selector (within root) for elements to reveal in mobile step mode. */
  stepSelector?: string;
}

export function useScrollProgress({
  rootRef,
  trackRef,
  stageRef,
  progressVar = "--lv2-p",
  stepSelector,
}: ScrollProgressOptions) {
  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    const reducedMq = window.matchMedia(REDUCED_QUERY);
    const scrubMq = window.matchMedia(SCRUB_QUERY);
    let teardown: (() => void) | undefined;

    const setupScrub = () => {
      root.classList.add("is-scrubbing");
      let frame = 0;
      const update = () => {
        frame = 0;
        const rect = track.getBoundingClientRect();
        const distance = rect.height - window.innerHeight;
        const progress = distance > 0 ? Math.min(Math.max(-rect.top / distance, 0), 1) : 0;
        stage.style.setProperty(progressVar, progress.toFixed(4));
      };
      const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      return () => {
        if (frame) cancelAnimationFrame(frame);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        stage.style.removeProperty(progressVar);
      };
    };

    const setupStep = () => {
      root.classList.add("is-step");
      if (!stepSelector) return undefined;
      const targets = Array.from(root.querySelectorAll(stepSelector));
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("lv2-in");
              observer.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
      );
      targets.forEach((target) => observer.observe(target));
      return () => observer.disconnect();
    };

    const setupReduced = () => {
      root.classList.add("is-reduced");
      return undefined;
    };

    const apply = () => {
      teardown?.();
      root.classList.remove("is-scrubbing", "is-step", "is-reduced");
      stage.style.removeProperty(progressVar);
      if (reducedMq.matches) teardown = setupReduced();
      else if (scrubMq.matches) teardown = setupScrub();
      else teardown = setupStep();
    };

    apply();
    // Re-resolve the mode if the user crosses a breakpoint or flips the OS
    // reduced-motion preference mid-session.
    reducedMq.addEventListener("change", apply);
    scrubMq.addEventListener("change", apply);

    return () => {
      teardown?.();
      root.classList.remove("is-scrubbing", "is-step", "is-reduced");
      reducedMq.removeEventListener("change", apply);
      scrubMq.removeEventListener("change", apply);
    };
  }, [rootRef, trackRef, stageRef, progressVar, stepSelector]);
}
