#!/usr/bin/env node
/**
 * Foci GA4 Data API report (last 30 days + last 7 days active users).
 *
 * Setup (once):
 * 1. GA4 Admin → Property settings → copy numeric Property ID
 * 2. Create a GCP service account with Viewer on that GA4 property
 * 3. Put in `.env.local` (never commit):
 *      GA4_PROPERTY_ID=123456789
 *      GA_CLIENT_EMAIL=…@….iam.gserviceaccount.com
 *      GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"
 *    Or: GOOGLE_APPLICATION_CREDENTIALS_JSON='{"client_email":"…","private_key":"…"}'
 *
 * Run: npm run report:ga
 *   or: node --env-file=.env.local scripts/ga-report.mjs
 */

import { createPrivateKey, sign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    for (const raw of readFileSync(path, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getCredentials() {
  const jsonRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (jsonRaw) {
    const parsed = JSON.parse(jsonRaw);
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON missing client_email or private_key");
    }
    return {
      clientEmail: parsed.client_email,
      privateKey: String(parsed.private_key).replace(/\\n/g, "\n"),
    };
  }

  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing GA credentials. Set GA_CLIENT_EMAIL + GA_PRIVATE_KEY (or GOOGLE_APPLICATION_CREDENTIALS_JSON) in .env.local — see docs/GA4-SETUP.md",
    );
  }
  return { clientEmail, privateKey };
}

async function getAccessToken(clientEmail, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: clientEmail,
      sub: clientEmail,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
    }),
  );
  const unsigned = `${header}.${payload}`;
  const key = createPrivateKey(privateKeyPem);
  const signature = sign("RSA-SHA256", Buffer.from(unsigned), key);
  const jwt = `${unsigned}.${signature.toString("base64url")}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await response.json();
  if (!data.access_token) {
    throw new Error(`Token error: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function runReport(token, propertyId, params) {
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    },
  );
  const data = await r.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  return data;
}

function metric(row, i) {
  return row?.metricValues?.[i]?.value ?? "0";
}

async function main() {
  loadEnvFiles();

  const propertyId = process.env.GA4_PROPERTY_ID || process.env.GA_PROPERTY_ID;
  if (!propertyId) {
    throw new Error(
      "Set GA4_PROPERTY_ID (numeric GA4 property id) in .env.local — Admin → Property settings",
    );
  }

  const { clientEmail, privateKey } = getCredentials();
  const token = await getAccessToken(clientEmail, privateKey);

  console.log("\n📊 FOCI GA4 ANALYTICS REPORT\n");
  console.log(`Property ${propertyId} · measurement ${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-726NCC1ECK"}`);
  console.log("=".repeat(70));

  const overview30 = await runReport(token, propertyId, {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
      { name: "newUsers" },
      { name: "engagedSessions" },
    ],
  });
  const overview7 = await runReport(token, propertyId, {
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
  });

  const m30 = overview30.rows?.[0];
  const m7 = overview7.rows?.[0];
  console.log("\n📈 OVERVIEW (30 days):");
  console.log("   Active Users:      " + metric(m30, 0));
  console.log("   Sessions:          " + metric(m30, 1));
  console.log("   Page Views:        " + metric(m30, 2));
  console.log("   Avg Duration:      " + Math.round(parseFloat(metric(m30, 3))) + "s");
  console.log("   Bounce Rate:       " + (parseFloat(metric(m30, 4)) * 100).toFixed(1) + "%");
  console.log("   New Users:         " + metric(m30, 5));
  console.log("   Engaged Sessions:  " + metric(m30, 6));
  console.log("\n📅 LAST 7 DAYS:");
  console.log("   Active Users:      " + metric(m7, 0));
  console.log("   Sessions:          " + metric(m7, 1));

  const events = await runReport(token, propertyId, {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 20,
  });
  console.log("\n🎯 TOP EVENTS (30 days):");
  for (const [i, row] of (events.rows || []).entries()) {
    const name = row.dimensionValues[0].value.padEnd(32);
    console.log(`   ${i + 1}. ${name} | ${row.metricValues[0].value}`);
  }

  const pages = await runReport(token, propertyId, {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 12,
  });
  console.log("\n📄 TOP PAGES:");
  for (const [i, row] of (pages.rows || []).entries()) {
    const path = row.dimensionValues[0].value.substring(0, 40).padEnd(40);
    const views = row.metricValues[0].value.padStart(5);
    const users = row.metricValues[1].value.padStart(4);
    console.log(`   ${i + 1}. ${path} | ${views} views | ${users} users`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("Paste 30d / 7d active users into docs/PORTFOLIO.md (and filantus PORTFOLIO.md).\n");
}

main().catch((e) => {
  console.error("Error:", e.message || e);
  process.exit(1);
});
