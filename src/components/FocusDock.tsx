"use client";

import React from "react";
import CircularTimer from "@/components/CircularTimer";
import TimerControls from "@/components/TimerControls";

const WORK_DURATION_PRESETS = [15, 25, 30, 45] as const;

export interface FocusDockProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  displayTime: string;
  isRunning: boolean;
  isBreak: boolean;
  readyToFocus: boolean;
  activeTaskId: string | null;
  activeTaskTitle: string;
  onClearTask: () => void;
  onStartPause: () => void;
  onReset: () => void;
  onToggleFocusMode: () => void;
  onShowShortcuts: () => void;
  focusMode: boolean;
  remainingTime: number;
  workDuration: number;
  breakDuration: number;
  label: string;
  statusText: string;
  timerStatus: string;
  workDurationMs: number;
  onSelectWorkPreset: (minutes: number) => void;
  lastQuote?: string | null;
  emphasizeStart: boolean;
}

export function FocusDockToolbar({
  expanded,
  onToggleExpanded,
  displayTime,
  isRunning,
  isBreak,
  activeTaskTitle,
  onStartPause,
  onReset,
  emphasizeStart,
}: Pick<
  FocusDockProps,
  | "expanded"
  | "onToggleExpanded"
  | "displayTime"
  | "isRunning"
  | "isBreak"
  | "activeTaskTitle"
  | "onStartPause"
  | "onReset"
  | "emphasizeStart"
>) {
  return (
    <div
      className={`flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 rounded-xl border shadow-sm transition-colors min-w-[11rem] sm:min-w-[13rem] flex-shrink-0 ${
        isBreak
          ? "border-green-300/60 dark:border-green-700/50 bg-green-50/80 dark:bg-green-900/25"
          : isRunning
            ? "border-blue-300/60 dark:border-blue-600/50 bg-blue-50/80 dark:bg-blue-900/25"
            : "border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90"
      }`}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex items-center gap-2 min-w-0 flex-1 text-left"
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse focus timer" : "Expand focus timer"}
        title={expanded ? "Collapse timer" : "Expand timer"}
      >
        <span className="min-w-0 flex-1">
          <span className="app-section-label text-slate-500 dark:text-slate-400 block">Focus timer</span>
          <span className="flex items-center gap-1.5 min-w-0">
            <span
              className={`text-lg sm:text-xl font-mono font-bold tabular-nums leading-none ${
                isBreak
                  ? "text-green-700 dark:text-green-300"
                  : isRunning
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-800 dark:text-slate-100"
              }`}
            >
              {displayTime}
            </span>
            {activeTaskTitle && (
              <span className="hidden lg:inline text-xs text-slate-500 dark:text-slate-400 truncate">
                {activeTaskTitle}
              </span>
            )}
          </span>
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <TimerControls
        isRunning={isRunning}
        onStartPause={onStartPause}
        onReset={onReset}
        compact
        emphasizeStart={emphasizeStart}
      />
    </div>
  );
}

export default function FocusDockPanel({
  expanded,
  onToggleExpanded,
  displayTime,
  isRunning,
  isBreak,
  readyToFocus,
  activeTaskId,
  activeTaskTitle,
  onStartPause,
  onReset,
  onToggleFocusMode,
  onShowShortcuts,
  focusMode,
  remainingTime,
  workDuration,
  breakDuration,
  label,
  statusText,
  timerStatus,
  workDurationMs,
  onSelectWorkPreset,
  lastQuote,
  emphasizeStart,
}: FocusDockProps) {
  return (
    <div className={expanded ? "pb-2" : "sr-only"} aria-hidden={!expanded}>
      <div
        className={`app-surface rounded-xl dark:bg-[#111827] dark:border-[#1e3050] overflow-hidden mt-2 ${
          isBreak ? "timer-break-mode" : ""
        } ${readyToFocus ? "ready-to-focus-ring" : ""} ${activeTaskId ? "timer-linked-from-task" : ""}`}
      >
        <header className="panel-header-calm px-3 sm:px-4 py-2 flex items-center justify-between gap-2 rounded-t-xl">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-white">Focus Timer</h2>
            {!activeTaskId && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Pick a task below</p>
            )}
            {activeTaskId && activeTaskTitle && (
              <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{activeTaskTitle}</p>
            )}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={`p-2 rounded-lg transition-colors ${focusMode ? "bg-blue-600 text-white" : "text-slate-500 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/10"}`}
              aria-label="Toggle focus mode (F)"
              title="Focus mode (F)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onShowShortcuts}
              className="p-2 rounded-lg text-slate-500 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/10"
              aria-label="Keyboard shortcuts"
              title="Shortcuts (?)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="p-2 rounded-lg text-slate-500 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/10"
              aria-label="Collapse timer"
              title="Collapse"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </header>

        <div className="bg-white dark:bg-[#0d1526] px-4 py-3 border-t border-slate-100 dark:border-[#1e3050]/60">
          <div className="flex items-center justify-center gap-3 sm:gap-5 pb-3">
            <TimerControls
              isRunning={isRunning}
              onStartPause={onStartPause}
              onReset={onReset}
              showReset={false}
              emphasizeStart={emphasizeStart}
            />
            <CircularTimer
              remainingTime={remainingTime}
              totalDuration={isBreak ? breakDuration : workDuration}
              label={label}
              statusText={statusText}
              displayTime={displayTime}
              isBreak={isBreak}
            />
            <TimerControls
              isRunning={isRunning}
              onStartPause={onStartPause}
              onReset={onReset}
              showStartPause={false}
              emphasizeStart={emphasizeStart}
            />
          </div>

          <div className="pb-2">
            <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-[#131d30] rounded-lg p-1 border border-slate-200 dark:border-[#243350]">
              {WORK_DURATION_PRESETS.map((minutes) => {
                const active = workDurationMs === minutes * 60 * 1000;
                return (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => onSelectWorkPreset(minutes)}
                    disabled={timerStatus === "running" || timerStatus === "break"}
                    className={`px-2.5 py-1 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                      active
                        ? "bg-white dark:bg-[#1a2d4a] text-blue-700 dark:text-blue-300"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {minutes}m
                  </button>
                );
              })}
            </div>
          </div>

          {readyToFocus && timerStatus === "idle" && !isBreak && (
            <p className="text-center text-xs text-blue-700/90 dark:text-blue-300/90 mb-2">
              Press Play or Space to start
            </p>
          )}
        </div>

        {lastQuote && (timerStatus === "break" || timerStatus === "idle") && (
          <div className="px-4 pb-3">
            <p className="text-sm italic text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              &ldquo;{lastQuote}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
