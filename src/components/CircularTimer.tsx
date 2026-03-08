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
    <div className="relative mx-auto my-2" style={{ width: 'min(280px, 55vw)', height: 'min(280px, 55vw)' }}>
      {/* SVG ring */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx="50" cy="50" r="42"
          fill={isBreak ? "rgba(5,150,105,0.06)" : "rgba(37,99,235,0.06)"}
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
          className="rounded-full flex flex-col items-center justify-center text-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 shadow-lg"
          style={{ width: 'min(200px, 40vw)', height: 'min(200px, 40vw)' }}
        >
          <div className="text-base font-bold mb-1 text-gray-700 dark:text-gray-200">
            {isBreak ? "🎉 " : ""}
            {label}
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">
            {displayTime}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}
