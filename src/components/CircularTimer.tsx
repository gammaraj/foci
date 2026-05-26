"use client";

import React from "react";

interface CircularTimerProps {
  remainingTime: number;
  totalDuration: number;
  label: string;
  statusText: string;
  displayTime: string;
  isBreak: boolean;
}

export default function CircularTimer({
  remainingTime,
  totalDuration,
  label,
  statusText,
  displayTime,
  isBreak,
}: CircularTimerProps) {
  const circumference = 2 * Math.PI * 45;
  const progress = totalDuration > 0 ? (totalDuration - remainingTime) / totalDuration : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative mx-auto my-0" style={{ width: 'min(140px, 32vw)', height: 'min(140px, 32vw)' }}>
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
          className="rounded-full flex flex-col items-center justify-center text-center gap-0 bg-white dark:bg-[#131d30] border-2 border-slate-200 dark:border-slate-600 shadow-lg px-1.5 py-1"
          style={{ width: 'min(100px, 22vw)', height: 'min(100px, 22vw)' }}
        >
          <div className="text-[10px] sm:text-[11px] font-medium text-slate-700 dark:text-slate-100 leading-none truncate max-w-[88%]">
            {isBreak ? "🎉 " : ""}
            {label}
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-none tracking-tight tabular-nums my-0.5">
            {displayTime}
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-200 max-w-[4.75rem] leading-[1.15] line-clamp-2">
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}
