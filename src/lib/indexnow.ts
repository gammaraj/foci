/**
 * IndexNow utility functions for instant search engine indexing
 * Supports: Bing, Yandex, Naver, Seznam.cz
 */

const SITE_URL = "https://usefoci.com";

/**
 * Submit a single URL to IndexNow for instant indexing
 * @param url - Full URL to submit (must start with SITE_URL)
 * @returns Promise with submission result
 */
export async function submitUrlToIndexNow(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!url.startsWith(SITE_URL)) {
      return { success: false, error: "URL must belong to usefoci.com domain" };
    }

    const response = await fetch("/api/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      return { success: true };
    }

    const errorData = await response.json();
    return { success: false, error: errorData.error || "Submission failed" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Submit multiple URLs to IndexNow for instant indexing
 * @param urls - Array of full URLs to submit (max 10,000)
 * @returns Promise with submission result
 */
export async function submitUrlsToIndexNow(urls: string[]): Promise<{ success: boolean; error?: string; submitted?: number }> {
  try {
    if (urls.length === 0) {
      return { success: false, error: "No URLs provided" };
    }

    if (urls.length > 10000) {
      return { success: false, error: "Maximum 10,000 URLs per request" };
    }

    const invalidUrls = urls.filter((url) => !url.startsWith(SITE_URL));
    if (invalidUrls.length > 0) {
      return { success: false, error: `${invalidUrls.length} URL(s) do not belong to usefoci.com domain` };
    }

    const response = await fetch("/api/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, submitted: data.submitted };
    }

    const errorData = await response.json();
    return { success: false, error: errorData.error || "Submission failed" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Notify search engines about a new blog post
 * @param slug - Blog post slug (e.g., "pomodoro-technique-guide")
 */
export async function notifyBlogPost(slug: string): Promise<{ success: boolean; error?: string }> {
  const url = `${SITE_URL}/blog/${slug}`;
  return submitUrlToIndexNow(url);
}

/**
 * Notify search engines about multiple blog posts
 * @param slugs - Array of blog post slugs
 */
export async function notifyBlogPosts(slugs: string[]): Promise<{ success: boolean; error?: string; submitted?: number }> {
  const urls = slugs.map((slug) => `${SITE_URL}/blog/${slug}`);
  return submitUrlsToIndexNow(urls);
}

/**
 * Notify search engines about updated core pages
 */
export async function notifyCorePages(): Promise<{ success: boolean; error?: string; submitted?: number }> {
  const urls = [
    SITE_URL,
    `${SITE_URL}/app`,
    `${SITE_URL}/blog`,
  ];
  return submitUrlsToIndexNow(urls);
}
