import { createPrivateKey, sign } from "node:crypto";

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getCredentials(): { clientEmail: string; privateKey: string } {
  const jsonRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (jsonRaw) {
    const parsed = JSON.parse(jsonRaw) as { client_email?: string; private_key?: string };
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
    throw new Error("Missing GA_CLIENT_EMAIL + GA_PRIVATE_KEY (or GOOGLE_APPLICATION_CREDENTIALS_JSON)");
  }
  return { clientEmail, privateKey };
}

async function getAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
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
  const data = (await response.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`GA token error: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function runReport(
  token: string,
  propertyId: string,
  params: Record<string, unknown>,
): Promise<{ rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[] }> {
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
  const data = (await r.json()) as {
    error?: { message?: string };
    rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
  };
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  return data;
}

function metric(row: { metricValues?: { value: string }[] } | undefined, i: number): number {
  return Number(row?.metricValues?.[i]?.value ?? 0);
}

export type AdminGaSummary = {
  propertyId: string;
  measurementId: string;
  fetchedAt: string;
  users30d: number;
  users7d: number;
  sessions30d: number;
  pageViews30d: number;
  avgSessionSec30d: number;
  bounceRate30d: number;
  engagedSessions30d: number;
  topEvents: { name: string; count: number }[];
  topPages: { path: string; views: number; users: number }[];
  blogUsers30d: number;
  blogViews30d: number;
};

export async function fetchAdminGaSummary(): Promise<AdminGaSummary> {
  const propertyId = process.env.GA4_PROPERTY_ID || process.env.GA_PROPERTY_ID;
  if (!propertyId) {
    throw new Error("GA4_PROPERTY_ID is not set");
  }

  const { clientEmail, privateKey } = getCredentials();
  const token = await getAccessToken(clientEmail, privateKey);

  const [overview30, overview7, events, pages, blog] = await Promise.all([
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
        { name: "engagedSessions" },
      ],
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }],
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 12,
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "BEGINS_WITH", value: "/blog" },
        },
      },
    }),
  ]);

  const m30 = overview30.rows?.[0];
  const m7 = overview7.rows?.[0];
  const blogRow = blog.rows?.[0];

  return {
    propertyId,
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-726NCC1ECK",
    fetchedAt: new Date().toISOString(),
    users30d: metric(m30, 0),
    users7d: metric(m7, 0),
    sessions30d: metric(m30, 1),
    pageViews30d: metric(m30, 2),
    avgSessionSec30d: Math.round(metric(m30, 3)),
    bounceRate30d: metric(m30, 4),
    engagedSessions30d: metric(m30, 5),
    topEvents: (events.rows || []).map((r) => ({
      name: r.dimensionValues?.[0]?.value ?? "(unknown)",
      count: metric(r, 0),
    })),
    topPages: (pages.rows || []).map((r) => ({
      path: r.dimensionValues?.[0]?.value ?? "/",
      views: metric(r, 0),
      users: metric(r, 1),
    })),
    blogUsers30d: metric(blogRow, 0),
    blogViews30d: metric(blogRow, 1),
  };
}
