import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "893d4c6a-a4f4-4215-829e-df8b4dd1a1f6";
const SITE_URL = "https://usefoci.com";
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

interface IndexNowRequest {
  url?: string;
  urls?: string[];
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.INDEXNOW_API_SECRET;
  if (!secret) {
    // In production, require a secret; allow open access in dev only
    return process.env.NODE_ENV === "development";
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const headerSecret = request.headers.get("x-indexnow-secret");
  return headerSecret === secret;
}

/**
 * POST /api/indexnow
 * Submit URL(s) to IndexNow API for instant search engine indexing.
 * Requires INDEXNOW_API_SECRET (Bearer token or x-indexnow-secret header).
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request.headers);
  if ((await rateLimit(`indexnow:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)).limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body: IndexNowRequest = await request.json();

    const urlList = body.urls || (body.url ? [body.url] : []);

    if (urlList.length === 0) {
      return NextResponse.json(
        { error: "No URLs provided. Include 'url' or 'urls' in request body." },
        { status: 400 },
      );
    }

    if (urlList.length > 10000) {
      return NextResponse.json(
        { error: "Too many URLs. Maximum 10,000 per request." },
        { status: 400 },
      );
    }

    const invalidUrls = urlList.filter((url) => !url.startsWith(SITE_URL));
    if (invalidUrls.length > 0) {
      return NextResponse.json(
        { error: "All URLs must belong to the configured domain", invalidUrls },
        { status: 400 },
      );
    }

    const payload = {
      host: "usefoci.com",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    };

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        submitted: urlList.length,
        urls: urlList,
      });
    }

    return NextResponse.json(
      {
        error: "IndexNow submission failed",
        status: response.status,
      },
      { status: response.status },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
