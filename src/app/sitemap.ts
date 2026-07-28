import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://usefoci.com";
  const now = new Date();
  const productRefresh = new Date("2026-07-27");

  const allPosts = getAllPosts();
  const mostRecentPostDate = allPosts.length > 0
    ? new Date(Math.max(...allPosts.map((p) => new Date(p.date).getTime())))
    : now;
  const siteContentDate = new Date(
    Math.max(mostRecentPostDate.getTime(), productRefresh.getTime(), now.getTime()),
  );

  // Bump priority for comparison/review posts and migration guides that target high-intent queries
  const comparisonSlugs = new Set([
    "foci-vs-forest-app",
    "foci-vs-todoist",
    "foci-vs-focusatwill",
    "forest-app-alternatives",
    "best-free-pomodoro-apps-2026",
    "best-focus-apps-for-students-2026",
    "how-to-focus-while-working-from-home",
    "white-noise-vs-brown-noise-for-focus",
    "migrate-from-todoist-to-foci",
    "migrate-from-google-tasks-to-foci",
    "migrate-from-asana-to-foci",
    "migrate-from-notion-to-foci",
    "pomodoro-technique-guide",
    "pomodoro-vs-flowtime-vs-52-17",
    "flowtime-technique-guide",
    "52-17-rule-guide",
    "best-music-for-studying-and-focus",
    "how-to-stop-procrastinating",
    "deep-work-in-the-age-of-ai",
  ]);

  const posts = allPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: comparisonSlugs.has(post.slug) ? 0.85 : 0.75,
    images: [`${siteUrl}/blog/${post.slug}/opengraph-image`],
  }));

  return [
    {
      url: siteUrl,
      lastModified: siteContentDate,
      changeFrequency: "weekly",
      priority: 1.0,
      images: [`${siteUrl}/opengraph-image`],
    },
    {
      url: `${siteUrl}/app`,
      lastModified: siteContentDate,
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
      url: `${siteUrl}/about`,
      lastModified: siteContentDate,
      changeFrequency: "monthly",
      priority: 0.8,
      images: [`${siteUrl}/opengraph-image`],
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: siteContentDate,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: siteContentDate,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/llms.txt`,
      lastModified: siteContentDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/llms-full.txt`,
      lastModified: siteContentDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...posts,
  ];
}
