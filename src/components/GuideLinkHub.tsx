import Link from "next/link";
import { GUIDE_HUB_LINKS, type GuideLink } from "@/lib/blog-seo";

interface GuideLinkHubProps {
  /** Hide this slug from the list (current article). */
  excludeSlug?: string;
  /** Visual density. */
  variant?: "full" | "compact" | "footer";
  className?: string;
}

function filterLinks(excludeSlug?: string): GuideLink[] {
  return GUIDE_HUB_LINKS.filter((link) => link.slug !== excludeSlug);
}

export default function GuideLinkHub({
  excludeSlug,
  variant = "full",
  className = "",
}: GuideLinkHubProps) {
  const links = filterLinks(excludeSlug);
  if (links.length === 0) return null;

  if (variant === "footer") {
    return (
      <nav
        aria-label="Focus and productivity guides"
        className={`flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm ${className}`}
      >
        {links.map((link) => (
          <Link
            key={link.slug}
            href={`/blog/${link.slug}`}
            className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    );
  }

  if (variant === "compact") {
    return (
      <section className={className} aria-labelledby="guide-hub-compact-heading">
        <h2 id="guide-hub-compact-heading" className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          More focus guides
        </h2>
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.slug}>
              <Link
                href={`/blog/${link.slug}`}
                className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className={className} aria-labelledby="guide-hub-heading">
      <h2 id="guide-hub-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
        Focus technique guides
      </h2>
      <p className="text-center text-base text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
        Free, in-depth guides on Flowtime, Pomodoro, study music, and the best focus apps — with tools to try each method.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Link
            key={link.slug}
            href={`/blog/${link.slug}`}
            className="group block p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1b33] hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-md transition-all"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {link.label}
            </h3>
            {link.description ? (
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {link.description}
              </p>
            ) : null}
            <span className="mt-2 inline-block text-sm font-medium text-cyan-600 dark:text-cyan-400 group-hover:underline">
              Read guide →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
