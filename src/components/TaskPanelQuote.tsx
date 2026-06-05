"use client";

import { getDailyQuote, parseQuote } from "@/lib/quotes";

interface TaskPanelQuoteProps {
  variant?: "inline" | "hero";
}

/** Daily quote — shown in the tasks panel, not mixed with status utilities. */
export default function TaskPanelQuote({ variant = "inline" }: TaskPanelQuoteProps) {
  const { text, author } = parseQuote(getDailyQuote());

  if (variant === "hero") {
    return (
      <div className="text-center px-4 py-6 mb-4 rounded-xl bg-slate-50/80 dark:bg-[#131d30]/50 border border-slate-100 dark:border-[#1e3050]">
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
      className="px-3 sm:px-5 py-2 text-center"
      role="complementary"
      aria-label="Quote of the day"
    >
      <p className="text-xs font-light italic text-slate-400/90 dark:text-slate-500/75 leading-relaxed line-clamp-2 max-w-xl mx-auto">
        &ldquo;{text}&rdquo;
        {author ? (
          <span className="font-normal not-italic text-slate-400/70 dark:text-slate-500/60"> — {author}</span>
        ) : null}
      </p>
    </div>
  );
}
