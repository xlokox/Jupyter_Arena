import { expect, test, type Page } from "@playwright/test";

/** Phase 3 acceptance — XP feedback, anonymous persistence, portfolio, daily. */

async function solveKmeans(page: Page) {
  await page
    .getByRole("button", { name: /01_kmeans_customer_segmentation\.ipynb/ })
    .first()
    .click();
  await page.getByRole("radio", { name: /Standardize both features/ }).click();
  await page.getByRole("button", { name: "Run Cell" }).click();
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
}

test("a clean solve shows the XP toast and updates the header stats", async ({ page }) => {
  await page.goto("/");
  await solveKmeans(page);

  const toast = page.getByRole("status", { name: "XP earned" });
  await expect(toast.getByText("+20 XP")).toBeVisible();
  await expect(toast.getByText("Correct fix")).toBeVisible();
  await expect(toast.getByText("First-try bonus")).toBeVisible();
  await expect(toast.getByText("Daily streak bonus")).toBeVisible();

  await expect(page.getByText("20/50 XP")).toBeVisible();
  await expect(page.getByText("1 day streak")).toBeVisible();
  await expect(page.getByText("1 solved")).toBeVisible();
});

test("a wrong attempt floors XP at 0 in the toast and header", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /01_kmeans_customer_segmentation\.ipynb/ })
    .first()
    .click();
  await page.getByRole("radio", { name: /Increase n_clusters/ }).click();
  await page.getByRole("button", { name: "Run Cell" }).click();

  const toast = page.getByRole("status", { name: "XP earned" });
  await expect(toast.getByText("Wrong attempt")).toBeVisible();
  await expect(page.getByText("0/50 XP")).toBeVisible();
});

test("refresh restores anonymous progress from localStorage", async ({ page }) => {
  await page.goto("/");
  await solveKmeans(page);
  await expect(page.getByText("20/50 XP")).toBeVisible();

  await page.reload();

  await expect(page.getByText("20/50 XP")).toBeVisible();
  await expect(page.getByText("1 solved")).toBeVisible();
  // The solved check survives in the file explorer…
  await expect(
    page.getByRole("list", { name: "Notebook file explorer" }).getByLabel("Solved"),
  ).toBeVisible();
  // …and reopening the mission shows it still solved (review mode).
  await page
    .getByRole("button", { name: /01_kmeans_customer_segmentation\.ipynb/ })
    .first()
    .click();
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
});

test("portfolio reflects earned stats and sector progress", async ({ page }) => {
  await page.goto("/");
  await solveKmeans(page);
  await page.getByRole("link", { name: "Portfolio" }).click();

  await expect(page.getByRole("heading", { name: "Public Portfolio Dashboard" })).toBeVisible();
  await expect(
    page.getByText("Perfect for your LinkedIn or resume to prove your debugging speed!"),
  ).toBeVisible();
  await expect(page.getByText("Total XP")).toBeVisible();
  await expect(page.getByText("1/60")).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Machine Learning" })).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await expect(page.getByRole("progressbar", { name: "Machine Learning" })).toHaveAttribute(
    "aria-valuemax",
    "15",
  );
  await expect(page.getByRole("progressbar", { name: "Databases" })).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
});

test("the daily challenge route opens the same mission on every visit", async ({ page }) => {
  await page.goto("/daily");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(page.getByRole("button", { name: "Run Cell" })).toBeVisible();
  const firstTitle = await heading.textContent();
  expect(firstTitle).toBeTruthy();

  await page.goto("/daily");
  await expect(page.getByRole("button", { name: "Run Cell" })).toBeVisible();
  expect(await heading.textContent()).toBe(firstTitle);
});
