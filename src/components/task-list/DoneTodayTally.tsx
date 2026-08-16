"use client";

import React from "react";

interface DoneTodayTallyProps {
  count: number;
  weekCount?: number;
  monthCount?: number;
  pulse?: boolean;
  onClick?: () => void;
  className?: string;
  /** Tighter height for the Tasks title row — still shows today / week / month. */
  compact?: boolean;
}

/** Glanceable done progress: today · this week · this month. */
export function DoneTodayTally({
  count,
  weekCount = 0,
  monthCount = 0,
  pulse = false,
  onClick,
  className = "",
  compact = false,
}: DoneTodayTallyProps) {
  const todayLabel = count === 1 ? "1 done today" : `${count} done today`;
  const fullLabel = `${todayLabel} · ${weekCount} this week · ${monthCount} this month`;
  const empty = count <= 0 && weekCount <= 0 && monthCount <= 0;

  if (compact && empty && !pulse) return null;

  /* text-xs (12px) minimum — readable on phones; slightly larger from sm up */
  const shell = compact
    ? "inline-flex items-center gap-1 h-7 min-h-[1.75rem] px-1.5 sm:gap-1.5 sm:px-2 rounded-md text-xs sm:text-[13px] font-semibold tabular-nums whitespace-nowrap shrink-0 leading-none"
    : "inline-flex items-center gap-1.5 px-2.5 min-h-[2.25rem] rounded-lg text-xs sm:text-sm font-semibold tabular-nums whitespace-nowrap shrink-0";

  const tone = empty
    ? "border border-emerald-400/80 dark:border-emerald-500/55 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
    : "border border-emerald-500 dark:border-emerald-400/70 bg-emerald-100 dark:bg-emerald-900/55 text-emerald-950 dark:text-emerald-50 hover:bg-emerald-200/90 dark:hover:bg-emerald-800/50 shadow-sm shadow-emerald-900/10 dark:shadow-emerald-950/40";

  const num = "tabular-nums font-bold text-emerald-800 dark:text-emerald-200";
  const label = "font-medium text-emerald-700 dark:text-emerald-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${shell} ${tone} transition-[transform,box-shadow,background-color,border-color] duration-200 ${
        pulse ? "done-tally-pulse" : ""
      } ${className}`}
      title={`${fullLabel} — tap to show completed`}
      aria-label={fullLabel}
      data-done-today-tally
    >
      <svg
        className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} shrink-0 text-emerald-600 dark:text-emerald-300`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>

      {compact ? (
        <>
          {/* Phone: short labels so the pill fits beside Tasks + late */}
          <span className="sm:hidden leading-none">
            <span className={num}>{count}</span>
            <span className={label}> today</span>
            <span className={label}>
              {" "}
              · <span className={num}>{weekCount}</span> wk · <span className={num}>{monthCount}</span> mo
            </span>
          </span>
          {/* Tablet / desktop: full period words */}
          <span className="hidden sm:inline leading-none">
            <span className={num}>{count}</span>
            <span className={label}> today</span>
            <span className={label}>
              {" "}
              · <span className={num}>{weekCount}</span> this week ·{" "}
              <span className={num}>{monthCount}</span> this month
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="sm:hidden leading-none">
            <span className={num}>{count}</span>
            <span className={label}> done</span>
            <span className={label}>
              {" "}
              · <span className={num}>{weekCount}</span> wk · <span className={num}>{monthCount}</span> mo
            </span>
          </span>
          <span className="hidden sm:inline leading-none">
            <span className={num}>{count}</span>
            <span className={label}> done today</span>
            <span className={label}>
              {" "}
              · <span className={num}>{weekCount}</span> this week ·{" "}
              <span className={num}>{monthCount}</span> this month
            </span>
          </span>
        </>
      )}
    </button>
  );
}
