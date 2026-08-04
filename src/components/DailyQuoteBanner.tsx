"use client";

import React from "react";

interface AppStatusBarProps {
  /** Compact focus timer controls. */
  timerToolbar?: React.ReactNode;
  /** Ambient music mini player — always visible beside the timer. */
  musicToolbar?: React.ReactNode;
  /** Expandable focus timer panel below the focus strip. */
  timerPanel?: React.ReactNode;
  /** Whether the timer detail panel is expanded below the toolbar row. */
  timerPanelExpanded?: boolean;
  /** Collapse timer panel (mobile / hide extras). */
  onCollapseAll?: () => void;
  /**
   * `standalone` — separate strip under the navbar (legacy).
   * `embedded` — sits in the Tasks header middle (single row).
   */
  variant?: "standalone" | "embedded";
}

/**
 * Focus strip: music + timer.
 * Embedded variant is a compact inline cluster for the Tasks title row.
 */
export default function DailyQuoteBanner({
  timerToolbar,
  musicToolbar,
  timerPanel,
  timerPanelExpanded = false,
  onCollapseAll,
  variant = "standalone",
}: AppStatusBarProps) {
  const hasMusic = !!musicToolbar;
  const embedded = variant === "embedded";

  if (embedded) {
    return (
      <div
        id="focus-dock"
        className="no-print flex items-center justify-between sm:justify-center gap-2 sm:gap-2.5 min-w-0 w-full max-w-full relative"
        role="status"
        aria-label="Focus timer and music"
      >
        {hasMusic && (
          <div className="min-w-0 flex-1 sm:flex-initial sm:shrink flex items-center gap-1 rounded-lg border border-slate-200/90 dark:border-[#2a3f5f] bg-slate-50/80 dark:bg-[#0f172a]/55 px-1.5 py-1 sm:py-0.5">
            <span className="app-section-label text-slate-400 dark:text-slate-500 leading-none shrink-0 hidden xl:inline pr-0.5">
              Music
            </span>
            {musicToolbar}
          </div>
        )}
        {hasMusic && (
          <div
            className="w-px self-stretch min-h-[2rem] sm:min-h-0 sm:h-7 bg-slate-300 dark:bg-[#3a5070] shrink-0 opacity-90"
            aria-hidden
          />
        )}
        <div className="relative flex items-center min-w-0 flex-1 sm:flex-initial sm:shrink-0 justify-end sm:justify-start rounded-lg border border-slate-200/90 dark:border-[#2a3f5f] bg-slate-50/80 dark:bg-[#0f172a]/55 px-1.5 py-1 sm:py-0.5">
          <span className="app-section-label text-slate-400 dark:text-slate-500 leading-none shrink-0 hidden xl:inline pr-0.5">
            Timer
          </span>
          {timerToolbar}
          {timerPanel}
        </div>
      </div>
    );
  }

  const grid = (
    <div
      className={`grid min-w-0 ${
        hasMusic
          ? "grid-cols-1 sm:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] sm:divide-x status-strip-divider"
          : "grid-cols-1"
      }`}
    >
      {hasMusic && (
        <div className="status-strip-zone status-strip-zone--side min-w-0 flex flex-col px-2.5 sm:px-3 justify-center border-b sm:border-b-0 status-strip-divider">
          {musicToolbar}
        </div>
      )}

      <div className="status-strip-zone status-strip-zone--focus min-w-0 flex flex-col px-2.5 sm:px-3">
        <div className="flex items-center min-h-[2.75rem] w-full min-w-0">
          <div className="flex-1 min-w-0">{timerToolbar}</div>
        </div>
        {timerPanel}
      </div>
    </div>
  );

  return (
    <div className="status-strip" role="status" aria-label="Focus timer and music">
      <div className="app-container py-0.5 sm:py-1">
        <div className="status-strip-card w-full min-w-0 flex flex-col overflow-visible">
          {grid}

          {timerPanelExpanded && onCollapseAll && (
            <button
              type="button"
              onClick={onCollapseAll}
              className="sm:hidden flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-800/70 dark:text-slate-400 border-t status-strip-divider hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Collapse timer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
