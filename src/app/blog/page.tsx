import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getPostsBySlugs } from "@/lib/blog";
import { FEATURED_POST_SLUGS } from "@/lib/blog-seo";
import { absolutePageTitle } from "@/lib/site-metadata";
import GuideLinkHub from "@/components/GuideLinkHub";
import AppNavbar from "@/components/AppNavbar";

const title = "Blog | Flowtime, Pomodoro, Study Music & Focus Guides";
const description =
  "Free guides on the Flowtime technique, Pomodoro vs 52/17, best free Pomodoro apps, and what music helps you focus. Practical tips with tools included.";

export const metadata: Metadata = {
  title: absolutePageTitle(title),
  description,
  keywords: [
    "flowtime technique",
    "flowtime vs pomodoro",
    "52/17 rule",
    "pomodoro technique",
    "focus tips",
    "productivity guides",
    "time management",
    "study strategies",
    "deep work",
    "brown noise studying",
    "ambient sounds focus",
    "AI productivity",
    "adhd focus",
    "flowmodoro",
    "time blocking",
    "focus methods comparison",
    "pomodoro vs flowtime",
    "best pomodoro apps 2026",
    "migrate from todoist",
    "migrate from google tasks",
    "migrate from asana",
    "migrate from notion",
    "foci vs forest app",
    "foci vs todoist",
    "forest app alternatives",
    "stoicism productivity",
    "digital detox",
    "morning routine productivity",
    "task batching",
    "two minute rule",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title,
    description,
    url: "https://usefoci.com/blog",
    type: "website",
    siteName: "Foci",
    images: [
      {
        url: "https://usefoci.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Foci Blog – Focus, Productivity & Time Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://usefoci.com/twitter-image"],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const featuredPosts = getPostsBySlugs(FEATURED_POST_SLUGS);
  const featuredSlugs = new Set<string>(FEATURED_POST_SLUGS);
  const remainingPosts = posts.filter((p) => !featuredSlugs.has(p.slug));

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Foci Blog – Focus & Productivity Guides",
    itemListElement: featuredPosts.map((post, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: post.title,
      url: `https://usefoci.com/blog/${post.slug}`,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <AppNavbar />

      <main className="app-container py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Blog
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg">
          Guides on Flowtime, Pomodoro, study music, and focus — with free tools to try each method.
        </p>

        {featuredPosts.length > 0 && (
          <section className="mt-10" aria-labelledby="featured-guides-heading">
            <h2 id="featured-guides-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              Popular guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredPosts.map((post) => (
                <article
                  key={post.slug}
                  className="group border-2 border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-5 hover:shadow-md dark:hover:shadow-slate-900 transition-shadow"
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {post.description}
                    </p>
                    <span className="mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                      Read guide →
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
          All posts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {remainingPosts.map((post) => (
            <article key={post.slug} className="group border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md dark:hover:shadow-slate-900 transition-shadow">
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h2>
                <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {post.description}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span>·</span>
                  <span>{post.readingTime}</span>
                </div>
                <span className="mt-3 inline-block text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                  Read more →
                </span>
              </Link>
            </article>
          ))}
        </div>
      </main>

      <footer className="mt-auto py-8 px-4 text-center border-t border-slate-200 dark:border-slate-800">
        <GuideLinkHub variant="footer" className="mb-4" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Built for focus.</p>
      </footer>
    </div>
  );
}
