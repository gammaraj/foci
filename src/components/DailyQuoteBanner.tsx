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
      className="border-b border-slate-200/90 dark:border-[#243350] bg-[var(--panel-header-bg)] dark:bg-[#0f172a]/80 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.12)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)]"
      role="status"
      aria-label="Weather and focus timer"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-1.5 sm:py-2 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-y-1.5 gap-x-3 min-w-0">
          <div className="min-w-0 sm:flex-1 flex items-stretch">
            <WeatherTime compact />
          </div>
          {hasFocusStrip && (
            <div className="w-full min-w-0 sm:flex-1 flex rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90 shadow-sm overflow-hidden min-h-[3.5rem]">
              <div
                className={`grid min-w-0 flex-1 ${
                  timerToolbar && musicToolbar
                    ? "grid-cols-1 sm:grid-cols-2 sm:divide-x divide-slate-100/90 dark:divide-[#243350]/80"
                    : "grid-cols-1"
                }`}
              >
                {timerToolbar && (
                  <div className="min-w-0 flex flex-col px-3 border-b sm:border-b-0 border-slate-100/90 dark:border-[#243350]/80">
                    <div className="flex items-center min-h-[3.5rem] w-full">{timerToolbar}</div>
                    {timerPanel}
                  </div>
                )}
                {musicToolbar && (
                  <div className="min-w-0 flex items-center px-3 min-h-[3.5rem]">{musicToolbar}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
