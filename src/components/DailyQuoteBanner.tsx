"use client";

import { getDailyQuote, parseQuote } from "@/lib/quotes";
import WeatherTime from "@/components/WeatherTime";

interface DailyQuoteBannerProps {
  sessions: { count: number; goal: number; streak: number };
}

export default function DailyQuoteBanner({ sessions }: DailyQuoteBannerProps) {
  const { text, author } = parseQuote(getDailyQuote());

  return (
    <div
      className="daily-quote-banner border-b border-slate-200/80 dark:border-slate-800/80 bg-[var(--panel-header-bg)] dark:bg-[#0f172a]/60"
      role="complementary"
      aria-label="Status and quote of the day"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="shrink-0">
          <WeatherTime compact sessions={sessions} />
        </div>
        <p className="flex-1 min-w-0 text-right sm:text-center text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-snug truncate">
          <span className="text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline" aria-hidden>
            ✦
          </span>
          <span className="italic">&ldquo;{text}&rdquo;</span>
          {author ? (
            <span className="not-italic text-slate-500 dark:text-slate-500 hidden md:inline">
              {" "}
              — {author}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
