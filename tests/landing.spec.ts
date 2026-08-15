import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero headline and subtitle", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Plan your day. Finish your tasks.");
    await expect(page.getByText("Free · Optional sync with account")).toBeVisible();
    await expect(
      page.getByText("Organize projects, plan the day, and finish what matters"),
    ).toBeVisible();
  });

  test("renders primary and secondary CTA buttons", async ({ page }) => {
    const primaryCTA = page.getByRole("link", { name: "Create free account" }).first();
    await expect(primaryCTA).toBeVisible();
    await expect(primaryCTA).toHaveAttribute("href", "/login");

    const secondaryCTA = page.getByRole("link", { name: "Sign in →" }).first();
    await expect(secondaryCTA).toBeVisible();
    await expect(secondaryCTA).toHaveAttribute("href", "/login");
  });

  test("renders app preview screenshot", async ({ page }) => {
    const preview = page.getByRole("img", {
      name: /Foci task board with projects organized as cards/i,
    });
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute("src", "/home-app-preview.webp");
  });

  test("logged-out nav is trimmed to essentials", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Features" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Blog" })).toBeVisible();
    await expect(page.getByRole("link", { name: "About" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Try Foci" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Stats" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /settings/i })).toHaveCount(0);
    await expect(page.getByText(/Partly cloudy|Clear sky|Baltimore|Austin/i)).toHaveCount(0);
    await expect(page.getByText("FOCUS · FLOW · FINISH")).toHaveCount(0);
  });

  test("renders social proof section", async ({ page }) => {
    await expect(page.getByText("Free to start")).toBeVisible();
    await expect(page.getByText("Sync across devices")).toBeVisible();
    await expect(page.getByText("Import Todoist, Notion & more")).toBeVisible();
    await expect(page.getByText("Works offline (PWA)")).toBeVisible();
  });

  test("renders How Foci works section with 3 steps", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "How Foci works" })).toBeVisible();
    await expect(page.getByText("Add your tasks")).toBeVisible();
    await expect(page.getByText("Plan your day")).toBeVisible();
    await expect(page.getByText("Build your streak")).toBeVisible();
  });

  test("renders comparison section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "More than a to-do list" }),
    ).toBeVisible();
    await expect(page.getByText("Tasks + projects, same screen")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Smart Plan scheduling" })).toBeVisible();
    await expect(page.getByText("Import from your tools")).toBeVisible();
    await expect(page.getByText("Streaks that stick")).toBeVisible();
  });

  test("renders final CTA section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Ready to focus?" })).toBeVisible();
    const finalCTA = page.getByRole("link", { name: "Create free account" }).last();
    await expect(finalCTA).toBeVisible();
    await expect(finalCTA).toHaveAttribute("href", "/login");
  });

  test("renders footer with legal links", async ({ page }) => {
    await expect(page.getByText("Built for focus.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    await expect(page.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  });

  test("primary CTA navigates to login", async ({ page }) => {
    await page.getByRole("link", { name: "Create free account" }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("has structured data scripts", async ({ page }) => {
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(3); // org, webapp, howto, faq
  });
});
