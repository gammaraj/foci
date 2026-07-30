"use client";

import React from "react";

interface DoneTodayTallyProps {
  count: number;
  weekCount?: number;
  monthCount?: number;
  pulse?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Glanceable “✓ N done today” chip for the Tasks header — always visible, with week/month progress. */
export function DoneTodayTally({
  count,
  weekCount = 0,
  monthCount = 0,
  pulse = false,
  onClick,
  className = "",
}: DoneTodayTallyProps) {
  const todayLabel = count === 1 ? "1 done today" : `${count} done today`;
  const ariaLabel = `${todayLabel}, ${weekCount} this week, ${monthCount} this month`;
  const empty = count <= 0;
  const todayNumClass = empty
    ? "text-slate-500 dark:text-slate-400"
    : "text-slate-800 dark:text-slate-100";
  const periodNumClass = "text-slate-600 dark:text-slate-300";
  const tone = empty
    ? "border-slate-200/90 dark:border-[#2a3f5f] bg-slate-50/80 dark:bg-[#131d30]/80 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
    : "border-slate-200/90 dark:border-[#2a3f5f] bg-slate-50/90 dark:bg-[#131d30]/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100/90 dark:hover:bg-[#1a2d4a]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 min-h-[2.25rem] rounded-lg text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 transition-all border ${tone} ${
        pulse ? "ring-2 ring-blue-400/50 scale-[1.03]" : ""
      } ${className}`}
      title="Jump to Done today"
      aria-label={ariaLabel}
      data-done-today-tally
    >
      <svg
        className={`w-3.5 h-3.5 shrink-0 ${empty ? "text-slate-400" : "text-blue-600 dark:text-blue-400"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      <span className="hidden sm:inline">
        <span className={todayNumClass}>{count}</span> done today
      </span>
      <span className="sm:hidden">
        <span className={todayNumClass}>{count}</span> done
      </span>
      <span className="font-medium text-slate-500 dark:text-slate-400">
        <span className="hidden sm:inline">
          {" "}
          · <span className={periodNumClass}>{weekCount}</span> this week ·{" "}
          <span className={periodNumClass}>{monthCount}</span> this month
        </span>
        <span className="sm:hidden">
          {" "}
          · <span className={periodNumClass}>{weekCount}</span> this wk ·{" "}
          <span className={periodNumClass}>{monthCount}</span> this mo
        </span>
      </span>
    </button>
  );
}
