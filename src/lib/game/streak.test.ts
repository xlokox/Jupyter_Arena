import { describe, expect, it } from "vitest";
import { applyCorrectSolve, INITIAL_STATS, utcDayOf, type GameStats } from "./xp";
import {
  applyDailyStreakTick,
  initialDailyGoal,
  tickDailyGoal,
  type StreakInput,
} from "./streak";

const TODAY = "2026-06-12";
const YESTERDAY = "2026-06-11";
const DAY_BEFORE = "2026-06-10"; // one missed day if last active here
const THREE_AGO = "2026-06-09";

const input = (overrides: Partial<StreakInput>): StreakInput => ({
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDay: null,
  freezeTokens: 0,
  today: TODAY,
  ...overrides,
});

describe("applyDailyStreakTick", () => {
  it("first ever solve starts the streak at 1", () => {
    const r = applyDailyStreakTick(input({ lastActiveDay: null }));
    expect(r).toMatchObject({ currentStreak: 1, longestStreak: 1, lastActiveDay: TODAY, ticked: true });
    expect(r.freezeSpent).toBe(false);
  });

  it("a solve the day after extends the streak", () => {
    const r = applyDailyStreakTick(
      input({ currentStreak: 3, longestStreak: 3, lastActiveDay: YESTERDAY }),
    );
    expect(r.currentStreak).toBe(4);
    expect(r.longestStreak).toBe(4);
    expect(r.freezeSpent).toBe(false);
  });

  it("a second solve the same day is a no-op tick", () => {
    const r = applyDailyStreakTick(
      input({ currentStreak: 4, longestStreak: 9, lastActiveDay: TODAY, freezeTokens: 1 }),
    );
    expect(r).toMatchObject({ currentStreak: 4, longestStreak: 9, freezeTokens: 1, ticked: false });
  });

  describe("freeze bridge (single missed day)", () => {
    it("spends a token to bridge a one-day gap", () => {
      const r = applyDailyStreakTick(
        input({ currentStreak: 5, longestStreak: 5, lastActiveDay: DAY_BEFORE, freezeTokens: 1 }),
      );
      expect(r.currentStreak).toBe(6); // bridged, not reset
      expect(r.freezeTokens).toBe(0);
      expect(r.freezeSpent).toBe(true);
    });

    it("without a token, a one-day gap resets to 1", () => {
      const r = applyDailyStreakTick(
        input({ currentStreak: 5, longestStreak: 5, lastActiveDay: DAY_BEFORE, freezeTokens: 0 }),
      );
      expect(r.currentStreak).toBe(1);
      expect(r.freezeSpent).toBe(false);
    });

    it("a two-day gap resets even with a token (only single misses bridge)", () => {
      const r = applyDailyStreakTick(
        input({ currentStreak: 5, longestStreak: 5, lastActiveDay: THREE_AGO, freezeTokens: 2 }),
      );
      expect(r.currentStreak).toBe(1);
      expect(r.freezeTokens).toBe(2);
      expect(r.freezeSpent).toBe(false);
    });
  });

  describe("freeze earn (every 7th day, capped at 2)", () => {
    it("earns a token when the streak reaches 7", () => {
      const r = applyDailyStreakTick(
        input({ currentStreak: 6, longestStreak: 6, lastActiveDay: YESTERDAY, freezeTokens: 0 }),
      );
      expect(r.currentStreak).toBe(7);
      expect(r.freezeTokens).toBe(1);
      expect(r.freezeEarned).toBe(true);
    });

    it("does not exceed the cap of 2", () => {
      const r = applyDailyStreakTick(
        input({ currentStreak: 13, longestStreak: 13, lastActiveDay: YESTERDAY, freezeTokens: 2 }),
      );
      expect(r.currentStreak).toBe(14);
      expect(r.freezeTokens).toBe(2);
      expect(r.freezeEarned).toBe(false);
    });

    it("a non-multiple-of-7 day earns nothing", () => {
      const r = applyDailyStreakTick(
        input({ currentStreak: 4, longestStreak: 4, lastActiveDay: YESTERDAY, freezeTokens: 0 }),
      );
      expect(r.freezeTokens).toBe(0);
      expect(r.freezeEarned).toBe(false);
    });
  });

  describe("zero-token parity with the frozen applyCorrectSolve streak rule", () => {
    // At 0 tokens, the streak counter must be byte-identical to Section 9.
    const cases: Array<[string, string | null, number]> = [
      ["first solve", null, 0],
      ["consecutive day", YESTERDAY, 3],
      ["missed one day", DAY_BEFORE, 5],
      ["missed several days", THREE_AGO, 9],
    ];
    for (const [label, lastActiveDay, currentStreak] of cases) {
      it(label, () => {
        const base: GameStats = {
          ...INITIAL_STATS,
          currentStreak,
          longestStreak: currentStreak,
          lastActiveDay,
        };
        const fromXp = applyCorrectSolve(base, {
          alreadySolved: false,
          wrongAttempts: 0,
          hintsUsed: 0,
          now: new Date(`${TODAY}T12:00:00Z`),
        }).stats;
        const fromTick = applyDailyStreakTick({
          currentStreak,
          longestStreak: currentStreak,
          lastActiveDay,
          freezeTokens: 0,
          today: utcDayOf(new Date(`${TODAY}T12:00:00Z`)),
        });
        expect(fromTick.currentStreak).toBe(fromXp.currentStreak);
        expect(fromTick.longestStreak).toBe(fromXp.longestStreak);
        expect(fromTick.lastActiveDay).toBe(fromXp.lastActiveDay);
      });
    }
  });
});

describe("tickDailyGoal", () => {
  it("counts solves toward the target and records the completion date", () => {
    let goal = initialDailyGoal(TODAY);
    goal = tickDailyGoal(goal, TODAY); // 1
    goal = tickDailyGoal(goal, TODAY); // 2
    expect(goal.completedDates).toEqual([]);
    goal = tickDailyGoal(goal, TODAY); // 3 -> complete
    expect(goal.progress).toBe(3);
    expect(goal.completedDates).toEqual([TODAY]);
  });

  it("does not record a second completion the same day", () => {
    let goal = initialDailyGoal(TODAY);
    for (let i = 0; i < 5; i++) goal = tickDailyGoal(goal, TODAY);
    expect(goal.progress).toBe(5);
    expect(goal.completedDates).toEqual([TODAY]);
  });

  it("rolls over to a fresh day, preserving completion history", () => {
    let goal = initialDailyGoal(YESTERDAY);
    for (let i = 0; i < 3; i++) goal = tickDailyGoal(goal, YESTERDAY);
    expect(goal.completedDates).toEqual([YESTERDAY]);

    goal = tickDailyGoal(goal, TODAY); // new day
    expect(goal.date).toBe(TODAY);
    expect(goal.progress).toBe(1);
    expect(goal.completedDates).toEqual([YESTERDAY]);
  });
});
