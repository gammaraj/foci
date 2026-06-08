"use client";

import React from "react";
import WeatherTime from "@/components/WeatherTime";

interface AppStatusBarProps {
  sessions: { count: number; goal: number; streak: number };
  /** Compact focus timer controls. */
  timerToolbar?: React.ReactNode;
  /** Always-visible ambient music mini player. */
  musicToolbar?: React.ReactNode;
  /** Expandable focus timer panel below the focus strip. */
  timerPanel?: React.ReactNode;
}

/** Utility strip: sessions, clock, weather, and focus timer + music controls. */
export default function DailyQuoteBanner({ sessions, timerToolbar, musicToolbar, timerPanel }: AppStatusBarProps) {
  const hasFocusStrip = timerToolbar || musicToolbar;

  return (
    <div
      className="border-b border-slate-200/80 dark:border-slate-800/80 bg-[var(--panel-header-bg)] dark:bg-[#0f172a]/60"
      role="status"
      aria-label="Session, weather, and focus timer"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-1.5 sm:py-2 space-y-1.5">
        <WeatherTime compact sessions={sessions} />
        {hasFocusStrip && (
          <div className="flex flex-wrap items-stretch gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/50">
            {timerToolbar}
            {musicToolbar}
          </div>
        )}
        {timerPanel}
      </div>
    </div>
  );
}
