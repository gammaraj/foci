"use client";

import React from "react";
import TimerControls from "@/components/TimerControls";

interface MobileTimerBarProps {
  displayTime: string;
  isRunning: boolean;
  isBreak: boolean;
  status: string;
  activeTaskTitle?: string;
  onStartPause: () => void;
  onReset: () => void;
  onExpandTimer: () => void;
  onScrollToTasks: () => void;
}

export default function MobileTimerBar({
  displayTime,
  isRunning,
  isBreak,
  status,
  activeTaskTitle,
  onStartPause,
  onReset,
  onExpandTimer,
  onScrollToTasks,
}: MobileTimerBarProps) {
  return (
    <div
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 border-t safe-bottom ${
        isBreak
          ? "border-green-400/50 bg-green-50/95 dark:bg-[#0a1a12]/95 backdrop-blur-md"
          : "border-slate-200 dark:border-[#243350] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md"
      }`}
      role="region"
      aria-label="Timer controls"
    >
      {isBreak && (
        <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" aria-hidden="true" />
      )}
      <div className="flex items-center gap-2 px-3 py-2.5 max-w-[1280px] mx-auto">
        <button
          type="button"
          onClick={onExpandTimer}
          className={`flex flex-col min-w-0 flex-1 text-left touch-target-sm px-1 ${isBreak ? "text-green-800 dark:text-green-200" : ""}`}
        >
          <span className={`text-xl font-mono font-bold tabular-nums leading-none ${isRunning && !isBreak ? "text-blue-600 dark:text-blue-400" : isBreak ? "text-green-700 dark:text-green-300" : "text-slate-800 dark:text-slate-100"}`}>
            {displayTime}
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">
            {isBreak ? "Break time" : activeTaskTitle ? activeTaskTitle : status}
          </span>
        </button>
        <TimerControls
          isRunning={isRunning}
          onStartPause={onStartPause}
          onReset={onReset}
          compact
        />
        <button
          type="button"
          onClick={onScrollToTasks}
          className="touch-target-sm px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#1a2d4a] text-slate-700 dark:text-slate-200"
        >
          Tasks
        </button>
      </div>
    </div>
  );
}
