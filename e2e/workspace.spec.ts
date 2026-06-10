import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 2 acceptance — solve and fail flows, responsiveness at
 * 360/768/1280px, and an axe scan of the workspace (MASTER_BRIEF.md).
 */

async function openFirstMission(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: /01_kmeans_customer_segmentation\.ipynb/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "01_kmeans_customer_segmentation.ipynb" }),
  ).toBeVisible();
}

test.describe("notebook flows", () => {
  test("solve flow: correct fix turns the output green and reveals the review", async ({
    page,
  }) => {
    await openFirstMission(page);

    // Broken state: red traceback visible before any run.
    await expect(page.getByText("AssertionError: Segments do not separate on age")).toBeVisible();

    await page.getByRole("radio", { name: /Standardize both features/ }).click();
    await page.getByRole("button", { name: "Run Cell" }).click();

    await expect(page.getByText("age spread across segments: 35.8 years")).toBeVisible();
    await expect(page.getByText("Fix verified", { exact: false })).toBeVisible();
    await expect(page.getByText("Senior Tech Lead — Code Review")).toBeVisible();
    await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
    await expect(page.getByText("1 solved")).toBeVisible();
  });

  test("fail flow: wrong fix shows its own failure log and rationale", async ({ page }) => {
    await openFirstMission(page);

    await page.getByRole("radio", { name: /Increase n_clusters/ }).click();
    await page.getByRole("button", { name: "Run Cell" }).click();

    await expect(page.getByText("Not the fix", { exact: false })).toBeVisible();
    await expect(page.getByText("age spread across segments: 1.5 years")).toBeVisible();
    await expect(page.getByText("Senior Tech Lead — Code Review")).not.toBeVisible();

    // Recovery: picking the correct option still solves it.
    await page.getByRole("radio", { name: /Standardize both features/ }).click();
    await page.getByRole("button", { name: "Run Cell" }).click();
    await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
  });

  test("hints reveal progressively and cap at two", async ({ page }) => {
    await openFirstMission(page);
    const hintButton = page.getByRole("button", { name: /AI Hint/ });
    await hintButton.click();
    await expect(page.getByText("Hint 1/2:", { exact: false })).toBeVisible();
    await hintButton.click();
    await expect(page.getByText("Hint 2/2:", { exact: false })).toBeVisible();
    await expect(hintButton).toBeDisabled();
  });

  test("tutorials tab opens the lesson with video search cards", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Tutorials" }).click();
    await page
      .getByRole("button", { name: /01_kmeans_customer_segmentation\.ipynb/ })
      .first()
      .click();
    await expect(page.getByText("Feature Scaling for Distance-Based Models")).toBeVisible();
    const videoLink = page.getByRole("link", { name: /Why feature scaling matters/ });
    await expect(videoLink).toHaveAttribute("href", /youtube\.com\/results\?search_query=/);
    await page.getByRole("button", { name: "Start mission" }).click();
    await expect(page.getByRole("button", { name: "Run Cell" })).toBeVisible();
  });

  test("sector and difficulty filters narrow the explorer", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Filter challenges by sector" })
      .getByRole("button", { name: "Databases" })
      .click();
    const explorer = page.getByRole("list", { name: "Notebook file explorer" });
    await expect(explorer.getByRole("button")).toHaveCount(2);
    await page
      .getByRole("group", { name: "Filter by difficulty" })
      .getByRole("button", { name: "Very Hard" })
      .click();
    await expect(explorer.getByRole("button")).toHaveCount(1);
    await expect(explorer.getByText("04_db_pool_leak.py")).toBeVisible();
  });

  test("keyboard: 2 selects option b, Enter runs, n advances", async ({ page }) => {
    await openFirstMission(page);
    // Move focus off the sidebar button so Enter is handled by the shortcut layer.
    await page.getByRole("heading", { name: "01_kmeans_customer_segmentation.ipynb" }).click();
    await page.locator("body").press("2");
    await expect(page.getByRole("radio", { name: /Increase n_clusters/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.locator("body").press("Enter");
    await expect(page.getByText("Not the fix", { exact: false })).toBeVisible();
    await page.locator("body").press("n");
    await expect(page.getByRole("heading", { name: "08_scaler_fit_on_test.ipynb" })).toBeVisible();
  });
});

test.describe("responsive", () => {
  test("mobile 360: sidebar is a drawer behind the menu button", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "Missions" })).not.toBeVisible();
    await page.getByRole("button", { name: "Open file explorer" }).click();
    await expect(page.getByRole("dialog", { name: "Notebook file explorer" })).toBeVisible();
    await page
      .getByRole("button", { name: /01_kmeans_customer_segmentation\.ipynb/ })
      .first()
      .click();
    await expect(page.getByRole("dialog", { name: "Notebook file explorer" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Run Cell" })).toBeVisible();
  });

  test("tablet 768 and desktop 1280: static sidebar, no hamburger", async ({ page }) => {
    for (const width of [768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("tab", { name: "Missions" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Open file explorer" })).not.toBeVisible();
    }
  });
});

test.describe("accessibility", () => {
  test("axe scan is clean on the workspace (empty, mission, and solved states)", async ({
    page,
  }) => {
    await page.goto("/");
    let results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await openFirstMission(page);
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await page.getByRole("radio", { name: /Standardize both features/ }).click();
    await page.getByRole("button", { name: "Run Cell" }).click();
    await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
