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
    ? "text-orange-500 dark:text-orange-400"
    : "text-emerald-950 dark:text-emerald-200";
  const periodNumClass = empty
    ? "text-slate-500 dark:text-slate-400"
    : "text-emerald-900 dark:text-emerald-300";
  const periodLabelClass = empty
    ? "font-medium text-slate-500 dark:text-slate-400"
    : "font-medium text-emerald-900 dark:text-emerald-300/90";
  const tone = empty
    ? "border-slate-300/90 dark:border-[#2a3f5f] bg-slate-50/90 dark:bg-[#131d30]/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
    : "border-emerald-600 dark:border-emerald-600/80 bg-emerald-300 dark:bg-emerald-950/55 text-emerald-950 dark:text-emerald-200 hover:bg-emerald-400 dark:hover:bg-emerald-900/60";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 min-h-[2.25rem] rounded-lg text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 transition-all border ${tone} ${
        pulse ? "ring-2 ring-emerald-500/50 dark:ring-emerald-400/60 scale-[1.03]" : ""
      } ${className}`}
      title="Jump to Done today"
      aria-label={ariaLabel}
      data-done-today-tally
    >
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      <span className="hidden sm:inline">
        <span className={todayNumClass}>{count}</span> done today
      </span>
      <span className="sm:hidden">
        <span className={todayNumClass}>{count}</span> done
      </span>
      <span className={periodLabelClass}>
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
