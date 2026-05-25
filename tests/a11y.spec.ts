import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("homepage has no serious axe violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("app page has no serious axe violations", async ({ page }) => {
    await page.goto("/app");
    await expect(page.locator("text=/\\d{2}:\\d{2}/").first()).toBeVisible();
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("timer has aria-live region for announcements", async ({ page }) => {
    await page.goto("/app");
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
  });
});
