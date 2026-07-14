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
  const tone = empty
    ? "border-slate-300/90 dark:border-[#2a3f5f] bg-slate-50/90 dark:bg-[#131d30]/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
    : "border-emerald-300/80 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 transition-all border ${tone} ${
        pulse ? "ring-2 ring-emerald-400/60 scale-[1.03]" : ""
      } ${className}`}
      title="Jump to Done today"
      aria-label={ariaLabel}
      data-done-today-tally
    >
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      <span className="hidden sm:inline">{todayLabel}</span>
      <span className="sm:hidden">{count} done</span>
      <span
        className={`font-medium ${
          empty
            ? "text-slate-500 dark:text-slate-400"
            : "text-emerald-700/80 dark:text-emerald-400/85"
        }`}
      >
        <span className="hidden sm:inline">
          {" "}
          · {weekCount} this week · {monthCount} this month
        </span>
        <span className="sm:hidden">
          {" "}
          · {weekCount} this wk · {monthCount} this mo
        </span>
      </span>
    </button>
  );
}
