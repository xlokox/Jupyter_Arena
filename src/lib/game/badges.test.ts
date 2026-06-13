import { describe, expect, it } from "vitest";
import type { SectorId } from "@/lib/content/schema";
import {
  BADGE_DEFS,
  evaluateBadges,
  languageFamily,
  type BadgeContext,
  type LanguageFamily,
  type SolvedFact,
} from "./badges";

const FULL_TOTALS: Record<SectorId, number> = {
  py: 15,
  da: 15,
  ml: 15,
  dl: 15,
  fullstack: 15,
  db: 15,
};

const solved = (overrides: Partial<SolvedFact> = {}): SolvedFact => ({
  sector: "ml",
  difficulty: "easy",
  language: "python",
  flawless: false,
  hintsUsed: 1,
  ...overrides,
});

const ctx = (overrides: Partial<BadgeContext> = {}): BadgeContext => ({
  solved: [],
  sectorTotals: FULL_TOTALS,
  longestStreak: 0,
  dailyGoalsCompleted: 0,
  ...overrides,
});

const many = (n: number, make: (i: number) => SolvedFact): SolvedFact[] =>
  Array.from({ length: n }, (_, i) => make(i));

describe("languageFamily", () => {
  it("folds jsx and javascript into one family; keeps python and sql distinct", () => {
    expect(languageFamily("python")).toBe("python");
    expect(languageFamily("sql")).toBe("sql");
    expect(languageFamily("jsx")).toBe("javascript");
    expect(languageFamily("javascript")).toBe("javascript");
  });
});

describe("evaluateBadges thresholds", () => {
  it("first_blood needs ≥1 solve", () => {
    expect(evaluateBadges(ctx({ solved: [] })).has("first_blood")).toBe(false);
    expect(evaluateBadges(ctx({ solved: [solved()] })).has("first_blood")).toBe(true);
  });

  it("traceback_hunter needs ≥25 solves", () => {
    expect(evaluateBadges(ctx({ solved: many(24, () => solved()) })).has("traceback_hunter")).toBe(
      false,
    );
    expect(evaluateBadges(ctx({ solved: many(25, () => solved()) })).has("traceback_hunter")).toBe(
      true,
    );
  });

  it("flawless_five needs ≥5 flawless solves", () => {
    const four = many(4, () => solved({ flawless: true })).concat(many(3, () => solved()));
    expect(evaluateBadges(ctx({ solved: four })).has("flawless_five")).toBe(false);
    const five = many(5, () => solved({ flawless: true }));
    expect(evaluateBadges(ctx({ solved: five })).has("flawless_five")).toBe(true);
  });

  it("sector_sweep needs every published challenge in the sector", () => {
    const fourteen = many(14, () => solved({ sector: "db" }));
    expect(evaluateBadges(ctx({ solved: fourteen })).has("sector_sweep_db")).toBe(false);
    const fifteen = many(15, () => solved({ sector: "db" }));
    expect(evaluateBadges(ctx({ solved: fifteen })).has("sector_sweep_db")).toBe(true);
  });

  it("sector_sweep threshold is derived from sectorTotals, not a magic 15", () => {
    const totals = { ...FULL_TOTALS, ml: 3 };
    const three = many(3, () => solved({ sector: "ml" }));
    expect(evaluateBadges(ctx({ solved: three, sectorTotals: totals })).has("sector_sweep_ml")).toBe(
      true,
    );
  });

  it("no_hints_needed needs a hard|very_hard solved with 0 hints", () => {
    expect(
      evaluateBadges(ctx({ solved: [solved({ difficulty: "hard", hintsUsed: 1 })] })).has(
        "no_hints_needed",
      ),
    ).toBe(false);
    expect(
      evaluateBadges(ctx({ solved: [solved({ difficulty: "easy", hintsUsed: 0 })] })).has(
        "no_hints_needed",
      ),
    ).toBe(false);
    expect(
      evaluateBadges(ctx({ solved: [solved({ difficulty: "very_hard", hintsUsed: 0 })] })).has(
        "no_hints_needed",
      ),
    ).toBe(true);
  });

  it("polyglot needs python + sql + javascript (jsx counts as javascript)", () => {
    const twoFamilies: LanguageFamily[] = ["python", "sql"];
    expect(
      evaluateBadges(
        ctx({ solved: twoFamilies.map((language) => solved({ language })) }),
      ).has("polyglot"),
    ).toBe(false);
    const threeFamilies: LanguageFamily[] = ["python", "sql", "javascript"];
    expect(
      evaluateBadges(
        ctx({ solved: threeFamilies.map((language) => solved({ language })) }),
      ).has("polyglot"),
    ).toBe(true);
  });

  it("streak_keeper tiers fire at 3 / 7 / 30", () => {
    expect([...evaluateBadges(ctx({ longestStreak: 2 }))]).not.toContain("streak_keeper_3");
    expect([...evaluateBadges(ctx({ longestStreak: 3 }))]).toContain("streak_keeper_3");
    const seven = evaluateBadges(ctx({ longestStreak: 7 }));
    expect(seven.has("streak_keeper_3") && seven.has("streak_keeper_7")).toBe(true);
    expect(seven.has("streak_keeper_30")).toBe(false);
    expect(evaluateBadges(ctx({ longestStreak: 30 })).has("streak_keeper_30")).toBe(true);
  });

  it("daily_devoted needs ≥10 completed daily goals", () => {
    expect(evaluateBadges(ctx({ dailyGoalsCompleted: 9 })).has("daily_devoted")).toBe(false);
    expect(evaluateBadges(ctx({ dailyGoalsCompleted: 10 })).has("daily_devoted")).toBe(true);
  });
});

describe("evaluateBadges shape", () => {
  it("is idempotent — re-evaluating the same context yields the same set", () => {
    const context = ctx({ solved: many(25, () => solved({ flawless: true })), longestStreak: 7 });
    const a = [...evaluateBadges(context)].sort();
    const b = [...evaluateBadges(context)].sort();
    expect(a).toEqual(b);
  });

  it("only returns ids present in BADGE_DEFS", () => {
    const known = new Set(BADGE_DEFS.map((d) => d.id));
    const everything = ctx({
      solved: [
        ...many(15, () => solved({ sector: "ml", flawless: true })),
        ...many(15, () => solved({ sector: "dl" })),
        ...many(15, () => solved({ sector: "fullstack", language: "javascript" })),
        ...many(15, () => solved({ sector: "db", language: "sql", difficulty: "hard", hintsUsed: 0 })),
      ],
      longestStreak: 30,
      dailyGoalsCompleted: 10,
    });
    for (const id of evaluateBadges(everything)) expect(known.has(id)).toBe(true);
  });

  it("BADGE_DEFS is sorted by ascending sort", () => {
    const sorts = BADGE_DEFS.map((d) => d.sort);
    expect(sorts).toEqual([...sorts].sort((x, y) => x - y));
  });
});
