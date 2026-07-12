"use client";

import React from "react";

interface DoneTodayTallyProps {
  count: number;
  pulse?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Glanceable “✓ N done” chip for the Tasks header. */
export function DoneTodayTally({
  count,
  pulse = false,
  onClick,
  className = "",
}: DoneTodayTallyProps) {
  if (count <= 0) return null;

  const label = count === 1 ? "1 done today" : `${count} done today`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 transition-all border border-emerald-300/80 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 ${
        pulse ? "ring-2 ring-emerald-400/60 scale-[1.03]" : ""
      } ${className}`}
      title="Jump to Done today"
      aria-label={label}
      data-done-today-tally
    >
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{count} done</span>
    </button>
  );
}
