"use client";

import React from "react";

import { doneMascotCaption } from "@/lib/done-today";
import { FociDoneMascot } from "@/components/task-list/FociDoneMascot";

interface DoneTodayTallyProps {
  count: number;
  weekCount?: number;
  monthCount?: number;
  idleDays?: number | null;
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
  idleDays = null,
  pulse = false,
  onClick,
  className = "",
  compact = false,
}: DoneTodayTallyProps) {
  const todayLabel = count === 1 ? "1 done today" : `${count} done today`;
  const fullLabel = `${todayLabel} · ${weekCount} this week · ${monthCount} this month`;
  const mascotCaption = doneMascotCaption(count, idleDays);
  const empty = count <= 0 && weekCount <= 0 && monthCount <= 0;

  /* text-xs (12px) minimum — readable on phones; slightly larger from sm up */
  const shell = compact
    ? "inline-flex items-center gap-1 h-7 min-h-[1.75rem] px-1.5 sm:gap-1.5 sm:px-2 rounded-md text-xs sm:text-[13px] font-semibold tabular-nums whitespace-nowrap shrink-0 leading-none"
    : "inline-flex items-center gap-1.5 px-2.5 min-h-[2.25rem] rounded-lg text-xs sm:text-sm font-semibold tabular-nums whitespace-nowrap shrink-0";

  const tone = empty
    ? "border border-emerald-400/80 dark:border-emerald-500/55 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
    : "border border-emerald-500 dark:border-emerald-400/70 bg-emerald-100 dark:bg-emerald-900/55 text-emerald-950 dark:text-emerald-50 hover:bg-emerald-200/90 dark:hover:bg-emerald-800/50 shadow-sm shadow-emerald-900/10 dark:shadow-emerald-950/40";

  const liveNum = "tabular-nums font-bold text-emerald-800 dark:text-emerald-200";
  const zeroNum = "tabular-nums font-bold text-slate-500 dark:text-slate-400";
  const liveLabel = "font-medium text-emerald-700 dark:text-emerald-300";
  const zeroLabel = "font-medium text-slate-500 dark:text-slate-400";
  const sep = "font-medium text-slate-400 dark:text-slate-500";
  const numClass = (n: number) => (n > 0 ? liveNum : zeroNum);
  const labelClass = (n: number) => (n > 0 ? liveLabel : zeroLabel);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${shell} ${tone} transition-[transform,box-shadow,background-color,border-color] duration-200 ${
        pulse ? "done-tally-pulse" : ""
      } ${className}`}
      title={`${fullLabel} — ${mascotCaption}. Tap to show completed`}
      aria-label={`${fullLabel}. ${mascotCaption}`}
      data-done-today-tally
      data-tour="done-tally"
    >
      <FociDoneMascot
        todayCount={count}
        idleDays={idleDays}
        size={compact ? 16 : 18}
      />

      {compact ? (
        <>
          {/* Phone: short labels so the pill fits beside Tasks + late */}
          <span className="sm:hidden leading-none">
            <span className={numClass(count)}>{count}</span>
            <span className={labelClass(count)}> today</span>
            <span className={sep}> · </span>
            <span className={numClass(weekCount)}>{weekCount}</span>
            <span className={labelClass(weekCount)}> wk</span>
            <span className={sep}> · </span>
            <span className={numClass(monthCount)}>{monthCount}</span>
            <span className={labelClass(monthCount)}> mo</span>
          </span>
          {/* Tablet / desktop: full period words */}
          <span className="hidden sm:inline leading-none">
            <span className={numClass(count)}>{count}</span>
            <span className={labelClass(count)}> today</span>
            <span className={sep}> · </span>
            <span className={numClass(weekCount)}>{weekCount}</span>
            <span className={labelClass(weekCount)}> this week</span>
            <span className={sep}> · </span>
            <span className={numClass(monthCount)}>{monthCount}</span>
            <span className={labelClass(monthCount)}> this month</span>
          </span>
        </>
      ) : (
        <>
          <span className="sm:hidden leading-none">
            <span className={numClass(count)}>{count}</span>
            <span className={labelClass(count)}> done</span>
            <span className={sep}> · </span>
            <span className={numClass(weekCount)}>{weekCount}</span>
            <span className={labelClass(weekCount)}> wk</span>
            <span className={sep}> · </span>
            <span className={numClass(monthCount)}>{monthCount}</span>
            <span className={labelClass(monthCount)}> mo</span>
          </span>
          <span className="hidden sm:inline leading-none">
            <span className={numClass(count)}>{count}</span>
            <span className={labelClass(count)}> done today</span>
            <span className={sep}> · </span>
            <span className={numClass(weekCount)}>{weekCount}</span>
            <span className={labelClass(weekCount)}> this week</span>
            <span className={sep}> · </span>
            <span className={numClass(monthCount)}>{monthCount}</span>
            <span className={labelClass(monthCount)}> this month</span>
          </span>
        </>
      )}
    </button>
  );
}
