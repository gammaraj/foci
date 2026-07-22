"use client";

import { getDailyQuote, parseQuote } from "@/lib/quotes";

interface TaskPanelQuoteProps {
  variant?: "inline" | "hero" | "navbar";
}

/** Daily quote — shown in the tasks panel header row. */
export default function TaskPanelQuote({ variant = "inline" }: TaskPanelQuoteProps) {
  const { text, author } = parseQuote(getDailyQuote());

  if (variant === "navbar") {
    return (
      <p
        className="w-full text-xs sm:text-sm italic text-slate-700 dark:text-slate-300/90 leading-none whitespace-nowrap truncate text-center min-w-0"
        role="complementary"
        aria-label="Quote of the day"
        title={author ? `${text} — ${author}` : text}
      >
        &ldquo;{text}&rdquo;
        {author ? (
          <span className="font-normal not-italic text-slate-500 dark:text-slate-400/80"> — {author}</span>
        ) : null}
      </p>
    );
  }

  if (variant === "hero") {
    return (
      <div className="hidden sm:block text-center px-4 py-6 mb-4 rounded-xl bg-slate-50/80 dark:bg-[#131d30]/50 border border-slate-100 dark:border-[#1e3050]">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Quote of the day
        </p>
        <p className="text-base sm:text-lg italic text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
          &ldquo;{text}&rdquo;
        </p>
        {author ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">— {author}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="hidden sm:block px-3 sm:px-5 py-2 text-center"
      role="complementary"
      aria-label="Quote of the day"
    >
      <p className="text-sm italic text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 max-w-xl mx-auto">
        &ldquo;{text}&rdquo;
        {author ? (
          <span className="font-normal not-italic text-slate-500 dark:text-slate-400"> — {author}</span>
        ) : null}
      </p>
    </div>
  );
}
