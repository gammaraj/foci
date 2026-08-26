import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForBoot, expectVisibleCountdown } from "./wait-for-boot";

test.describe("Accessibility", () => {
  test("homepage has no serious axe violations", async ({ page }) => {
    await page.goto("/");
    await waitForBoot(page);
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("app page has no serious axe violations", async ({ page }) => {
    await page.goto("/app");
    await waitForBoot(page);
    await expectVisibleCountdown(page);
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("timer has aria-live region for announcements", async ({ page }) => {
    await page.goto("/app");
    await waitForBoot(page);
    await expect(page.locator(".sr-only[aria-live='polite'][aria-atomic='true']")).toBeAttached();
  });
});
