import Link from "next/link";
import type { CompareLanding } from "@/lib/compare-landings";
import { SITE_URL } from "@/lib/product-facts";

function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export default function CompareLandingView({ page }: { page: CompareLanding }) {
  const path = page.kind === "vs" ? `/vs/${page.slug}` : `/alternatives/${page.slug}`;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: page.kind === "vs" ? "Comparisons" : "Alternatives",
        item: page.kind === "vs" ? `${SITE_URL}/vs/${page.slug}` : `${SITE_URL}/alternatives/${page.slug}`,
      },
      { "@type": "ListItem", position: 3, name: page.h1, item: `${SITE_URL}${path}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <article className="max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
          {page.kind === "vs" ? "Comparison" : "Alternatives"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          {page.h1}
        </h1>
        <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{page.answer}</p>

        <ul className="mt-8 list-disc pl-5 space-y-2 text-base text-slate-600 dark:text-slate-400">
          {page.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        {page.faqs.length > 0 && (
          <section className="mt-12 space-y-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">FAQ</h2>
            {page.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold text-slate-900 dark:text-white">{faq.question}</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </section>
        )}

        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <Link
            href="/app"
            className="btn-primary px-6 py-3 text-sm"
          >
            Try Foci — free
          </Link>
          <Link
            href={`/blog/${page.blogSlug}`}
            className="btn-chip px-6 py-3 text-sm"
          >
            {page.blogLabel}
          </Link>
        </div>
      </article>
    </>
  );
}
