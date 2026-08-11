#!/usr/bin/env node
/**
 * Notify IndexNow (Bing, Yandex, etc.) about core + blog + evergreen URLs.
 * Run after deploy or when publishing posts:
 *   INDEXNOW_API_SECRET=... npm run notify:indexnow
 */

import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://usefoci.com";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "893d4c6a-a4f4-4215-829e-df8b4dd1a1f6";

const postsDir = path.join(process.cwd(), "content", "posts");
const slugs = fs
  .readdirSync(postsDir)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => f.replace(/\.mdx$/, ""));

const vs = ["forest", "todoist", "focusatwill"];
const alternatives = ["forest", "pomodoro-apps", "focus-apps-for-students"];

const urls = [
  SITE_URL,
  `${SITE_URL}/app`,
  `${SITE_URL}/blog`,
  `${SITE_URL}/about`,
  `${SITE_URL}/feed.xml`,
  `${SITE_URL}/llms.txt`,
  `${SITE_URL}/llms-full.txt`,
  ...vs.map((s) => `${SITE_URL}/vs/${s}`),
  ...alternatives.map((s) => `${SITE_URL}/alternatives/${s}`),
  ...slugs.map((s) => `${SITE_URL}/blog/${s}`),
];

const secret = process.env.INDEXNOW_API_SECRET;
let response;

if (secret) {
  response = await fetch(`${SITE_URL}/api/indexnow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ urls }),
  });
} else {
  response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "usefoci.com",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
}

if (!response.ok) {
  const text = await response.text().catch(() => "");
  console.error(`IndexNow failed (${response.status}): ${text}`);
  process.exit(1);
}

console.log(`IndexNow notified for ${urls.length} URLs.`);
