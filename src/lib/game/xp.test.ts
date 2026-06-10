import { describe, expect, it } from "vitest";
import { dailyChallengeId } from "./daily";
import {
  accuracy,
  applyCorrectSolve,
  applyWrongAttempt,
  displayStreak,
  INITIAL_STATS,
  levelForXp,
  rankForLevel,
  utcDayOf,
  xpIntoLevel,
  type GameStats,
} from "./xp";

/** Section 9 math — every event, boundary, floor, and idempotency case. */

const at = (day: string) => new Date(`${day}T12:00:00Z`);
const stats = (overrides: Partial<GameStats>): GameStats => ({ ...INITIAL_STATS, ...overrides });
const freshSolve = { alreadySolved: false, wrongAttempts: 0, hintsUsed: 0 };

describe("levels and ranks", () => {
  it("level = floor(xp/50) + 1 at the boundaries", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(49)).toBe(1);
    expect(levelForXp(50)).toBe(2);
    expect(levelForXp(99)).toBe(2);
    expect(levelForXp(100)).toBe(3);
    expect(levelForXp(1500)).toBe(31);
  });

  it("xpIntoLevel is the remainder within the current level", () => {
    expect(xpIntoLevel(0)).toBe(0);
    expect(xpIntoLevel(49)).toBe(49);
    expect(xpIntoLevel(50)).toBe(0);
    expect(xpIntoLevel(64)).toBe(14);
  });

  it("rank tiers match the locked ladder exactly", () => {
    expect(rankForLevel(1)).toBe("compileRookie");
    expect(rankForLevel(5)).toBe("compileRookie");
    expect(rankForLevel(6)).toBe("tracebackHunter");
    expect(rankForLevel(15)).toBe("tracebackHunter");
    expect(rankForLevel(16)).toBe("kernelEngineer");
    expect(rankForLevel(30)).toBe("kernelEngineer");
    expect(rankForLevel(31)).toBe("overlordCompiler");
    expect(rankForLevel(99)).toBe("overlordCompiler");
  });
});

describe("wrong attempts", () => {
  it("subtracts 5 XP and counts the attempt", () => {
    const result = applyWrongAttempt(stats({ xp: 20, totalAttempts: 3, correctAttempts: 2 }));
    expect(result.stats.xp).toBe(15);
    expect(result.stats.totalAttempts).toBe(4);
    expect(result.stats.correctAttempts).toBe(2);
    expect(result.events).toEqual([{ reason: "wrong_fix", delta: -5 }]);
  });

  it("floors XP at 0 when the balance is below 5", () => {
    const result = applyWrongAttempt(stats({ xp: 3 }));
    expect(result.stats.xp).toBe(0);
    expect(result.events).toEqual([{ reason: "wrong_fix", delta: -3 }]);
  });

  it("keeps XP at 0 when it is already 0", () => {
    const result = applyWrongAttempt(stats({ xp: 0 }));
    expect(result.stats.xp).toBe(0);
    expect(result.events).toEqual([{ reason: "wrong_fix", delta: 0 }]);
  });

  it("never levels up", () => {
    expect(applyWrongAttempt(stats({ xp: 100 })).leveledUp).toBe(false);
  });
});

describe("correct solves — XP events", () => {
  it("a fresh first-try solve earns +10 correct, +5 first-try, +5 daily = 20", () => {
    const result = applyCorrectSolve(INITIAL_STATS, { ...freshSolve, now: at("2026-06-10") });
    expect(result.stats.xp).toBe(20);
    expect(result.events.map((e) => e.reason)).toEqual([
      "correct_fix",
      "first_try_bonus",
      "daily_first_solve",
    ]);
    expect(result.stats.correctAttempts).toBe(1);
    expect(result.stats.totalAttempts).toBe(1);
  });

  it("one hint keeps the first-try bonus; two hints forfeit it", () => {
    const oneHint = applyCorrectSolve(INITIAL_STATS, {
      ...freshSolve,
      hintsUsed: 1,
      now: at("2026-06-10"),
    });
    expect(oneHint.events.some((e) => e.reason === "first_try_bonus")).toBe(true);

    const twoHints = applyCorrectSolve(INITIAL_STATS, {
      ...freshSolve,
      hintsUsed: 2,
      now: at("2026-06-10"),
    });
    expect(twoHints.events.some((e) => e.reason === "first_try_bonus")).toBe(false);
    expect(twoHints.stats.xp).toBe(15);
  });

  it("any wrong attempt forfeits the first-try bonus", () => {
    const result = applyCorrectSolve(INITIAL_STATS, {
      ...freshSolve,
      wrongAttempts: 1,
      now: at("2026-06-10"),
    });
    expect(result.events.some((e) => e.reason === "first_try_bonus")).toBe(false);
    expect(result.stats.xp).toBe(15);
  });

  it("the daily bonus fires only on the first solve of a UTC day", () => {
    const first = applyCorrectSolve(INITIAL_STATS, { ...freshSolve, now: at("2026-06-10") });
    const second = applyCorrectSolve(first.stats, { ...freshSolve, now: at("2026-06-10") });
    expect(second.events.map((e) => e.reason)).toEqual(["correct_fix", "first_try_bonus"]);
    expect(second.stats.xp).toBe(35);
    expect(second.stats.currentStreak).toBe(1);
  });

  it("re-solving an already-solved challenge is a pure no-op (0 XP, no farming)", () => {
    const before = stats({ xp: 40, currentStreak: 2, totalAttempts: 5, correctAttempts: 4 });
    const result = applyCorrectSolve(before, {
      alreadySolved: true,
      wrongAttempts: 0,
      hintsUsed: 0,
      now: at("2026-06-11"),
    });
    expect(result.stats).toEqual(before);
    expect(result.events).toEqual([]);
    expect(result.leveledUp).toBe(false);
  });

  it("flags a level-up when the solve crosses a 50-XP boundary", () => {
    const crossing = applyCorrectSolve(stats({ xp: 45, lastActiveDay: "2026-06-10" }), {
      ...freshSolve,
      now: at("2026-06-10"),
    });
    expect(crossing.stats.xp).toBe(60);
    expect(crossing.leveledUp).toBe(true);

    const within = applyCorrectSolve(stats({ xp: 10, lastActiveDay: "2026-06-10" }), {
      ...freshSolve,
      now: at("2026-06-10"),
    });
    expect(within.leveledUp).toBe(false);
  });
});

