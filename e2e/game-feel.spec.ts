import { expect, test } from "@playwright/test";

/** Phase 5.6a — game-feel layer: opt-in sound and the landing front door. */

test.describe("opt-in sound", () => {
  test("toggle is off by default and the preference survives a reload", async ({ page }) => {
    await page.goto("/app");

    // Off by default — the control advertises the "enable" action.
    const enable = page.getByRole("button", { name: "Enable sound effects" });
    await expect(enable).toBeVisible();
    await expect(enable).toHaveAttribute("aria-pressed", "false");

    await enable.click();
    // Now on — the control advertises "mute", pressed-state true.
    const mute = page.getByRole("button", { name: "Mute sound effects" });
    await expect(mute).toHaveAttribute("aria-pressed", "true");

    // Persisted to localStorage → still on after a full reload + rehydrate.
    await page.reload();
    await expect(page.getByRole("button", { name: "Mute sound effects" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

test.describe("landing front door", () => {
  test("primary CTA enters the workspace at /app", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Enter the Arena" }).first().click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("navigation", { name: "Filter challenges by sector" })).toBeVisible();
  });

  test("below-the-fold content is server-rendered (SEO-visible), not JS-gated", async ({ page }) => {
    await page.goto("/");
    // Reveal animations must never remove content from the DOM.
    await expect(page.getByText("Everything you need to level up")).toBeAttached();
    await expect(page.getByText("The more you debug, the harder it gets")).toBeAttached();
  });
});
