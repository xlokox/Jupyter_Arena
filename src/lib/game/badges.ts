/**
 * Badge evaluation (MASTER_BRIEF Phase 5.6b) — the pure anonymous twin of the
 * SQL `award_badges()` in migration 014. Badges are achievements, never XP:
 * nothing here changes an XP amount. `evaluateBadges` returns the FULL set a
 * player currently qualifies for; callers diff it against the persisted set to
 * find newly-earned ones, mirroring the SQL "insert-where-qualifies / on
 * conflict do nothing" exactly. Keep thresholds in lockstep with 014 — a parity
 * test pins them.
 */
import type { Difficulty, SectorId } from "@/lib/content/schema";

export type BadgeId =
  | "first_blood"
  | "flawless_five"
  | "traceback_hunter"
  | "sector_sweep_ml"
  | "sector_sweep_dl"
  | "sector_sweep_fullstack"
  | "sector_sweep_db"
  | "no_hints_needed"
  | "polyglot"
  | "streak_keeper_3"
  | "streak_keeper_7"
  | "streak_keeper_30"
  | "daily_devoted";

export type BadgeTier = "bronze" | "silver" | "gold";

/**
 * Language families for the Polyglot badge. The catalog has only three
 * (`jsx` and `javascript` are one family), so Polyglot is python + sql +
 * javascript — see PHASE_REPORT_5_6b deviation note.
 */
export type LanguageFamily = "python" | "sql" | "javascript";

export const languageFamily = (language: string): LanguageFamily =>
  language === "sql" ? "sql" : language === "python" ? "python" : "javascript";

export interface SolvedFact {
  sector: SectorId;
  difficulty: Difficulty;
  language: LanguageFamily;
  /** No wrong attempts and ≤1 hint at solve time (mirrors first_try_bonus). */
  flawless: boolean;
  hintsUsed: number;
}

export interface BadgeContext {
  solved: SolvedFact[];
  /** Published catalog size per sector — the Sector Sweep threshold (no magic 15). */
  sectorTotals: Record<SectorId, number>;
  longestStreak: number;
  dailyGoalsCompleted: number;
}

export interface BadgeDef {
  id: BadgeId;
  tier: BadgeTier;
  /** Display order; mirrors badge_definitions.sort. */
  sort: number;
}

/** Ordered to match the badge_definitions seed (011). */
export const BADGE_DEFS: readonly BadgeDef[] = [
  { id: "first_blood", tier: "bronze", sort: 10 },
  { id: "streak_keeper_3", tier: "bronze", sort: 20 },
  { id: "flawless_five", tier: "silver", sort: 30 },
  { id: "no_hints_needed", tier: "silver", sort: 40 },
  { id: "polyglot", tier: "silver", sort: 50 },
  { id: "streak_keeper_7", tier: "silver", sort: 60 },
  { id: "traceback_hunter", tier: "gold", sort: 70 },
  { id: "sector_sweep_ml", tier: "gold", sort: 80 },
  { id: "sector_sweep_dl", tier: "gold", sort: 90 },
  { id: "sector_sweep_fullstack", tier: "gold", sort: 100 },
  { id: "sector_sweep_db", tier: "gold", sort: 110 },
  { id: "streak_keeper_30", tier: "gold", sort: 120 },
  { id: "daily_devoted", tier: "gold", sort: 130 },
] as const;

const SECTOR_SWEEP: Record<SectorId, BadgeId> = {
  ml: "sector_sweep_ml",
  dl: "sector_sweep_dl",
  fullstack: "sector_sweep_fullstack",
  db: "sector_sweep_db",
};

/** The complete set of badges the given aggregate state currently earns. */
export function evaluateBadges(ctx: BadgeContext): Set<BadgeId> {
  const earned = new Set<BadgeId>();
  const solvedCount = ctx.solved.length;

  if (solvedCount >= 1) earned.add("first_blood");
  if (solvedCount >= 25) earned.add("traceback_hunter");

  if (ctx.solved.filter((s) => s.flawless).length >= 5) earned.add("flawless_five");

  for (const sector of Object.keys(SECTOR_SWEEP) as SectorId[]) {
    const total = ctx.sectorTotals[sector] ?? 0;
    const solvedInSector = ctx.solved.filter((s) => s.sector === sector).length;
    if (total > 0 && solvedInSector >= total) earned.add(SECTOR_SWEEP[sector]);
  }

  if (
    ctx.solved.some(
      (s) => (s.difficulty === "hard" || s.difficulty === "very_hard") && s.hintsUsed === 0,
    )
  ) {
    earned.add("no_hints_needed");
  }

  const families = new Set(ctx.solved.map((s) => s.language));
  if (families.has("python") && families.has("sql") && families.has("javascript")) {
    earned.add("polyglot");
  }

  if (ctx.longestStreak >= 3) earned.add("streak_keeper_3");
  if (ctx.longestStreak >= 7) earned.add("streak_keeper_7");
  if (ctx.longestStreak >= 30) earned.add("streak_keeper_30");

  if (ctx.dailyGoalsCompleted >= 10) earned.add("daily_devoted");

  return earned;
}
