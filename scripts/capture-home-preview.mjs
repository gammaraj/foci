/** Refresh public/home-app-preview.webp from the guest cards board (dev server on :3000). */
import sharp from "sharp";
import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "public/home-app-preview.webp");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1023, height: 1100 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
await context.addInitScript(() => {
  localStorage.setItem("foci_theme", "dark");
  localStorage.setItem("foci_onboarding_done", "1");
  localStorage.setItem("foci_whats_new_seen", "2026-08-d");
  localStorage.setItem("foci_guest_sample_banner_dismissed", "1");
  localStorage.setItem("foci_first_session_nudge_dismissed", "1");
});

const page = await context.newPage();
await page.goto("http://localhost:3000/app/cards", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.getByText("Grocery list").first().waitFor({ timeout: 20_000 });
await page.getByText("Bucket list").first().waitFor();
await page.getByText("Draft design mockups").first().waitFor();
await page.getByText("High", { exact: true }).first().waitFor({ timeout: 8_000 });
await page.getByText("Weekly", { exact: true }).first().waitFor({ timeout: 8_000 });
await page.keyboard.press("Escape");
await page.addStyleTag({
  content: "nextjs-portal, [data-next-badge-root], #__next-build-watcher { display: none !important; }",
});
await page.waitForTimeout(400);

const header = page.locator("[data-tour='one-thing']").first();
const lastCard = page.locator("[data-project-card-id]").last();
const main = page.locator("#main-content");
await header.waitFor();
await lastCard.waitFor();

const [headerBox, cardBox, mainBox] = await Promise.all([
  header.boundingBox(),
  lastCard.boundingBox(),
  main.boundingBox(),
]);
if (!headerBox || !cardBox || !mainBox) throw new Error("Missing board bounds");

const padTop = 8;
const padBottom = 16;
const clip = {
  x: mainBox.x,
  y: Math.max(0, headerBox.y - padTop),
  width: mainBox.width,
  height: cardBox.y + cardBox.height - (headerBox.y - padTop) + padBottom,
};

const buf = await page.screenshot({ type: "png", animations: "disabled", clip });
await browser.close();

const webp = await sharp(buf).resize({ width: 1536 }).webp({ quality: 84 }).toBuffer();
const meta = await sharp(webp).metadata();
await writeFile(out, webp);
console.log(JSON.stringify({ width: meta.width, height: meta.height, bytes: webp.length }));
