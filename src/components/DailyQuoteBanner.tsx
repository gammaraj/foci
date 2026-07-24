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
}

/**
 * Focus strip: music (primary) + timer side by side.
 * Weather lives in the navbar so it doesn’t compete with focus controls.
 */
export default function DailyQuoteBanner({
  timerToolbar,
  musicToolbar,
  timerPanel,
  timerPanelExpanded = false,
  onCollapseAll,
}: AppStatusBarProps) {
  const hasMusic = !!musicToolbar;

  return (
    <div className="status-strip" role="status" aria-label="Focus timer and music">
      <div className="app-container py-0.5 sm:py-1">
        <div className="status-strip-card w-full min-w-0 flex flex-col overflow-visible">
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
