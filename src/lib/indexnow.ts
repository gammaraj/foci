/**
 * IndexNow utility functions for instant search engine indexing.
 * Supports: Bing, Yandex, Naver, Seznam.cz
 */

const SITE_URL = "https://usefoci.com";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "893d4c6a-a4f4-4215-829e-df8b4dd1a1f6";

function getIndexNowHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const secret = process.env.INDEXNOW_API_SECRET;
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }
  return headers;
}

async function submitToIndexNowApi(urlList: string[]): Promise<Response> {
  const secret = process.env.INDEXNOW_API_SECRET;

  // Server-side with secret: call IndexNow directly
  if (secret && typeof window === "undefined") {
    return fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "usefoci.com",
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
  }

  // Otherwise use the protected app API route
  const base =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL
      : "";
  return fetch(`${base}/api/indexnow`, {
    method: "POST",
    headers: getIndexNowHeaders(),
    body: JSON.stringify(urlList.length === 1 ? { url: urlList[0] } : { urls: urlList }),
  });
}

/**
 * Submit a single URL to IndexNow for instant indexing
 */
export async function submitUrlToIndexNow(
  url: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!url.startsWith(SITE_URL)) {
      return { success: false, error: "URL must belong to usefoci.com domain" };
    }

    const response = await submitToIndexNowApi([url]);

    if (response.ok) {
      return { success: true };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: (errorData as { error?: string }).error || "Submission failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Submit multiple URLs to IndexNow for instant indexing
 */
export async function submitUrlsToIndexNow(
  urls: string[],
): Promise<{ success: boolean; error?: string; submitted?: number }> {
  try {
    if (urls.length === 0) {
      return { success: false, error: "No URLs provided" };
    }

    if (urls.length > 10000) {
      return { success: false, error: "Maximum 10,000 URLs per request" };
    }

    const invalidUrls = urls.filter((url) => !url.startsWith(SITE_URL));
    if (invalidUrls.length > 0) {
      return {
        success: false,
        error: `${invalidUrls.length} URL(s) do not belong to usefoci.com domain`,
      };
    }

    const response = await submitToIndexNowApi(urls);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        submitted: (data as { submitted?: number }).submitted ?? urls.length,
      };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: (errorData as { error?: string }).error || "Submission failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function notifyBlogPost(
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  return submitUrlToIndexNow(`${SITE_URL}/blog/${slug}`);
}

export async function notifyBlogPosts(
  slugs: string[],
): Promise<{ success: boolean; error?: string; submitted?: number }> {
  const urls = slugs.map((slug) => `${SITE_URL}/blog/${slug}`);
  return submitUrlsToIndexNow(urls);
}

export async function notifyCorePages(): Promise<{
  success: boolean;
  error?: string;
  submitted?: number;
}> {
  const urls = [
    SITE_URL,
    `${SITE_URL}/app`,
    `${SITE_URL}/blog`,
    `${SITE_URL}/about`,
    `${SITE_URL}/feed.xml`,
    `${SITE_URL}/vs/forest`,
    `${SITE_URL}/vs/todoist`,
    `${SITE_URL}/vs/focusatwill`,
    `${SITE_URL}/alternatives/forest`,
    `${SITE_URL}/alternatives/pomodoro-apps`,
    `${SITE_URL}/alternatives/focus-apps-for-students`,
    `${SITE_URL}/llms.txt`,
    `${SITE_URL}/llms-full.txt`,
  ];
  return submitUrlsToIndexNow(urls);
}
