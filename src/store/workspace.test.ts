import { beforeEach, describe, expect, it } from "vitest";
import type { Challenge } from "@/lib/content/schema";
import { EMPTY_ATTEMPT, filterChallenges, getAttempt, useWorkspaceStore } from "./workspace";

const initialState = useWorkspaceStore.getState();

beforeEach(() => {
  useWorkspaceStore.setState(initialState, true);
});

const attempt = (id: string) => getAttempt(useWorkspaceStore.getState().attempts, id);

describe("navigation", () => {
  it("openMission activates the challenge in mission view and closes the drawer", () => {
    useWorkspaceStore.setState({ sidebarOpen: true });
    useWorkspaceStore.getState().openMission("ml-001-kmeans-scaling");
    const state = useWorkspaceStore.getState();
    expect(state.activeChallengeId).toBe("ml-001-kmeans-scaling");
    expect(state.view).toBe("mission");
    expect(state.sidebarOpen).toBe(false);
  });

  it("openTutorial switches the workspace into tutorial view", () => {
    useWorkspaceStore.getState().openTutorial("db-002-sql-injection");
    expect(useWorkspaceStore.getState().view).toBe("tutorial");
    expect(useWorkspaceStore.getState().activeChallengeId).toBe("db-002-sql-injection");
  });
});

describe("attempt flow", () => {
  const id = "dl-001-device-mismatch";

  it("starts from the shared empty attempt", () => {
    expect(attempt(id)).toEqual(EMPTY_ATTEMPT);
  });

  it("select → run → correct completes as solved with no wrong attempts", () => {
    const store = useWorkspaceStore.getState();
    store.selectOption(id, "a");
    store.startRun(id);
    expect(attempt(id).runState).toBe("running");
    store.completeRun(id, true);
    expect(attempt(id)).toMatchObject({
      runState: "solved",
      solved: true,
      lastRunOption: "a",
      wrongAttempts: 0,
    });
  });

  it("a wrong run records the failure and a new selection returns to idle", () => {
    const store = useWorkspaceStore.getState();
    store.selectOption(id, "b");
    store.startRun(id);
    store.completeRun(id, false);
    expect(attempt(id)).toMatchObject({
      runState: "failed",
      solved: false,
      lastRunOption: "b",
      wrongAttempts: 1,
    });
    store.selectOption(id, "a");
    expect(attempt(id).runState).toBe("idle");
    expect(attempt(id).wrongAttempts).toBe(1);
  });

  it("cannot run without a selected option", () => {
    useWorkspaceStore.getState().startRun(id);
    expect(attempt(id).runState).toBe("idle");
  });

  it("ignores selection changes and re-runs once solved", () => {
    const store = useWorkspaceStore.getState();
    store.selectOption(id, "a");
    store.startRun(id);
    store.completeRun(id, true);
    store.selectOption(id, "b");
    store.startRun(id);
    expect(attempt(id)).toMatchObject({ selectedOption: "a", runState: "solved" });
  });

  it("ignores selection while a run is in flight", () => {
    const store = useWorkspaceStore.getState();
    store.selectOption(id, "b");
    store.startRun(id);
    store.selectOption(id, "c");
    expect(attempt(id).selectedOption).toBe("b");
  });

  it("completeRun without a running state is a no-op", () => {
    const store = useWorkspaceStore.getState();
    store.selectOption(id, "a");
    store.completeRun(id, true);
    expect(attempt(id).runState).toBe("idle");
    expect(attempt(id).solved).toBe(false);
  });

  it("tracks attempts independently per challenge", () => {
    const store = useWorkspaceStore.getState();
    store.selectOption("a-001-x", "a");
    store.selectOption("b-001-y", "c");
    expect(attempt("a-001-x").selectedOption).toBe("a");
    expect(attempt("b-001-y").selectedOption).toBe("c");
  });
});

describe("hints", () => {
  it("reveals progressively and caps at two", () => {
    const id = "ml-001-kmeans-scaling";
    const store = useWorkspaceStore.getState();
    store.revealHint(id);
    expect(attempt(id).hintsRevealed).toBe(1);
    store.revealHint(id);
    store.revealHint(id);
    expect(attempt(id).hintsRevealed).toBe(2);
  });
});

const stub = (overrides: Partial<Challenge>): Challenge =>
  ({
    id: "ml-001-a",
    sector: "ml",
    difficulty: "easy",
    title: "01_a.ipynb",
    conceptTags: ["feature-scaling"],
    ...overrides,
  }) as Challenge;

describe("filterChallenges", () => {
  const catalog = [
    stub({ id: "ml-001-a", sector: "ml", difficulty: "easy", title: "01_kmeans.ipynb" }),
    stub({
      id: "db-001-b",
      sector: "db",
      difficulty: "very_hard",
      title: "04_db_pool_leak.py",
      conceptTags: ["connection-pooling"],
    }),
    stub({
      id: "dl-001-c",
      sector: "dl",
      difficulty: "hard",
      title: "03_pytorch_gpu_mismatch.ipynb",
      conceptTags: ["cuda"],
    }),
  ];

  it("filters by sector", () => {
    const result = filterChallenges(catalog, { sector: "db", difficulty: "all", query: "" });
    expect(result.map((c) => c.id)).toEqual(["db-001-b"]);
  });

  it("filters by difficulty", () => {
    const result = filterChallenges(catalog, { sector: "all", difficulty: "hard", query: "" });
    expect(result.map((c) => c.id)).toEqual(["dl-001-c"]);
  });

  it("searches title and concept tags case-insensitively", () => {
    expect(
      filterChallenges(catalog, { sector: "all", difficulty: "all", query: "KMEANS" }).map(
        (c) => c.id,
      ),
    ).toEqual(["ml-001-a"]);
    expect(
      filterChallenges(catalog, { sector: "all", difficulty: "all", query: "pooling" }).map(
        (c) => c.id,
      ),
    ).toEqual(["db-001-b"]);
  });

  it("combines filters", () => {
    const result = filterChallenges(catalog, { sector: "ml", difficulty: "very_hard", query: "" });
    expect(result).toEqual([]);
  });
});
