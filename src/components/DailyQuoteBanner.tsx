"use client";

import React from "react";
import WeatherTime from "@/components/WeatherTime";

interface AppStatusBarProps {
  /** Compact focus timer controls. */
  timerToolbar?: React.ReactNode;
  /** Always-visible ambient music mini player. */
  musicToolbar?: React.ReactNode;
  /** Expandable focus timer panel below the focus strip. */
  timerPanel?: React.ReactNode;
}

/** Utility strip: clock, weather, and focus timer + music controls. */
export default function DailyQuoteBanner({ timerToolbar, musicToolbar, timerPanel }: AppStatusBarProps) {
  const hasFocusStrip = timerToolbar || musicToolbar;

  return (
    <div
      className="border-b border-slate-200/80 dark:border-slate-800/80 bg-[var(--panel-header-bg)] dark:bg-[#0f172a]/60"
      role="status"
      aria-label="Weather and focus timer"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-1.5 sm:py-2 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-y-1.5 gap-x-3 min-w-0">
          <div className="shrink-0 min-w-0">
            <WeatherTime compact />
          </div>
          {hasFocusStrip && (
            <div className="w-full min-w-0 sm:flex-1 rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90 shadow-sm overflow-hidden">
              <div
                className={`grid min-w-0 ${
                  timerToolbar && musicToolbar
                    ? "grid-cols-1 sm:grid-cols-2 sm:divide-x divide-slate-100/90 dark:divide-[#243350]/80"
                    : "grid-cols-1"
                }`}
              >
                {timerToolbar && (
                  <div className="min-w-0 flex flex-col px-3 py-1.5 border-b sm:border-b-0 border-slate-100/90 dark:border-[#243350]/80">
                    <div className="flex items-center min-h-[2.75rem] w-full">{timerToolbar}</div>
                    {timerPanel}
                  </div>
                )}
                {musicToolbar && (
                  <div className="min-w-0 flex flex-col px-3 py-1.5">{musicToolbar}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
