import { expect, test } from "@playwright/test";

test("landing renders the brand and primary CTA with tokens applied", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner").getByText("Jupyter Arena")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Enter the Arena" }).first()).toBeVisible();

  // Design tokens applied: body background must be the --bg token (#0a0c10).
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bodyBg).toBe("rgb(10, 12, 16)");
});

test("workspace at /app renders the header shell with the sound toggle", async ({ page }) => {
  await page.goto("/app");

  await expect(page.getByRole("banner").getByText("Jupyter Arena")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Filter challenges by sector" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enable sound effects" })).toBeVisible();
});
