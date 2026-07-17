"use client";

import React, { useEffect, useState } from "react";
import WeatherTime from "@/components/WeatherTime";

interface AppStatusBarProps {
  /** Compact focus timer controls. */
  timerToolbar?: React.ReactNode;
  /** Ambient music — shown when the focus panel is expanded. */
  musicToolbar?: React.ReactNode;
  /** Expandable focus timer panel below the focus strip. */
  timerPanel?: React.ReactNode;
  /** Whether the timer detail panel is expanded below the toolbar row. */
  timerPanelExpanded?: boolean;
  /** Collapse timer panel + other expanded status UI (mobile). */
  onCollapseAll?: () => void;
}

/**
 * Focus-first status strip: timer is always visible; weather and music
 * stay behind expand so they don't compete with the task workspace.
 */
export default function DailyQuoteBanner({
  timerToolbar,
  musicToolbar,
  timerPanel,
  timerPanelExpanded = false,
  onCollapseAll,
}: AppStatusBarProps) {
  const [weatherExpanded, setWeatherExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("foci-status-expanded");
    if (saved === "1") setWeatherExpanded(true);
    else if (saved === "0") setWeatherExpanded(false);
  }, []);

  const persistWeather = (next: boolean) => {
    setWeatherExpanded(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("foci-status-expanded", next ? "1" : "0");
    }
  };

  const collapseAll = () => {
    persistWeather(false);
    onCollapseAll?.();
  };

  const showExtras = weatherExpanded || timerPanelExpanded;

  return (
    <div className="status-strip" role="status" aria-label="Focus timer">
      <div className="app-container py-0.5 sm:py-1 space-y-1">
        <div className="status-strip-card w-full min-w-0 flex flex-col rounded-lg overflow-visible">
          <div className="status-strip-zone status-strip-zone--focus min-w-0 flex flex-col px-2.5 sm:px-3">
            <div className="flex items-center min-h-[2.75rem] w-full gap-1.5">
              <div className="flex-1 min-w-0">{timerToolbar}</div>
              <button
                type="button"
                onClick={() => {
                  if (showExtras) collapseAll();
                  else persistWeather(true);
                }}
                className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8 transition-all"
                aria-label={showExtras ? "Collapse focus extras" : "Show weather"}
                title={showExtras ? "Hide weather & extras" : "Show weather"}
                aria-expanded={showExtras}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${showExtras ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {timerPanel}
          </div>

          {/* Music stays mounted so playback continues when the panel collapses */}
          {musicToolbar && (
            <div
              className={`status-strip-zone status-strip-zone--side min-w-0 px-2.5 sm:px-3 border-t status-strip-divider ${
                timerPanelExpanded ? "py-2" : "hidden"
              }`}
              aria-hidden={!timerPanelExpanded}
            >
              {musicToolbar}
            </div>
          )}

          {weatherExpanded && (
            <div className="status-strip-zone status-strip-zone--side min-w-0 px-2.5 sm:px-3 py-2 border-t status-strip-divider flex items-center">
              <WeatherTime compact embedded />
            </div>
          )}

          {showExtras && (
            <button
              type="button"
              onClick={collapseAll}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-800/70 dark:text-slate-400 border-t status-strip-divider hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Hide extras
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
