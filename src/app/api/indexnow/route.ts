import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = "893d4c6a-a4f4-4215-829e-df8b4dd1a1f6";
const SITE_URL = "https://usefoci.com";

interface IndexNowRequest {
  url?: string;
  urls?: string[];
}

/**
 * POST /api/indexnow
 * Submit URL(s) to IndexNow API for instant search engine indexing
 * 
 * Supported by: Bing, Yandex, Naver, Seznam.cz
 * 
 * Body:
 * - url: string (single URL to submit)
 * - urls: string[] (multiple URLs to submit, max 10,000)
 */
export async function POST(request: NextRequest) {
  try {
    const body: IndexNowRequest = await request.json();
    
    // Validate input
    const urlList = body.urls || (body.url ? [body.url] : []);
    
    if (urlList.length === 0) {
      return NextResponse.json(
        { error: "No URLs provided. Include 'url' or 'urls' in request body." },
        { status: 400 }
      );
    }

    if (urlList.length > 10000) {
      return NextResponse.json(
        { error: "Too many URLs. Maximum 10,000 per request." },
        { status: 400 }
      );
    }

    // Validate URLs belong to our domain
    const invalidUrls = urlList.filter((url) => !url.startsWith(SITE_URL));
    if (invalidUrls.length > 0) {
      return NextResponse.json(
        { error: "All URLs must belong to the configured domain", invalidUrls },
        { status: 400 }
      );
    }

    // Submit to IndexNow
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

    // Handle non-200 responses
    const errorText = await response.text();
    return NextResponse.json(
      {
        error: "IndexNow submission failed",
        status: response.status,
        details: errorText,
      },
      { status: response.status }
    );
  } catch (error) {
    console.error("IndexNow API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
