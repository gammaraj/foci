"use client";

import { getDailyQuote, parseQuote } from "@/lib/quotes";

export default function DailyQuoteBanner() {
  const { text, author } = parseQuote(getDailyQuote());

  return (
    <div
      className="daily-quote-banner border-b border-slate-200/80 dark:border-slate-800/80 bg-[var(--panel-header-bg)] dark:bg-[#0f172a]/60"
      role="complementary"
      aria-label="Quote of the day"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-1.5 sm:py-2">
        <p className="text-center text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2 sm:line-clamp-1">
          <span className="text-slate-400 dark:text-slate-500 mr-1" aria-hidden>
            ✦
          </span>
          <span className="italic">&ldquo;{text}&rdquo;</span>
          {author ? (
            <span className="not-italic text-slate-500 dark:text-slate-500">
              {" "}
              — {author}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
