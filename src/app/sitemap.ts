import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://usefoci.com";
  const now = new Date();

  const allPosts = getAllPosts();
  const mostRecentPostDate = allPosts.length > 0
    ? new Date(Math.max(...allPosts.map((p) => new Date(p.date).getTime())))
    : now;

  // Bump priority for comparison/review posts that target high-intent queries
  const comparisonSlugs = new Set([
    "foci-vs-forest-app",
    "foci-vs-todoist",
    "foci-vs-focusatwill",
    "forest-app-alternatives",
    "best-free-pomodoro-apps-2026",
  ]);

  const posts = allPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: comparisonSlugs.has(post.slug) ? 0.85 : 0.75,
    images: [`${siteUrl}/opengraph-image`],
  }));

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      images: [`${siteUrl}/opengraph-image`],
    },
    {
      url: `${siteUrl}/app`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
      images: [`${siteUrl}/opengraph-image`],
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: mostRecentPostDate,
      changeFrequency: "weekly",
      priority: 0.9,
      images: [`${siteUrl}/opengraph-image`],
    },
    {
      url: `${siteUrl}/stats`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      images: [`${siteUrl}/opengraph-image`],
    },
    {
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/llms.txt`,
      lastModified: mostRecentPostDate,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/llms-full.txt`,
      lastModified: mostRecentPostDate,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...posts,
  ];
}
