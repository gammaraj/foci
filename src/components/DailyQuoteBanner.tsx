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
  const threeColumnStrip = hasFocusStrip && timerToolbar && musicToolbar;

  return (
    <div
      className="border-b border-slate-200/90 dark:border-[#243350] bg-[var(--panel-header-bg)] dark:bg-[#0f172a]/80 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.12)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)]"
      role="status"
      aria-label="Weather and focus timer"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-1.5 sm:py-2 space-y-1.5">
        {threeColumnStrip ? (
          <div
            className="grid min-w-0 grid-cols-1 sm:grid-cols-[2.5fr_3.5fr_4fr] sm:items-start rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90 shadow-sm overflow-visible divide-y sm:divide-y-0 sm:divide-x divide-slate-100/90 dark:divide-[#243350]/80"
          >
            <div className="min-w-0 px-2.5 sm:px-3 flex items-center min-h-[3.5rem]">
              <WeatherTime compact embedded />
            </div>
            <div className="min-w-0 flex flex-col px-2.5 sm:px-3 border-b sm:border-b-0 border-slate-100/90 dark:border-[#243350]/80">
              <div className="flex items-center min-h-[3.5rem] w-full shrink-0">{timerToolbar}</div>
              {timerPanel}
            </div>
            <div className="min-w-0 flex flex-col px-2.5 sm:px-3 pb-2 overflow-x-auto">
              {musicToolbar}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:grid sm:grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)] sm:items-stretch gap-y-1.5 gap-x-2.5 min-w-0">
            <div className="min-w-0 sm:max-w-[11.5rem] flex items-stretch shrink-0">
              <WeatherTime compact />
            </div>
            {hasFocusStrip && (
              <div className="w-full min-w-0 flex flex-col rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90 shadow-sm overflow-visible min-h-[3.5rem]">
                <div
                  className={`grid min-w-0 flex-1 ${
                    timerToolbar && musicToolbar
                      ? "grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:divide-x divide-slate-100/90 dark:divide-[#243350]/80"
                      : "grid-cols-1"
                  }`}
                >
                  {timerToolbar && (
                    <div className="min-w-0 flex flex-col px-2.5 sm:px-3 border-b sm:border-b-0 border-slate-100/90 dark:border-[#243350]/80">
                      <div className="flex items-center min-h-[3.5rem] w-full">{timerToolbar}</div>
                      {timerPanel}
                    </div>
                  )}
                  {musicToolbar && (
                    <div className="min-w-0 flex flex-col px-2.5 sm:px-3 pb-2 overflow-x-auto">
                      {musicToolbar}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
