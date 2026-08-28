import { test, expect, type Page } from "@playwright/test";
import { waitForBoot } from "./wait-for-boot";

async function expectUnclipped(locator: import("@playwright/test").Locator) {
  await expect(locator).toBeVisible();
  const clippedBy = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.height < 8 || rect.width < 8) return "empty-box";
    let parent = el.parentElement;
    while (parent && parent !== document.documentElement) {
      const style = getComputedStyle(parent);
      const clips = (value: string) =>
        value === "hidden" || value === "auto" || value === "scroll" || value === "clip";
      if (clips(style.overflowX) || clips(style.overflowY)) {
        const prect = parent.getBoundingClientRect();
        const visibleH = Math.min(rect.bottom, prect.bottom) - Math.max(rect.top, prect.top);
        const visibleW = Math.min(rect.right, prect.right) - Math.max(rect.left, prect.left);
        if (visibleH < rect.height * 0.85 || visibleW < rect.width * 0.85) {
          return `${parent.tagName}.${parent.className}`.trim();
        }
      }
      parent = parent.parentElement;
    }
    return "";
  });
  expect(clippedBy).toBe("");
}

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
    await waitForBoot(page);
    await dismissChrome(page);
  });

  test("renders the timer display with a Timer label and settings", async ({ page }) => {
    const dock = page.getByRole("status", { name: "Focus timer and music" }).filter({ visible: true });
    await expect(dock).toBeVisible();
    await expect(dock.getByText("Music", { exact: true })).toBeVisible();
    await expect(dock.getByText("Timer", { exact: true })).toBeVisible();
    const music = page.locator("[data-foci-music-strip]").filter({ visible: true });
    const timer = page.locator("[data-foci-timer-strip]").filter({ visible: true });
    const musicBox = await music.boundingBox();
    const timerBox = await timer.boundingBox();
    expect(musicBox && timerBox).toBeTruthy();
    expect((timerBox?.x ?? 0) - ((musicBox?.x ?? 0) + (musicBox?.width ?? 0))).toBeGreaterThan(20);
    await expect(dock.getByText(/\d{2}:\d{2}/)).toBeVisible();
    await expect(dock.getByLabel("Expand focus timer")).toBeVisible();
    await expect(dock.getByLabel("Decrease duration by 5 minutes")).toBeVisible();
    await dock.getByLabel("Increase duration by 5 minutes").click();
    await expect(dock.getByLabel(/Work duration 35 minutes/)).toBeVisible();
    await dock.getByLabel(/Work duration 35 minutes/).click();
    await dock.getByLabel(/Work duration. Type minutes/).fill("0:30");
    await dock.getByLabel(/Work duration. Type minutes/).press("Enter");
    await expect(dock.getByLabel(/Work duration 30 seconds/)).toBeVisible();
    await dock.getByLabel("Expand focus timer").click();
    const timerPanel = page.getByRole("dialog", { name: "Focus timer" });
    await expect(timerPanel).toBeVisible();
    await timerPanel.getByRole("button", { name: "Timer settings" }).click();
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Session alarm")).toBeVisible();
  });

  test("shows the countdown in the tab title while the timer is running", async ({ page }) => {
    const dock = page.getByRole("status", { name: "Focus timer and music" }).filter({ visible: true });
    await expect(dock).toBeVisible();
    await dock.getByLabel("Start timer").click();
    await expect(page).toHaveTitle(/^\d{2}:\d{2} · Focus$/);
    await dock.getByLabel("Pause timer").click();
    await expect(page).toHaveTitle(/^\d{2}:\d{2} · Paused$/);
    await dock.getByLabel("Reset timer").click();
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page).not.toHaveTitle(/^\d{2}:\d{2} · (Focus|Paused|Break)$/);
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

  test("renders music source control", async ({ page }, testInfo) => {
    const dock = page.getByRole("status", { name: "Focus timer and music" }).filter({ visible: true });
    if (!testInfo.project.use?.isMobile) {
      await expect(dock.getByText("Music", { exact: true })).toBeVisible();
    }
    await expect(page.getByLabel(/Music source:/i).filter({ visible: true })).toBeVisible();
    await expect(page.getByLabel(/Show .* options/i).filter({ visible: true })).toBeVisible();
    await expect(page.getByLabel(/Play ambient sound|Open player|Play /i).filter({ visible: true }).first()).toBeVisible();
  });

  test("track name opens the in-source picker", async ({ page }) => {
    const title = page.getByLabel(/Show .* options/i).filter({ visible: true });
    await expect(title).toBeVisible();
    expect(
      await title.evaluate((el) => {
        const span = el.querySelector("span");
        return span ? span.scrollWidth > span.clientWidth + 1 : false;
      }),
    ).toBe(false);
    await title.click();
    const picker = page.getByRole("dialog", { name: "Music player" });
    await expect(picker).toBeVisible();
    await expectUnclipped(picker);
    await expect(picker.getByLabel("Play Rain")).toBeVisible();
    await expect(picker.getByLabel("Play Café")).toBeVisible();
    await picker.getByLabel("Play Brown Noise").click();
    await page.getByLabel("Hide music options").click();
    const brownNoiseChip = page.getByLabel(/Show .*Brown Noise options/i).filter({ visible: true });
    await expect(brownNoiseChip).toBeVisible();
    expect(
      await brownNoiseChip.evaluate((el) => {
        const span = el.querySelector("span");
        return span ? span.scrollWidth > span.clientWidth + 1 : false;
      }),
    ).toBe(false);
  });

  test("switching music source keeps the strip width", async ({ page }, testInfo) => {
    test.skip(!!testInfo.project.use?.isMobile, "source menu is clipped on the compact focus strip");
    const strip = page.locator("[data-foci-music-strip]").filter({ visible: true });
    const before = await strip.boundingBox();
    expect(before).toBeTruthy();
    for (const source of ["Spotify", "SoundCloud", "Sounds"] as const) {
      await page.getByLabel(/Music source:/i).filter({ visible: true }).click({ force: true });
      await page.getByRole("option", { name: source }).click();
      const after = await strip.boundingBox();
      expect(after).toBeTruthy();
      expect(Math.abs((after?.width ?? 0) - (before?.width ?? 0))).toBeLessThan(2);
    }
  });

  test("music source menu lists Sounds, Spotify, and SoundCloud", async ({ page }, testInfo) => {
    test.skip(!!testInfo.project.use?.isMobile, "source menu is clipped on the compact focus strip");
    await page.getByLabel(/Music source:/i).filter({ visible: true }).click({ force: true });
    const menu = page.getByRole("listbox", { name: "Music sources" });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveCSS("position", "fixed");
    const box = await menu.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThan(80);
    await expect(menu.getByRole("option", { name: "Sounds" })).toBeVisible();
    await expect(menu.getByRole("option", { name: "Spotify" })).toBeVisible();
    await expect(menu.getByRole("option", { name: "SoundCloud" })).toBeVisible();
    await expect(menu.getByRole("option", { name: "Lo-fi" })).toHaveCount(0);
    await expectUnclipped(menu);
  });

  test("Spotify play starts the selected playlist without opening the picker", async ({ page }, testInfo) => {
    test.skip(!!testInfo.project.use?.isMobile, "source menu is clipped on the compact focus strip");
    await page.getByLabel(/Music source:/i).filter({ visible: true }).click({ force: true });
    await page.getByRole("option", { name: "Spotify" }).click();
    await expect(page.locator("[data-foci-spotify-embed] iframe")).toBeAttached({ timeout: 15_000 });

    await page.getByLabel(/Play Peaceful Meditation/i).click();
    await expect(page.getByRole("dialog", { name: "Music player" })).toHaveCount(0);
    await expect(page.getByLabel(/Pause Peaceful Meditation/i).first()).toBeVisible({ timeout: 10_000 });

    await page.getByLabel(/Show Peaceful Meditation options/i).click();
    const picker = page.getByRole("dialog", { name: "Music player" });
    await expect(picker).toBeVisible();
    await expect(picker.getByText("Peaceful Meditation")).toBeVisible();
    await expect(picker.locator("iframe")).toHaveCount(0);
  });

  test("timer expand panel is not clipped by the header", async ({ page }) => {
    await page.getByLabel("Expand focus timer").filter({ visible: true }).click();
    const panel = page.getByRole("dialog", { name: "Focus timer" });
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS("position", "fixed");
    await expectUnclipped(panel);
    await expect(panel.getByLabel("Timer alarm sound")).toBeVisible();
  });

  test("can open settings panel", async ({ page }) => {
    await page.getByLabel("Task panel menu").click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.getByLabel("Work minutes")).toBeVisible();
    await expect(page.getByLabel("Work seconds")).toBeVisible();
  });

  test("layout is responsive - mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/app");
    await waitForBoot(page);
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
