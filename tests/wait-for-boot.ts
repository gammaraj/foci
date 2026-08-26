import { expect, type Page } from "@playwright/test";

/** Wait until the SSR boot splash unmounts so it cannot intercept clicks. */
export async function waitForBoot(page: Page) {
  await expect(page.getByRole("status", { name: "Loading Foci" })).toHaveCount(0, {
    timeout: 15_000,
  });
}

/** Guest app timer — ignore duplicate hidden strip copies on compact viewports. */
export async function expectVisibleCountdown(page: Page) {
  await expect(page.locator("text=/\\d{2}:\\d{2}/").filter({ visible: true }).first()).toBeVisible();
}
