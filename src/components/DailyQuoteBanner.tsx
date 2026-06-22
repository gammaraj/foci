"use client";

import React, { useEffect, useState } from "react";
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

  // Mobile: collapsed by default so tasks are immediately visible.
  // Persisted across page loads.
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("foci-status-expanded");
    if (saved === "1") setMobileExpanded(true);
  }, []);

  const toggleMobile = () => {
    const next = !mobileExpanded;
    setMobileExpanded(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("foci-status-expanded", next ? "1" : "0");
    }
  };

  // Chevron toggle button rendered inside the strip
  const CollapseToggle = ({ className = "" }: { className?: string }) => (
    <button
      type="button"
      onClick={toggleMobile}
      className={`sm:hidden flex-shrink-0 p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8 transition-all ${className}`}
      aria-label={mobileExpanded ? "Collapse status bar" : "Expand status bar"}
      title={mobileExpanded ? "Collapse" : "Show weather & music"}
    >
      <svg
        className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileExpanded ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <div
      className="status-strip"
      role="status"
      aria-label="Weather and focus timer"
    >
      <div className="app-container py-1.5 sm:py-2 space-y-1.5">
        {threeColumnStrip ? (
          <div
            className="grid min-w-0 grid-cols-1 sm:grid-cols-[2.5fr_3.5fr_4fr] sm:items-stretch rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90 shadow-sm overflow-visible divide-y sm:divide-y-0 sm:divide-x divide-slate-100/90 dark:divide-[#243350]/80"
          >
            {/* Weather row — hidden on mobile when collapsed */}
            <div className={`min-w-0 px-3 sm:px-4 flex items-center min-h-[3.5rem] ${mobileExpanded ? "" : "hidden sm:flex"}`}>
              <WeatherTime compact embedded />
            </div>
            {/* Timer row — always visible on mobile; carries the toggle chevron */}
            <div className="min-w-0 flex flex-col px-3 sm:px-4">
              <div className="flex items-center min-h-[3.5rem] w-full shrink-0 gap-1">
                <div className="flex-1 min-w-0">{timerToolbar}</div>
                <CollapseToggle />
              </div>
              {timerPanel}
            </div>
            {/* Music row — hidden on mobile when collapsed */}
            <div className={`min-w-0 flex flex-col px-3 sm:px-4 overflow-x-auto bg-slate-50/50 dark:bg-white/[0.018] rounded-br-xl ${mobileExpanded ? "" : "hidden sm:flex"}`}>
              {musicToolbar}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:grid sm:grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)] sm:items-stretch gap-y-1.5 gap-x-2.5 min-w-0">
            <div className={`min-w-0 sm:max-w-[11.5rem] flex items-stretch shrink-0 ${mobileExpanded ? "" : "hidden sm:flex"}`}>
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
                    <div className={`min-w-0 flex flex-col px-2.5 sm:px-3 ${musicToolbar ? "border-b sm:border-b-0 border-slate-100/90 dark:border-[#243350]/80" : ""}`}>
                      <div className="flex items-center min-h-[3.5rem] w-full gap-1">
                        <div className="flex-1 min-w-0">{timerToolbar}</div>
                        {musicToolbar && <CollapseToggle />}
                      </div>
                      {timerPanel}
                    </div>
                  )}
                  {musicToolbar && (
                    <div className={`min-w-0 flex flex-col px-2.5 sm:px-3 pb-2 overflow-x-auto ${mobileExpanded ? "" : "hidden sm:flex"}`}>
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
