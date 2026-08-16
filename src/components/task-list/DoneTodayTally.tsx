"use client";

import React from "react";
import { STATUS_PILL_COMPACT } from "@/components/task-list/TaskUrgencySummary";

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
  const ariaLabel = `${todayLabel}, ${weekCount} this week, ${monthCount} this month`;
  const empty = count <= 0 && weekCount <= 0 && monthCount <= 0;
  // Green = completion cue. Soft when empty (invite), stronger when you've shipped.
  const todayNumClass = empty
    ? "text-emerald-600/80 dark:text-emerald-400/85"
    : "text-emerald-700 dark:text-emerald-300";
  const periodNumClass = empty
    ? "text-emerald-700/70 dark:text-emerald-400/70"
    : "text-emerald-700/90 dark:text-emerald-300/90";
  const mutedSepClass = empty
    ? "text-emerald-600/55 dark:text-emerald-500/55"
    : "text-emerald-600/70 dark:text-emerald-400/60";
  const checkClass = empty
    ? "text-emerald-500 dark:text-emerald-400"
    : "text-emerald-600 dark:text-emerald-300";
  const tone = empty
    ? "border-emerald-300/70 dark:border-emerald-700/50 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/35"
    : "border-emerald-400/80 dark:border-emerald-600/55 bg-emerald-100/95 dark:bg-emerald-950/55 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-200/90 dark:hover:bg-emerald-900/45 shadow-sm shadow-emerald-900/5 dark:shadow-emerald-950/30";
  const pulseRing = pulse ? "ring-2 ring-emerald-400/60 scale-[1.03]" : "";

  if (compact && empty && !pulse) return null;

  const shell = compact
    ? `${STATUS_PILL_COMPACT} gap-1 border ${tone} ${pulseRing}`
    : `inline-flex items-center gap-1.5 px-2.5 min-h-[2.25rem] rounded-lg text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 transition-all border ${tone} ${pulseRing}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${shell} ${className}`}
      title={`${todayLabel} · ${weekCount} this week · ${monthCount} this month — tap to show completed`}
      aria-label={ariaLabel}
      data-done-today-tally
    >
      <svg
        className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} shrink-0 ${checkClass}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      {compact ? (
        <span className="leading-none">
          <span className={`tabular-nums font-bold ${todayNumClass}`}>{count}</span>
          <span className={mutedSepClass}> today</span>
          <span className={`font-medium ${mutedSepClass}`}>
            {" "}
            · <span className={`tabular-nums font-bold ${periodNumClass}`}>{weekCount}</span> this week ·{" "}
            <span className={`tabular-nums font-bold ${periodNumClass}`}>{monthCount}</span> this month
          </span>
        </span>
      ) : (
        <>
          <span className="hidden sm:inline">
            <span className={todayNumClass}>{count}</span> done today
          </span>
          <span className="sm:hidden">
            <span className={todayNumClass}>{count}</span> done
          </span>
          <span className={`font-medium ${mutedSepClass}`}>
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
        </>
      )}
    </button>
  );
}
