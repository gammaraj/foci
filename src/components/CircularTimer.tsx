"use client";

import React from "react";

interface CircularTimerProps {
  remainingTime: number;
  totalDuration: number;
  label: string;
  statusText: string;
  displayTime: string;
  isBreak: boolean;
  size?: "sm" | "md";
}

export default function CircularTimer({
  remainingTime,
  totalDuration,
  label,
  statusText,
  displayTime,
  isBreak,
  size = "md",
}: CircularTimerProps) {
  const circumference = 2 * Math.PI * 45;
  const progress = totalDuration > 0 ? (totalDuration - remainingTime) / totalDuration : 0;
  const offset = circumference - progress * circumference;
  const compact = size === "sm";

  return (
    <div
      className="relative mx-auto my-0"
      style={{
        width: compact ? "min(96px, 24vw)" : "min(140px, 32vw)",
        height: compact ? "min(96px, 24vw)" : "min(140px, 32vw)",
      }}
    >
      {/* SVG ring */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx="50" cy="50" r="42"
          fill={isBreak ? "rgba(16,185,129,0.08)" : "rgba(59,130,246,0.08)"}
          stroke="none"
        />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-600"
          strokeWidth="3"
          opacity="0.8"
        />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={isBreak ? "var(--success-green)" : "var(--primary-blue)"}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>

      {/* Center text overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full flex flex-col items-center justify-center text-center gap-0 bg-surface-elevated border-2 border-slate-200 dark:border-slate-600 shadow-lg px-1.5 py-1"
          style={{
            width: compact ? "min(72px, 18vw)" : "min(100px, 22vw)",
            height: compact ? "min(72px, 18vw)" : "min(100px, 22vw)",
          }}
        >
          <div
            className={`${
              compact ? "app-caption" : "text-xs sm:text-sm"
            } font-medium text-slate-700 dark:text-slate-100 leading-none truncate max-w-[88%]`}
          >
            {isBreak ? "🎉 " : ""}
            {label}
          </div>
          <div
            className={`${
              compact ? "text-base" : "text-lg sm:text-xl"
            } font-bold text-slate-900 dark:text-white leading-none tracking-tight tabular-nums my-0.5`}
          >
            {displayTime}
          </div>
          <div className="app-caption text-slate-600 dark:text-slate-200 max-w-[4.75rem] leading-snug line-clamp-2">
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}
