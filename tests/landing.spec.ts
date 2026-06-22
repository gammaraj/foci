import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero headline and subtitle", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("deep work, one calm window");
    await expect(page.getByText("Free Pomodoro timer, tasks, session tracking")).toBeVisible();
  });

  test("renders primary and secondary CTA buttons", async ({ page }) => {
    const primaryCTA = page.getByRole("link", { name: "Try Foci — free" }).first();
    await expect(primaryCTA).toBeVisible();
    await expect(primaryCTA).toHaveAttribute("href", "/app");

    const secondaryCTA = page.getByRole("link", { name: "Sign in to sync →" });
    await expect(secondaryCTA).toBeVisible();
    await expect(secondaryCTA).toHaveAttribute("href", "/login");
  });

  test("renders app mockup with timer and tasks", async ({ page }) => {
    await expect(page.getByText("22:30")).toBeVisible();
    await expect(page.getByText("FOCUS · FLOW · FINISH")).toBeVisible();
    await expect(page.getByText("Research API integration")).toBeVisible();
    await expect(page.getByText("Draft design mockups")).toBeVisible();
  });

  test("renders social proof section", async ({ page }) => {
    await expect(page.getByText("No sign-up required")).toBeVisible();
    await expect(page.getByText("Installable PWA")).toBeVisible();
    await expect(page.locator("span").filter({ hasText: "Built-in ambient music" })).toBeVisible();
    await expect(page.getByText("Syncs across devices")).toBeVisible();
    await expect(page.getByText("100% free")).toBeVisible();
  });

  test("renders How Foci works section with 3 steps", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "How Foci works" })).toBeVisible();
    await expect(page.getByText("Add your tasks")).toBeVisible();
    await expect(page.getByText("Start the timer")).toBeVisible();
    await expect(page.getByText("Build your streak")).toBeVisible();
  });

  test("renders comparison section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Why not just use a browser timer?" })
    ).toBeVisible();
    await expect(page.getByText("Timer + tasks, same screen")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Built-in ambient music" })).toBeVisible();
    await expect(page.getByText("Automatic time logging")).toBeVisible();
    await expect(page.getByText("Streaks that stick")).toBeVisible();
  });

  test("renders final CTA section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Ready to focus?" })).toBeVisible();
    const finalCTA = page.getByRole("link", { name: "Try Foci — free" }).last();
    await expect(finalCTA).toBeVisible();
    await expect(finalCTA).toHaveAttribute("href", "/app");
  });

  test("renders footer", async ({ page }) => {
    await expect(page.getByText("Built for focus.")).toBeVisible();
  });

  test("primary CTA navigates to app", async ({ page }) => {
    await page.getByRole("link", { name: "Try Foci — free" }).first().click();
    await expect(page).toHaveURL(/\/app/);
  });

  test("secondary CTA navigates to login", async ({ page }) => {
    await page.getByRole("link", { name: "Sign in to sync →" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("has structured data scripts", async ({ page }) => {
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(3); // org, webapp, howto, faq
  });
});
