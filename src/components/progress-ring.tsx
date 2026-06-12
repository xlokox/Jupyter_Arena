/**
 * A hand-rolled inline-SVG progress donut — no chart dependency (Section 11
 * bundle budget). Tokens only; the fill animates via a CSS transition on
 * stroke-dashoffset (motion-safe), so reduced-motion users get an instant ring.
 */
interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  /** Stroke utility for the filled arc (default the amber accent). */
  fillClassName?: string;
  ariaLabel: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  max,
  size = 22,
  strokeWidth = 3,
  fillClassName = "stroke-accent",
  ariaLabel,
  className,
  children,
}: ProgressRingProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${fillClassName} motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500`}
        />
      </svg>
      {children != null && (
        <span className="absolute inset-0 flex items-center justify-center">{children}</span>
      )}
    </span>
  );
}
