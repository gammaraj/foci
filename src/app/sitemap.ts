import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://usefoci.com";
  const now = new Date();

  const posts = getAllPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.75,
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
      changeFrequency: "monthly",
      priority: 0.95,
      images: [`${siteUrl}/opengraph-image`],
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
      images: [`${siteUrl}/opengraph-image`],
    },
    {
      url: `${siteUrl}/stats`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...posts,
  ];
}
