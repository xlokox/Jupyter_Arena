import { describe, expect, it } from "vitest";
import { createTestUser, easyChallenges, getDailyGoal, submit, utcDay } from "./helpers";

/** Phase 5.6b — submit_attempt v3 ticks a per-UTC-day solve goal (no XP effect). */

const TODAY = utcDay(0);

describe("daily goal", () => {
  it("counts correct first solves and completes at the target", async () => {
    const user = await createTestUser();
    const easy = await easyChallenges(4);
    expect(easy.length).toBeGreaterThanOrEqual(4);

    const first = await submit(user, easy[0]!.id, easy[0]!.option, 0);
    expect(first.daily_goal).toMatchObject({ progress: 1, target: 3, completed: false });

    await submit(user, easy[1]!.id, easy[1]!.option, 0);
    const third = await submit(user, easy[2]!.id, easy[2]!.option, 0);
    expect(third.daily_goal).toMatchObject({ progress: 3, completed: true });

    const goal = await getDailyGoal(user.userId, TODAY);
    expect(goal!.completed_at).not.toBeNull();

    // A fourth solve advances progress but does not re-complete.
    const fourth = await submit(user, easy[3]!.id, easy[3]!.option, 0);
    expect(fourth.daily_goal).toMatchObject({ progress: 4, completed: true });
  });

  it("does not count re-solves or wrong attempts", async () => {
    const user = await createTestUser();
    const c = (await easyChallenges(1))[0]!;

    await submit(user, c.id, c.option, 0); // first solve → progress 1
    const reSolve = await submit(user, c.id, c.option, 0); // already solved
    expect(reSolve.already_solved).toBe(true);
    expect(reSolve.daily_goal).toBeNull();

    const wrongOption = c.option === "a" ? "b" : "a";
    const wrong = await submit(user, c.id, wrongOption);
    expect(wrong.is_correct).toBe(false);
    expect(wrong.daily_goal).toBeNull();

    const goal = await getDailyGoal(user.userId, TODAY);
    expect(goal!.progress_solves).toBe(1);
  });
});
