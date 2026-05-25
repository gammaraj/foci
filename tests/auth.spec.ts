import { test, expect } from "@playwright/test";

test.describe("Auth & collaboration (guest)", () => {
  test("login page renders sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/sync your tasks and streaks/i)).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("guest user does not see collaboration invite button on /app", async ({ page }) => {
    await page.goto("/app");
    await expect(page.locator("text=/\\d{2}:\\d{2}/").first()).toBeVisible();
    await expect(page.getByLabel(/collaboration invites/i)).toHaveCount(0);
  });

  test("guest user sees sign-up banner", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByText("Sign up free")).toBeVisible();
  });

  test("login link from banner navigates to /login", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
