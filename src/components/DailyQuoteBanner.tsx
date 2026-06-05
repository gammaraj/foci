"use client";

import WeatherTime from "@/components/WeatherTime";

interface AppStatusBarProps {
  sessions: { count: number; goal: number; streak: number };
}

/** Compact utility strip: sessions, clock, weather — no quote (quote lives in tasks panel). */
export default function DailyQuoteBanner({ sessions }: AppStatusBarProps) {
  return (
    <div
      className="border-b border-slate-200/80 dark:border-slate-800/80 bg-[var(--panel-header-bg)] dark:bg-[#0f172a]/60"
      role="status"
      aria-label="Session and weather status"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-1.5 sm:py-2">
        <WeatherTime compact sessions={sessions} />
      </div>
    </div>
  );
}
