"use client";

import React from "react";
import WeatherTime from "@/components/WeatherTime";

interface AppStatusBarProps {
  sessions: { count: number; goal: number; streak: number };
  /** Compact timer toolbar (right side of status row). */
  timerToolbar?: React.ReactNode;
  /** Expandable timer + music panel below the status row. */
  timerPanel?: React.ReactNode;
}

/** Utility strip: sessions, clock, weather, and compact focus timer dock. */
export default function DailyQuoteBanner({ sessions, timerToolbar, timerPanel }: AppStatusBarProps) {
  return (
    <div
      className="border-b border-slate-200/80 dark:border-slate-800/80 bg-[var(--panel-header-bg)] dark:bg-[#0f172a]/60"
      role="status"
      aria-label="Session, weather, and focus timer"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-1.5 sm:py-2">
        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <WeatherTime compact sessions={sessions} />
          </div>
          {timerToolbar}
        </div>
        {timerPanel}
      </div>
    </div>
  );
}
