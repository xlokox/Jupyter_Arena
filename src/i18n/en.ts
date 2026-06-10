/**
 * UI string dictionary — MASTER_BRIEF.md Section 2.6: English-first,
 * internationalization-ready. All user-visible strings live here; components
 * never hardcode copy. A future locale adds a sibling file with the same shape.
 */
export const en = {
  app: {
    name: "Jupyter Arena",
    tagline: "Master debugging through live broken notebooks",
  },
  header: {
    level: "Level",
    xp: "XP",
    streakLabel: "day streak",
    completedLabel: "solved",
    statsAria: "Your progress",
    sectorFilterAria: "Filter challenges by sector",
  },
  ranks: {
    compileRookie: "Compile Rookie",
    tracebackHunter: "Traceback Hunter",
    kernelEngineer: "Kernel Engineer",
    overlordCompiler: "Overlord Compiler",
  },
  sectors: {
    all: "All",
    ml: "Machine Learning",
    dl: "Deep Learning",
    fullstack: "Full Stack",
    db: "Databases",
  },
} as const;

export type Dictionary = typeof en;
