import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const opacityOf = (locator: Locator) =>
  locator.evaluate((el) => Number(getComputedStyle(el).opacity));

/** Scroll the window to a fraction of the hero's pinned scroll track. */
async function scrollHeroTo(page: Page, progress: number) {
  await page.evaluate((p) => {
    const section = document.querySelector("section[aria-labelledby=hero-title]")!;
    const track = section.querySelector(".lv2-track") as HTMLElement;
    const top = window.scrollY + track.getBoundingClientRect().top;
    const distance = track.offsetHeight - window.innerHeight;
    window.scrollTo(0, top + p * Math.max(distance, 0));
  }, progress);
  // Let the rAF-throttled scroll handler write --lv2-p, then the style settle.
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
  );
  await page.waitForTimeout(150);
}

test.describe("landing — scroll-driven hero + story (desktop scrub)", () => {
  test("hero copy, CTAs, and story beats all render", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "AI writes the code. Can you fix it?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Enter the Arena" }).first()).toBeVisible();

    // Secondary CTA jumps to the story section.
    const seeWhy = page.getByRole("link", { name: /See why this matters/ });
    await expect(seeWhy).toHaveAttribute("href", "#why");

    // The three story beats are server-rendered.
    await expect(page.getByText(/For decades, developers were paid/)).toBeAttached();
    await expect(page.getByText(/Now AI writes most of it/)).toBeAttached();
    await expect(page.getByText(/The next generation of developers/)).toBeAttached();

    // The dev + robot scene is exposed as a labelled image; the CTA is present.
    await expect(page.getByRole("img", { name: /developer and an AI robot/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Train the skill AI can't replace/ })).toBeAttached();
  });

  test("axe scan is clean on the landing", async ({ page }) => {
    await page.goto("/");
    // Ensure the token stylesheet has applied before scanning contrast, so the
    // scan never races a pre-CSS frame (body bg === the --bg token #0a0c10).
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(10, 12, 16)");
    // Scroll the page through so every <Reveal> section settles at full opacity
    // (they only fade in once on-screen) — scan the real, fully-read state.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));
    });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("scrubbing reveals the fix and assembles the HUD", async ({ page }) => {
    await page.goto("/");

    // The hero enters scrub mode on a ≥768px viewport.
    const section = page.locator("section[aria-labelledby=hero-title]");
    await expect(section).toHaveClass(/is-scrubbing/);

    // At the top: broken cell visible, solved layers hidden.
    await scrollHeroTo(page, 0);
    expect(await opacityOf(page.getByTestId("hero-traceback").locator("span").first())).toBeGreaterThan(0.8);
    expect(await opacityOf(page.getByTestId("hero-success"))).toBeLessThan(0.2);
    expect(await opacityOf(page.getByTestId("hero-hud"))).toBeLessThan(0.2);

    // Near the end of the pin: success + HUD are revealed.
    await scrollHeroTo(page, 0.95);
    await expect.poll(() => opacityOf(page.getByTestId("hero-success"))).toBeGreaterThan(0.8);
    await expect.poll(() => opacityOf(page.getByTestId("hero-hud"))).toBeGreaterThan(0.8);
  });
});

test.describe("landing — reduced motion (static solved frame)", () => {
  test("hero shows the assembled frame; story is stacked panels", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");

    const section = page.locator("section[aria-labelledby=hero-title]");
    await expect(section).toHaveClass(/is-reduced/);

    // Solved frame: success visible, traceback gone — no scroll required.
    expect(await opacityOf(page.getByTestId("hero-success"))).toBeGreaterThan(0.8);
    expect(await opacityOf(page.getByTestId("hero-traceback").locator("span").first())).toBeLessThan(0.2);
    expect(await opacityOf(page.getByTestId("hero-hud"))).toBeGreaterThan(0.8);

    // All three beats are visible at once (no crossfade, full copy parity).
    const beats = page.locator("#why .lv2-beat");
    await expect(beats).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      expect(await opacityOf(beats.nth(i))).toBeGreaterThan(0.8);
    }
    await expect(page.getByText(/The next generation of developers/)).toBeVisible();

    await context.close();
  });
});

test.describe("landing — no JavaScript (server-rendered copy)", () => {
  test.use({ javaScriptEnabled: false });

  test("hero and all story copy are readable without JS", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "AI writes the code. Can you fix it?" })).toBeVisible();
    await expect(page.getByText(/A free debugging arena — 90 missions/)).toBeVisible();
    await expect(page.getByText(/For decades, developers were paid/)).toBeVisible();
    await expect(page.getByText(/Now AI writes most of it/)).toBeVisible();
    await expect(page.getByText(/The next generation of developers/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Train the skill AI can't replace/ })).toBeVisible();
  });
});
