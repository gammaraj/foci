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
            <div className="w-full min-w-0 sm:flex-[1.35] md:min-w-[22rem] rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90 shadow-sm px-2 py-1.5 sm:py-1 overflow-hidden [&:has([aria-expanded=true])]:basis-full [&:has([aria-expanded=true])]:w-full [&:has([aria-expanded=true])]:flex-none">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center w-full gap-y-1.5 gap-x-3 sm:gap-4">
                {timerToolbar && (
                  <div className="order-1 w-full min-w-0 sm:flex-1 flex items-center justify-between sm:justify-center gap-1">
                    {timerToolbar}
                  </div>
                )}
                {timerToolbar && musicToolbar && (
                  <div
                    className="order-2 hidden sm:block w-px self-stretch min-h-[1.75rem] bg-slate-200/90 dark:bg-slate-700/70 shrink-0"
                    aria-hidden
                  />
                )}
                {musicToolbar && (
                  <div className="order-3 w-full min-w-0 sm:w-auto sm:shrink-0 flex items-center justify-between sm:justify-end border-t border-slate-100/90 dark:border-[#243350]/80 pt-1.5 sm:border-0 sm:pt-0">
                    {musicToolbar}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {timerPanel}
      </div>
    </div>
  );
}
