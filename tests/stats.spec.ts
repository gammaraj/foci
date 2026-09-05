import { test, expect } from "@playwright/test";
import { waitForBoot } from "./wait-for-boot";

test.describe("Stats Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stats");
    await waitForBoot(page);
  });

  test("renders page heading and subtitle", async ({ page }, testInfo) => {
    await expect(page.getByRole("heading", { name: "Stats", exact: true })).toBeVisible();
    if (!testInfo.project.use?.isMobile) {
      await expect(page.getByText("Focus habits, sessions, and backlog health")).toBeVisible();
    }
  });

  test("renders 4 stat cards", async ({ page }) => {
    await expect(page.getByText("Total sessions")).toBeVisible();
    await expect(page.getByText("Focus time", { exact: true })).toBeVisible();
    await expect(page.getByText("Current streak")).toBeVisible();
    await expect(page.getByText("Avg / active day")).toBeVisible();
  });

  test("renders range toggle with 7D and 30D options", async ({ page }) => {
    const btn7 = page.getByRole("button", { name: "7D" });
    const btn30 = page.getByRole("button", { name: "30D" });
    await expect(btn7).toBeVisible();
    await expect(btn30).toBeVisible();
  });

  test("can switch between 7D and 30D range", async ({ page }) => {
    const btn30 = page.getByRole("button", { name: "30D" });
    await btn30.click();
    await expect(btn30).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "7D" })).toHaveAttribute("aria-pressed", "false");

    const btn7 = page.getByRole("button", { name: "7D" });
    await btn7.click();
    await expect(btn7).toHaveAttribute("aria-pressed", "true");
    await expect(btn30).toHaveAttribute("aria-pressed", "false");
  });

  test("renders activity heatmap section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
    // Legend should be visible
    await expect(page.getByText("Less")).toBeVisible();
    await expect(page.getByText("More")).toBeVisible();
  });

  test("renders sessions per day chart", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sessions per day" })).toBeVisible();
  });

  test("renders focus time per day chart", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Focus time per day" })).toBeVisible();
  });

  test("renders focus by project section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Focus by project" })).toBeVisible();
  });

  test("renders today's activity section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Today's activity" })).toBeVisible();
  });

  test("renders goal completion section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Goal completion" })).toBeVisible();
  });

  test("renders weekly pattern section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Weekly pattern" })).toBeVisible();
    // Day labels should be visible
    await expect(page.getByText("Mo").first()).toBeVisible();
  });

  test("renders overview section with stats", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByText("Longest streak")).toBeVisible();
    await expect(page.getByText("Active days", { exact: true })).toBeVisible();
    await expect(page.getByText("Goals met")).toBeVisible();
    await expect(page.getByText("Total tasks")).toBeVisible();
  });

  test("page uses shared app container width", async ({ page }) => {
    const main = page.locator("main");
    const className = await main.getAttribute("class");
    expect(className).toContain("app-container");
  });

  test("has navbar", async ({ page }) => {
    await expect(page.getByText("Foci").first()).toBeVisible();
  });
});
