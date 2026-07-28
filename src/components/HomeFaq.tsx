import { HOME_FAQS } from "@/lib/home-faqs";

/** Visible homepage FAQ — must stay in sync with FAQPage JSON-LD for AEO. */
export default function HomeFaq() {
  return (
    <section className="w-full max-w-3xl mx-auto pb-12 sm:pb-20" aria-labelledby="home-faq-heading">
      <h2 id="home-faq-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
        Frequently asked questions
      </h2>
      <p className="text-center text-base text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
        Straight answers about Foci — free to use, available worldwide.
      </p>
      <dl className="space-y-3">
        {HOME_FAQS.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-xl border border-slate-200 dark:border-[#1e3355] bg-white dark:bg-[#0f1b33] px-5 py-4 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none flex items-start justify-between gap-3 text-left text-base font-semibold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
              <span>{faq.question}</span>
              <span
                className="mt-0.5 flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <dd className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{faq.answer}</dd>
          </details>
        ))}
      </dl>
    </section>
  );
}
