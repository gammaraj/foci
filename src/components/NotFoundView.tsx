import Link from "next/link";
import { BusyBeaver } from "@/components/BusyBeaver";
import { getPostsBySlugs } from "@/lib/blog";
import { FEATURED_POST_SLUGS } from "@/lib/blog-seo";

/** Shared 404 body. `embedded` sits under workspace chrome without a second full-viewport center. */
export function NotFoundView({ embedded = false }: { embedded?: boolean }) {
  const posts = getPostsBySlugs(FEATURED_POST_SLUGS).slice(0, 3);

  return (
    <div
      className={
        embedded
          ? "flex flex-col items-center px-4 pt-10 pb-16 sm:pt-14 text-center"
          : "flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0f1a] px-4 py-12 text-center"
      }
    >
      <BusyBeaver alt="Beavy the Beaver looking lost" size={embedded ? 112 : 140} className="mb-5" priority />
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg max-w-md">
        Beavy chewed through every link. Still no page — just woodchips.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/app/cards" className="btn-primary px-5 py-2.5 text-sm">
          {embedded ? "Back to Tasks" : "Try Foci — free"}
        </Link>
        <Link href="/" className="btn-ghost px-5 py-2.5 text-sm">
          Back to Home
        </Link>
      </div>

      {posts.length > 0 && (
        <section
          className="mt-12 w-full max-w-3xl text-left"
          aria-labelledby="not-found-reads-heading"
        >
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2
              id="not-found-reads-heading"
              className="app-section-label text-slate-400 dark:text-slate-500"
            >
              While Beavy rebuilds the dam
            </h2>
            <Link
              href="/blog"
              className="shrink-0 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              All posts →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group border border-slate-200 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700/60 transition-colors"
              >
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                  {post.readingTime && (
                    <span className="mt-2 inline-block text-xs text-slate-400 dark:text-slate-500">
                      {post.readingTime}
                    </span>
                  )}
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
