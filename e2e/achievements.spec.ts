import { expect, test, type Page } from "@playwright/test";

/** Phase 5.6b acceptance — badges, daily-goal ring, sector rings, rank ladder. */

async function solveKmeans(page: Page) {
  await page
    .getByRole("button", { name: /01_kmeans_customer_segmentation\.ipynb/ })
    .first()
    .click();
  await page.getByRole("radio", { name: /Standardize both features/ }).click();
  await page.getByRole("button", { name: "Run Cell" }).click();
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
}

test("a first solve unlocks First Blood and advances the daily-goal ring", async ({ page }) => {
  await page.goto("/app");
  await solveKmeans(page);

  const toast = page.getByRole("status", { name: "XP earned" });
  await expect(toast.getByText("Badge unlocked")).toBeVisible();
  await expect(toast.getByText("First Blood")).toBeVisible();

  // Daily-goal ring advances (label shown on desktop viewport).
  await expect(page.getByText("1/3")).toBeVisible();
  // Sidebar ML sector ring reflects the solve.
  await expect(page.getByRole("img", { name: "Machine Learning: 1/15" })).toBeVisible();
});

test("the trophy case on /portfolio shows earned and locked badges", async ({ page }) => {
  await page.goto("/app");
  await solveKmeans(page);

  await page.goto("/portfolio");
  const trophyCase = page.getByRole("region", { name: "Earned badges" });
  await expect(trophyCase.getByText("Trophy case")).toBeVisible();

  const firstBlood = trophyCase.getByRole("listitem").filter({ hasText: "First Blood" });
  await expect(firstBlood.getByText("Earned")).toBeVisible();

  // A high-threshold badge stays locked.
  const tracebackHunter = trophyCase.getByRole("listitem").filter({ hasText: "Traceback Hunter" });
  await expect(tracebackHunter.getByText("Locked")).toBeVisible();
});

test("the Data Analyst sector is ungated — a level-1 user opens a medium mission", async ({
  page,
}) => {
  await page.goto("/app");
  // Filter to the ungated on-ramp and open a medium DA mission.
  await page.getByRole("button", { name: "Data Analyst", exact: true }).click();
  await page
    .getByRole("button", { name: /10_clean_duplicate_orders\.ipynb/ })
    .first()
    .click();

  // No lock for a fresh level-1 player: the Run cell renders, not the locked panel.
  await expect(page.locator("[data-run-cell]")).toBeVisible();
  await expect(page.getByRole("region", { name: "This mission is locked" })).toHaveCount(0);
});

test("the rank ladder highlights the current rank", async ({ page }) => {
  await page.goto("/ranks");
  await expect(page.getByRole("heading", { name: "Rank ladder" })).toBeVisible();

  // A fresh anonymous player is a Compile Rookie.
  const rookie = page.getByRole("listitem").filter({ hasText: "Compile Rookie" });
  await expect(rookie.getByText("You are here")).toBeVisible();
  await expect(page.getByText("Overlord Compiler")).toBeVisible();
});
