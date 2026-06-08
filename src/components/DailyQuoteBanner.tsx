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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 sm:gap-x-3 min-w-0">
          <div className="min-w-0 flex-1 overflow-hidden">
            <WeatherTime compact sessions={sessions} />
          </div>
          {hasFocusStrip && (
            <div className="flex-[1.35] min-w-[16rem] sm:min-w-[22rem] rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90 shadow-sm px-2 py-1 max-w-full [&:has([aria-expanded=true])]:basis-full [&:has([aria-expanded=true])]:w-full [&:has([aria-expanded=true])]:flex-none">
              <div className="flex items-center w-full min-h-[2.25rem] gap-3 sm:gap-4">
                {timerToolbar && (
                  <div className="flex-1 flex justify-center min-w-0">{timerToolbar}</div>
                )}
                {timerToolbar && musicToolbar && (
                  <div
                    className="w-px self-stretch min-h-[1.75rem] bg-slate-200/90 dark:bg-slate-700/70 shrink-0"
                    aria-hidden
                  />
                )}
                {musicToolbar && <div className="shrink-0">{musicToolbar}</div>}
              </div>
            </div>
          )}
        </div>
        {timerPanel}
      </div>
    </div>
  );
}
