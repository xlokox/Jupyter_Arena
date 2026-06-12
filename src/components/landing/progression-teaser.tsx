import { Lock, TrendingUp } from "lucide-react";
import { en } from "@/i18n/en";

const RANKS = [
  { key: "compileRookie" as const, levels: "1–5", color: "text-muted" },
  { key: "tracebackHunter" as const, levels: "6–15", color: "text-accent" },
  { key: "kernelEngineer" as const, levels: "16–30", color: "text-success" },
  { key: "overlordCompiler" as const, levels: "31+", color: "text-purple-400" },
];

const UNLOCK_TABLE = [
  { difficulty: "Easy", level: 1, count: 19 },
  { difficulty: "Medium", level: 3, count: 23 },
  { difficulty: "Hard", level: 6, count: 12 },
  { difficulty: "Very Hard", level: 10, count: 6 },
];

export function ProgressionTeaser() {
  return (
    <section
      aria-label={en.landing.progressionHeading}
      className="mx-auto max-w-5xl px-4 py-20 md:py-28"
    >
      <div className="text-center">
        <TrendingUp className="mx-auto mb-4 size-8 text-accent" aria-hidden />
        <h2 className="mb-3 font-mono text-2xl font-bold text-text md:text-3xl">
          {en.landing.progressionHeading}
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-muted">{en.landing.progressionSubhead}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Rank ladder */}
        <div className="rounded-lg border border-border bg-panel p-6">
          <h3 className="mb-5 font-mono text-sm font-semibold uppercase tracking-wide text-muted">
            Rank ladder
          </h3>
          <ol className="space-y-3" role="list">
            {RANKS.map((rank, i) => (
              <li key={rank.key} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-xs text-muted">
                  {i + 1}
                </span>
                <span className={`font-semibold ${rank.color}`}>{en.ranks[rank.key]}</span>
                <span className="ms-auto font-mono text-xs text-muted">Levels {rank.levels}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Unlock table */}
        <div className="rounded-lg border border-border bg-panel p-6">
          <h3 className="mb-5 font-mono text-sm font-semibold uppercase tracking-wide text-muted">
            Content unlock curve
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-start font-medium text-muted">
                  {en.landing.unlockTableDiff}
                </th>
                <th className="pb-2 text-start font-medium text-muted">
                  {en.landing.unlockTableUnlocks}
                </th>
                <th className="pb-2 text-end font-medium text-muted">Challenges</th>
              </tr>
            </thead>
            <tbody>
              {UNLOCK_TABLE.map((row) => (
                <tr key={row.difficulty} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 text-text">{row.difficulty}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 font-mono text-accent">
                      {row.level === 1 ? (
                        <span className="text-success">Open</span>
                      ) : (
                        <>
                          <Lock className="size-3" aria-hidden />
                          Level {row.level}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 text-end font-mono text-muted">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