describe("streaks (UTC-day based)", () => {
  it("the first ever solve starts the streak at 1", () => {
    const result = applyCorrectSolve(INITIAL_STATS, { ...freshSolve, now: at("2026-06-10") });
    expect(result.stats.currentStreak).toBe(1);
    expect(result.stats.longestStreak).toBe(1);
    expect(result.stats.lastActiveDay).toBe("2026-06-10");
  });

  it("a solve on the next UTC day extends the streak", () => {
    const day1 = applyCorrectSolve(INITIAL_STATS, { ...freshSolve, now: at("2026-06-10") });
    const day2 = applyCorrectSolve(day1.stats, { ...freshSolve, now: at("2026-06-11") });
    expect(day2.stats.currentStreak).toBe(2);
    expect(day2.stats.longestStreak).toBe(2);
  });

  it("extends across a month boundary", () => {
    const eom = applyCorrectSolve(INITIAL_STATS, { ...freshSolve, now: at("2026-06-30") });
    const bom = applyCorrectSolve(eom.stats, { ...freshSolve, now: at("2026-07-01") });
    expect(bom.stats.currentStreak).toBe(2);
  });

  it("a missed day restarts the streak at 1 and preserves the longest", () => {
    const before = stats({ currentStreak: 4, longestStreak: 4, lastActiveDay: "2026-06-08" });
    const result = applyCorrectSolve(before, { ...freshSolve, now: at("2026-06-10") });
    expect(result.stats.currentStreak).toBe(1);
    expect(result.stats.longestStreak).toBe(4);
  });

  it("displayStreak shows the stored streak today and yesterday, 0 after a lapse", () => {
    const active = stats({ currentStreak: 3, lastActiveDay: "2026-06-09" });
    expect(displayStreak(active, at("2026-06-09"))).toBe(3);
    expect(displayStreak(active, at("2026-06-10"))).toBe(3);
    expect(displayStreak(active, at("2026-06-11"))).toBe(0);
    expect(displayStreak(INITIAL_STATS, at("2026-06-10"))).toBe(0);
  });
});

describe("accuracy", () => {
  it("is null before any attempt and correct/total after", () => {
    expect(accuracy(INITIAL_STATS)).toBeNull();
    expect(accuracy(stats({ correctAttempts: 2, totalAttempts: 3 }))).toBeCloseTo(2 / 3);
  });
});

describe("utcDayOf", () => {
  it("formats the UTC date regardless of time of day", () => {
    expect(utcDayOf(new Date("2026-06-10T00:00:01Z"))).toBe("2026-06-10");
    expect(utcDayOf(new Date("2026-06-10T23:59:59Z"))).toBe("2026-06-10");
  });
});

describe("dailyChallengeId", () => {
  const ids = [
    "ml-001-a",
    "ml-002-b",
    "dl-001-c",
    "dl-002-d",
    "fullstack-001-e",
    "fullstack-002-f",
    "db-001-g",
    "db-002-h",
  ];

  it("is deterministic for the same UTC day", () => {
    expect(dailyChallengeId(ids, "2026-06-10")).toBe(dailyChallengeId(ids, "2026-06-10"));
  });

  it("is independent of catalog order", () => {
    const shuffled = [...ids].reverse();
    expect(dailyChallengeId(shuffled, "2026-06-10")).toBe(dailyChallengeId(ids, "2026-06-10"));
  });

  it("always picks from the catalog and varies across days", () => {
    const picks = new Set<string>();
    for (let day = 1; day <= 14; day++) {
      const pick = dailyChallengeId(ids, `2026-06-${String(day).padStart(2, "0")}`);
      expect(pick).not.toBeNull();
      expect(ids).toContain(pick);
      picks.add(pick as string);
    }
    expect(picks.size).toBeGreaterThan(1);
  });

  it("returns null for an empty catalog", () => {
    expect(dailyChallengeId([], "2026-06-10")).toBeNull();
  });
});
