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

  test("guest can use the app without a login wall", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: "Skip tour" }).click({ timeout: 5000 }).catch(() => {});
    await expect(page.getByText("Keep this win")).toHaveCount(0);
    await expect(
      page.getByText(/sample sticks|Ready to start focusing/i).first(),
    ).toBeVisible();
  });

  test("after first completed task, guest is prompted to save", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: "Skip tour" }).click({ timeout: 5000 }).catch(() => {});
    await page.getByLabel(/^Mark ".+" complete$/).first().click();
    await expect(page.getByText("Keep this win")).toBeVisible();
    await page.getByRole("link", { name: "Save free" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
