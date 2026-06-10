import { expect, test } from "@playwright/test";

test("home renders the header shell with tokens applied", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Jupyter Arena")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Filter challenges by sector" })).toBeVisible();

  // Design tokens applied: body background must be the --bg token (#0a0c10).
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bodyBg).toBe("rgb(10, 12, 16)");
});
