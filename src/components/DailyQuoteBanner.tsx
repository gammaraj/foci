"use client";

import React from "react";

interface AppStatusBarProps {
  /** Compact focus timer controls. */
  timerToolbar?: React.ReactNode;
  /** Ambient music mini player — always visible beside the timer. */
  musicToolbar?: React.ReactNode;
  /** Expandable focus timer panel below the focus strip. */
  timerPanel?: React.ReactNode;
}

/**
 * Focus strip: music + timer.
 * Compact inline cluster for the Tasks title row.
 */
export default function DailyQuoteBanner({
  timerToolbar,
  musicToolbar,
  timerPanel,
}: AppStatusBarProps) {
  const hasMusic = !!musicToolbar;

  return (
    <div
      id="focus-dock"
      className="no-print flex items-center justify-center gap-5 min-w-0 w-full max-w-full relative"
      role="status"
      aria-label="Focus timer and music"
    >
      {hasMusic && (
        <div className="shrink-0 flex items-center gap-1 overflow-visible">
          {musicToolbar}
        </div>
      )}
      {hasMusic && (
        <div
          className="w-px h-4 bg-slate-200 dark:bg-[#2a3f5f] shrink-0 mx-1"
          aria-hidden
        />
      )}
      <div className="relative flex items-center gap-1 min-w-0 shrink-0 overflow-visible">
        {timerToolbar}
        {timerPanel}
      </div>
    </div>
  );
}
