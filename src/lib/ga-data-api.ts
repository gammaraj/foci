import { createPrivateKey, sign } from "node:crypto";
import { ALL_ADMIN_SIGNAL_EVENTS } from "@/lib/admin-ga-signals";

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

export type GaSignalCount = {
  event: string;
  count30d: number;
  count7d: number;
};

export type GaChannelRow = {
  channel: string;
  sessions: number;
  users: number;
};

export type GaDailyRow = {
  date: string;
  users: number;
  sessions: number;
};

export type GaContentSegment = {
  segment: string;
  users: number;
  views: number;
};

export type AdminGaSummary = {
  propertyId: string;
  measurementId: string;
  fetchedAt: string;
  users30d: number;
  users7d: number;
  usersPrior7d: number;
  newUsers30d: number;
  sessions30d: number;
  sessions7d: number;
  pageViews30d: number;
  pageViews7d: number;
  avgSessionSec30d: number;
  bounceRate30d: number;
  engagedSessions30d: number;
  engagementRate30d: number;
  topEvents: { name: string; count: number }[];
  topPages: { path: string; views: number; users: number }[];
  blogUsers30d: number;
  blogViews30d: number;
  signalCounts: GaSignalCount[];
  channels: GaChannelRow[];
  devices: GaChannelRow[];
  dailyUsers: GaDailyRow[];
  contentSegments: GaContentSegment[];
};

export async function fetchAdminGaSummary(): Promise<AdminGaSummary> {
  const propertyId = process.env.GA4_PROPERTY_ID || process.env.GA_PROPERTY_ID;
  if (!propertyId) {
    throw new Error("GA4_PROPERTY_ID is not set");
  }

  const { clientEmail, privateKey } = getCredentials();
  const token = await getAccessToken(clientEmail, privateKey);

  const signalEventFilter = {
    filter: {
      fieldName: "eventName",
      inListFilter: {
        values: [...ALL_ADMIN_SIGNAL_EVENTS],
      },
    },
  };

  const [
    overview30,
    overview7,
    overviewPrior7,
    overview7Metrics,
    events,
    pages,
    blog,
    signals,
    channels,
    devices,
    daily,
    appSeg,
    statsSeg,
    homeSeg,
    seoSeg,
  ] = await Promise.all([
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
        { name: "engagedSessions" },
        { name: "newUsers" },
      ],
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }],
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "14daysAgo", endDate: "8daysAgo" }],
      metrics: [{ name: "activeUsers" }],
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
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
    runReport(token, propertyId, {
      dateRanges: [
        { startDate: "30daysAgo", endDate: "today" },
        { startDate: "7daysAgo", endDate: "today" },
      ],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: signalEventFilter,
      limit: 50,
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 5,
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "13daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "BEGINS_WITH", value: "/app" },
        },
      },
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "BEGINS_WITH", value: "/stats" },
        },
      },
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "EXACT", value: "/" },
        },
      },
    }),
    runReport(token, propertyId, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      dimensionFilter: {
        orGroup: {
          expressions: [
            {
              filter: {
                fieldName: "pagePath",
                stringFilter: { matchType: "BEGINS_WITH", value: "/vs" },
              },
            },
            {
              filter: {
                fieldName: "pagePath",
                stringFilter: { matchType: "BEGINS_WITH", value: "/alternatives" },
              },
            },
          ],
        },
      },
    }),
  ]);

  const m30 = overview30.rows?.[0];
  const m7 = overview7.rows?.[0];
  const mPrior7 = overviewPrior7.rows?.[0];
  const m7Full = overview7Metrics.rows?.[0];
  const blogRow = blog.rows?.[0];

  const signalMap = new Map<string, { count30d: number; count7d: number }>();
  for (const event of ALL_ADMIN_SIGNAL_EVENTS) {
    signalMap.set(event, { count30d: 0, count7d: 0 });
  }
  for (const row of signals.rows || []) {
    const name = row.dimensionValues?.[0]?.value;
    if (!name) continue;
    signalMap.set(name, { count30d: metric(row, 0), count7d: metric(row, 1) });
  }
  const signalCounts: GaSignalCount[] = ALL_ADMIN_SIGNAL_EVENTS.map((event) => {
    const counts = signalMap.get(event) ?? { count30d: 0, count7d: 0 };
    return { event, ...counts };
  });

  const sessions30d = metric(m30, 1);
  const engagedSessions30d = metric(m30, 5);

  return {
    propertyId,
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-726NCC1ECK",
    fetchedAt: new Date().toISOString(),
    users30d: metric(m30, 0),
    users7d: metric(m7, 0),
    usersPrior7d: metric(mPrior7, 0),
    newUsers30d: metric(m30, 6),
    sessions30d,
    sessions7d: metric(m7Full, 0),
    pageViews30d: metric(m30, 2),
    pageViews7d: metric(m7Full, 1),
    avgSessionSec30d: Math.round(metric(m30, 3)),
    bounceRate30d: metric(m30, 4),
    engagedSessions30d,
    engagementRate30d: sessions30d > 0 ? engagedSessions30d / sessions30d : 0,
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
    signalCounts,
    channels: (channels.rows || []).map((r) => ({
      channel: r.dimensionValues?.[0]?.value ?? "(unknown)",
      sessions: metric(r, 0),
      users: metric(r, 1),
    })),
    devices: (devices.rows || []).map((r) => ({
      channel: r.dimensionValues?.[0]?.value ?? "(unknown)",
      sessions: metric(r, 0),
      users: metric(r, 1),
    })),
    dailyUsers: (daily.rows || []).map((r) => ({
      date: r.dimensionValues?.[0]?.value ?? "",
      users: metric(r, 0),
      sessions: metric(r, 1),
    })),
    contentSegments: [
      {
        segment: "App (/app)",
        users: metric(appSeg.rows?.[0], 0),
        views: metric(appSeg.rows?.[0], 1),
      },
      {
        segment: "Stats (/stats)",
        users: metric(statsSeg.rows?.[0], 0),
        views: metric(statsSeg.rows?.[0], 1),
      },
      {
        segment: "Homepage (/)",
        users: metric(homeSeg.rows?.[0], 0),
        views: metric(homeSeg.rows?.[0], 1),
      },
      {
        segment: "Blog (/blog)",
        users: metric(blogRow, 0),
        views: metric(blogRow, 1),
      },
      {
        segment: "SEO (/vs, /alternatives)",
        users: metric(seoSeg.rows?.[0], 0),
        views: metric(seoSeg.rows?.[0], 1),
      },
    ],
  };
}
