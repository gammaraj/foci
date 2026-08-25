import { test, expect, type Page } from "@playwright/test";

async function dismissChrome(page: Page) {
  await page.getByRole("button", { name: "Skip tour" }).click({ timeout: 5000 }).catch(() => {});
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {});
}

async function quickAddTask(page: Page, title: string) {
  await page.getByLabel("Quick Add").first().click();
  const input = page.getByPlaceholder("Quick add a task…");
  await input.fill(title);
  await input.press("Enter");
  await expect(page.getByText(title).first()).toBeVisible();
}

test.describe("App Page (unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app");
    await dismissChrome(page);
  });

  test("renders the timer display", async ({ page }) => {
    const dock = page.getByRole("status", { name: "Focus timer and music" }).filter({ visible: true });
    await expect(dock).toBeVisible();
    await expect(dock.getByText(/\d{2}:\d{2}/)).toBeVisible();
  });

  test("renders the tasks panel", async ({ page }) => {
    await expect(page.getByText("Tasks", { exact: true }).first()).toBeVisible();
  });

  test("renders task list with Quick Add", async ({ page }) => {
    await expect(page.getByLabel("Quick Add").first()).toBeVisible();
  });

  test("can add a new task", async ({ page }) => {
    await quickAddTask(page, "Test task from Playwright");
  });

  test("can complete a task via checkbox button", async ({ page }) => {
    await quickAddTask(page, "Task to complete");
    await page.getByLabel('Mark "Task to complete" complete').click();
    await expect(page.getByLabel('Mark "Task to complete" complete')).toHaveCount(0);
    await expect(page.getByText(/Done today/).first()).toBeVisible();
  });

  test("can delete a task", async ({ page }) => {
    await quickAddTask(page, "Task to delete");
    const row = page.getByLabel('Open "Task to delete". Double-click to rename.');
    await row.hover();
    await page.getByLabel('More actions for "Task to delete"').click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Task to delete")).toHaveCount(0);
  });

  test("renders music source control", async ({ page }) => {
    await expect(page.getByLabel(/Music source:/i).first()).toBeVisible();
    await expect(page.getByLabel(/Play ambient sound|Open player|Play /i).first()).toBeVisible();
  });

  test("Spotify play starts the selected playlist without opening the picker", async ({ page }) => {
    await page.getByLabel(/Music source:/i).first().click();
    await page.getByRole("option", { name: "Spotify" }).click();

    await page.getByLabel(/Play Peaceful Meditation/i).click();
    await expect(page.getByRole("dialog", { name: "Music player" })).toHaveCount(0);

    await page.getByLabel(/Show Peaceful Meditation options/i).click();
    const picker = page.getByRole("dialog", { name: "Music player" });
    await expect(picker).toBeVisible();
    await expect(picker.getByText("Peaceful Meditation")).toBeVisible();
    await expect(picker.locator("iframe")).toHaveCount(0);
  });

  test("can open settings panel", async ({ page }) => {
    await page.getByLabel("Task panel menu").click();
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(page.getByText("Work (min)", { exact: false })).toBeVisible();
  });

  test("layout is responsive - mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/app");
    await dismissChrome(page);
    const dock = page.getByRole("status", { name: "Focus timer and music" }).filter({ visible: true });
    await expect(dock).toBeVisible();
    await expect(page.getByLabel("Quick Add").first()).toBeVisible();
  });

  test("mobile: saving preselected today on an undated task persists", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.use?.isMobile, "custom date sheet is for touch/iOS");

    const title = `Undated due ${Date.now()}`;
    await quickAddTask(page, title);

    await page.getByLabel(`Open "${title}". Double-click to rename.`).click();
    const details = page.getByRole("dialog", { name: `Task details: ${title}` });
    await expect(details).toBeVisible();

    await details.getByLabel("Set due date").click();
    const picker = page.getByRole("dialog", { name: "Set due date" });
    await expect(picker).toBeVisible();
    await picker.getByRole("button", { name: "Save" }).click();

    await expect(details.getByText("Today", { exact: true })).toBeVisible();
    await expect(details.getByText("Set due date")).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Set due date" })).toHaveCount(0);
  });
});
