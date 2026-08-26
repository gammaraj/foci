import { test, expect, type Page } from "@playwright/test";
import { waitForBoot } from "./wait-for-boot";

function banner(page: Page) {
  return page.getByRole("banner");
}

/** Compact viewports hide Blog/About behind the hamburger. */
async function expandNavIfCollapsed(page: Page) {
  const toggle = banner(page).getByRole("button", { name: "Toggle menu" });
  if (await toggle.isVisible()) {
    await toggle.click();
  }
}

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await waitForBoot(page);
  });

  test("renders login page with sign-in text", async ({ page }) => {
    await expect(page.getByText("Sign in to sync your tasks")).toBeVisible();
  });

  test("renders auth form with email input", async ({ page }) => {
    const emailInput = page.getByRole("textbox").or(page.locator('input[type="email"]')).first();
    await expect(emailInput).toBeVisible();
  });

  test("has navbar", async ({ page }) => {
    await expect(page.getByText("Foci").first()).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("navbar logo links to home", async ({ page }) => {
    await page.goto("/blog");
    await waitForBoot(page);
    const logoLink = page.locator("a").filter({ hasText: "Foci" }).first();
    await expect(logoLink).toHaveAttribute("href", "/");
  });

  test("navbar shows Blog and About for logged-out visitors", async ({ page }) => {
    await page.goto("/");
    await waitForBoot(page);
    await expandNavIfCollapsed(page);
    const nav = banner(page);
    await expect(nav.getByRole("link", { name: "Features" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Install" })).toHaveCount(0);
    const blogLink = nav.getByRole("link", { name: "Blog" });
    await expect(blogLink).toBeVisible();
    await expect(blogLink).toHaveAttribute("href", "/blog");
    const aboutLink = nav.getByRole("link", { name: "About" });
    await expect(aboutLink).toBeVisible();
    await expect(aboutLink).toHaveAttribute("href", "/about");
    await expect(nav.getByRole("link", { name: "Stats" })).toHaveCount(0);
  });

  test("Blog link in navbar navigates to blog page", async ({ page }) => {
    await page.goto("/");
    await waitForBoot(page);
    await expandNavIfCollapsed(page);
    await banner(page).getByRole("link", { name: "Blog" }).click();
    await expect(page).toHaveURL(/\/blog/);
  });

  test("theme toggle button is accessible", async ({ page }) => {
    await page.goto("/");
    await waitForBoot(page);
    const themeBtn = banner(page)
      .getByRole("button", { name: /switch to (light|dark) mode/i })
      .filter({ visible: true });
    await expect(themeBtn).toBeVisible();
    const before = await themeBtn.getAttribute("aria-label");
    await themeBtn.click();
    await expect(themeBtn).toBeVisible();
    await expect(themeBtn).not.toHaveAttribute("aria-label", before ?? "");
  });

  test("mobile menu toggle works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await waitForBoot(page);

    await expect(page.getByText("Foci").first()).toBeVisible();
    await expect(banner(page).getByRole("button", { name: "Toggle menu" })).toBeVisible();
  });
});

test.describe("Page Load Performance", () => {
  test("landing page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("app page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("stats page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/stats", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("blog page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});

test.describe("SEO & Meta", () => {
  test("landing page has correct title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.toLowerCase()).toContain("foci");
  });

  test("blog page has correct title", async ({ page }) => {
    await page.goto("/blog");
    const title = await page.title();
    expect(title.toLowerCase()).toContain("blog");
  });

  test("landing page has meta description", async ({ page }) => {
    await page.goto("/");
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveAttribute("content", /.+/);
  });

  test("robots.txt is accessible", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
  });

  test("ads.txt is accessible for AdSense verification", async ({ page }) => {
    const response = await page.goto("/ads.txt");
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain("pub-9368411015963509");
  });

  test("sitemap.xml is accessible", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
  });

  test("manifest.json is accessible", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
  });
});
