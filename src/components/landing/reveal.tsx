"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper for landing sections — Phase 5.6a.
 *
 * SEO + no-JS safe: renders fully visible by default (the content is in the
 * SSR HTML and stays visible if JS never runs). Only AFTER mount, and only for
 * sections not already on screen, does it hide-then-reveal on scroll. Sections
 * already in view on load are left untouched (no hydration flash). All motion
 * is motion-safe, so `prefers-reduced-motion` users get the static content.
 */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen at load → keep visible, no flash, no animation.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    setShown(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}
