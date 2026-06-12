import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 6 journey: anonymous → signup → one-time merge (MASTER_BRIEF.md
 * Phase 6 e2e list). Requires the local Supabase stack and a dev server
 * started WITH Supabase env. Fail-loud skip: the suite marks itself skipped
 * (visible in the report) when env is absent, since the env-less CI e2e job
 * cannot run it; the db CI job covers merge at the RPC layer.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const MAILPIT_URL = "http://127.0.0.1:54324";

test.describe("anonymous → signup merge", () => {
  test.skip(!SUPABASE_URL, "needs NEXT_PUBLIC_SUPABASE_URL + local Supabase stack");

  async function latestOtpFor(email: string): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(email)}`);
      const data = (await response.json()) as {
        messages: Array<{ ID: string; Snippet: string }>;
      };
      const snippet = data.messages?.[0]?.Snippet ?? "";
      const match = snippet.match(/\b(\d{6})\b/);
      if (match) return match[1]!;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`no OTP email arrived for ${email}`);
  }

  async function solveKmeans(page: Page) {
    await page
      .getByRole("button", { name: /01_kmeans_customer_segmentation\.ipynb/ })
      .first()
      .click();
    await page.getByRole("radio", { name: /Standardize both features/ }).click();
    await page.getByRole("button", { name: "Run Cell" }).click();
    await expect(page.getByText("APPROVED", { exact: true })).toBeVisible({ timeout: 10_000 });
  }

  test("local progress merges into a fresh account exactly once", async ({ page }) => {
    const email = `e2e-merge-${Date.now()}@example.com`;

    // 1. Earn anonymous progress.
    await page.goto("/");
    await solveKmeans(page);
    await expect(page.getByText("20/50 XP")).toBeVisible();

    // 2. Sign up via email OTP.
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Email me a code" }).click();
    const code = await latestOtpFor(email);
    await page.getByLabel("6-digit code").fill(code);
    await page.getByRole("button", { name: "Verify and sign in" }).click();

    // 3. The merge recomputed XP server-side and hydrated the store:
    //    20 XP (10 correct + 5 first-try + 5 daily tick) survives.
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("20/50 XP")).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("list", { name: "Notebook file explorer" }).getByLabel("Solved"),
    ).toBeVisible();

    // 4. The anonymous localStorage copy was consumed (no resurrection).
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("jupyter-arena-progress-v1"),
    );
    const parsed = stored ? (JSON.parse(stored) as { state?: { stats?: { xp?: number } } }) : null;
    expect(parsed?.state?.stats?.xp ?? 0).toBe(0);

    // 5. Authed solves flow through the RPC: solve a second challenge.
    await page
      .getByRole("button", { name: /02_scaler_fit_on_test\.ipynb/ })
      .first()
      .click();
    await page
      .getByRole("radio", { name: /Transform the test set with the statistics already fitted/ })
      .click();
    await page.getByRole("button", { name: "Run Cell" }).click();
    await expect(page.getByText("APPROVED", { exact: true })).toBeVisible({ timeout: 10_000 });
    // +10 correct +5 first-try (no daily: same UTC day) = 35 total.
    await expect(page.getByText("35/50 XP")).toBeVisible({ timeout: 10_000 });
  });
});
