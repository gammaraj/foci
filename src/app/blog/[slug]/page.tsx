import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { BLOG_POST_FAQS } from "@/lib/blog-seo";
import GuideLinkHub from "@/components/GuideLinkHub";
import Navbar from "@/components/Navbar";

/** Safely serialize JSON-LD: escapes </ to prevent </script> injection. */
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const { meta } = post;
  const ogImage = `https://usefoci.com/blog/${meta.slug}/opengraph-image`;
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.tags,
    authors: [{ name: "Foci", url: "https://usefoci.com" }],
    alternates: { canonical: `/blog/${meta.slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "article",
      publishedTime: meta.date,
      url: `https://usefoci.com/blog/${meta.slug}`,
      tags: meta.tags,
      siteName: "Foci",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const { meta, content } = post;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    dateModified: meta.date,
    author: { "@type": "Organization", name: "Foci", url: "https://usefoci.com" },
    publisher: { 
      "@type": "Organization", 
      name: "Foci", 
      url: "https://usefoci.com",
      logo: {
        "@type": "ImageObject",
        url: "https://usefoci.com/logo.svg"
      }
    },
    url: `https://usefoci.com/blog/${meta.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://usefoci.com/blog/${meta.slug}`
    },
    image: {
      "@type": "ImageObject",
      url: `https://usefoci.com/blog/${meta.slug}/opengraph-image`,
      width: 1200,
      height: 630,
    },
    keywords: meta.tags.join(", "),
    inLanguage: "en-US",
    isPartOf: { "@type": "Blog", name: "Foci Blog", url: "https://usefoci.com/blog" },
    articleSection: meta.tags[0] || "Productivity",
    wordCount: content.split(/\s+/).length,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://usefoci.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://usefoci.com/blog" },
      { "@type": "ListItem", position: 3, name: meta.title, item: `https://usefoci.com/blog/${meta.slug}` },
    ],
  };

  const postFaqs = BLOG_POST_FAQS[slug];
  const faqJsonLd = postFaqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: postFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
        />
      )}
      <Navbar />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8"
        >
          ← All posts
        </Link>
        <article>
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-3">
              {meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {meta.title}
            </h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-slate-400 dark:text-slate-500">
              <time dateTime={meta.date}>
                {new Date(meta.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span>·</span>
              <span>{meta.readingTime}</span>
            </div>
          </header>

          <div className="prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline max-w-none">
            <MDXRemote source={content} />
          </div>

          {postFaqs && postFaqs.length > 0 && (
            <section className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800" aria-labelledby="post-faq-heading">
              <h2 id="post-faq-heading" className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Frequently asked questions
              </h2>
              <dl className="space-y-4">
                {postFaqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="text-base font-semibold text-slate-900 dark:text-white">{faq.question}</dt>
                    <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <GuideLinkHub excludeSlug={slug} variant="compact" className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800" />

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-6 text-center">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Put these ideas into practice
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Foci is a free focus timer and task manager — no sign-up required.
              </p>
              <Link
                href="/app"
                className="inline-flex items-center justify-center mt-4 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Try Foci free
              </Link>
            </div>
          </div>

          {/* Related posts */}
          {(() => {
            const related = getRelatedPosts(slug, 3);
            if (related.length === 0) return null;
            return (
              <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                  Related articles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {related.map((rp) => (
                    <Link
                      key={rp.slug}
                      href={`/blog/${rp.slug}`}
                      className="group block p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md dark:hover:shadow-slate-900 transition-shadow"
                    >
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {rp.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {rp.description}
                      </p>
                      <span className="mt-2 inline-block text-xs text-slate-400 dark:text-slate-500">
                        {rp.readingTime}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </article>
        </div>
      </main>

      <footer className="mt-auto py-8 px-4 text-center border-t border-slate-200 dark:border-slate-800">
        <GuideLinkHub variant="footer" className="mb-4" />
        <p className="text-xs text-slate-400 dark:text-slate-600">Built for focus. Free forever.</p>
      </footer>
    </div>
  );
}
