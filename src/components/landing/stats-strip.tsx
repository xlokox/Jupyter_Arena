import { en } from "@/i18n/en";

const stats = [
  en.landing.statChallenges,
  en.landing.statSectors,
  en.landing.statFree,
] as const;

export function StatsStrip() {
  return (
    <section
      aria-label={en.landing.statsHeading}
      className="border-y border-border bg-panel-2 py-12"
    >
      <div className="mx-auto max-w-5xl px-4">
        <p className="mb-6 text-center font-mono text-xs font-semibold uppercase tracking-widest text-muted">
          {en.landing.statsHeading}
        </p>
        <ul
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-12"
          role="list"
        >
          {stats.map((stat) => (
            <li
              key={stat}
              className="flex items-center gap-2 font-mono text-base font-semibold text-text"
            >
              <span className="size-2 rounded-full bg-accent" aria-hidden />
              {stat}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
