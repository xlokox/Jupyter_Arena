"use client";

import { useEffect, useState } from "react";

/**
 * Animated notebook cell: red traceback → green pass, subtle 4s loop.
 * Frozen on the red state when prefers-reduced-motion is active.
 */
export function HeroCell() {
  const [phase, setPhase] = useState<"error" | "running" | "success">("error");
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReduced) {
      setPhase("error");
      return;
    }
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;

    function cycle() {
      setPhase("error");
      t1 = setTimeout(() => setPhase("running"), 1800);
      t2 = setTimeout(() => setPhase("success"), 2800);
      t3 = setTimeout(cycle, 4600);
    }
    cycle();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [prefersReduced]);

  const isError = phase === "error";
  const isRunning = phase === "running";
  const isSuccess = phase === "success";

  return (
    <div
      aria-hidden
      className="w-full max-w-xl rounded-lg border border-border bg-panel font-mono text-sm shadow-xl shadow-black/40"
    >
      {/* Cell header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="text-xs text-muted">In&nbsp;[1]:</span>
        <span className="text-xs text-muted">01_kmeans_customer_segmentation.ipynb</span>
        <span
          className={`ms-auto rounded px-1.5 py-0.5 text-xs font-medium transition-colors duration-300 ${
            isRunning
              ? "bg-accent/20 text-accent"
              : isSuccess
                ? "bg-success/20 text-success"
                : "bg-danger/20 text-danger"
          }`}
        >
          {isRunning ? "● running" : isSuccess ? "✓ passed" : "✗ error"}
        </span>
      </div>

      {/* Code */}
      <div className="bg-code-bg px-4 py-3">
        <div className="relative">
          <div className="absolute inset-0 rounded border-s-2 border-danger/60 bg-danger/5" />
          <pre className="relative whitespace-pre-wrap text-xs leading-relaxed">
            <span className="text-keyword">from</span>{" "}
            <span className="text-string">sklearn.cluster</span>{" "}
            <span className="text-keyword">import</span> KMeans{"\n"}
            <span className="text-comment"># Bug: raw income dominates distance</span>
            {"\n"}
            <span className="text-function">kmeans</span> ={" "}
            <span className="text-function">KMeans</span>(n_clusters=
            <span className="text-number">4</span>){"\n"}
            kmeans.
            <span className="text-function">fit</span>(X_raw){"\n"}
          </pre>
        </div>
      </div>

      {/* Output */}
      <div className="min-h-[80px] px-4 py-3 transition-all duration-500">
        {isRunning && (
          <p className="text-xs text-muted">
            <span className="animate-pulse">▶ Executing cell…</span>
          </p>
        )}
        {isError && !isRunning && (
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-danger">
            {`AssertionError: Segments do not separate on age
  Expected spread > 20 years
  Actual spread: 1.5 years
→ income scale dominates clustering distance`}
          </pre>
        )}
        {isSuccess && (
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-success">
            {`✓ age spread across segments: 35.8 years
✓ income spread across segments: 28.4k
✓ Silhouette score: 0.71
→ Fix verified — StandardScaler normalises both axes`}
          </pre>
        )}
      </div>
    </div>
  );
}
