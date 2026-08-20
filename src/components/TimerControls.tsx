"use client";

import React from "react";
import {
  MiniPlayPauseIcon,
  MiniResetIcon,
  miniPlayButtonClass,
  miniResetButtonClass,
} from "@/components/FocusStripControls";

interface TimerControlsProps {
  isRunning: boolean;
  onStartPause: () => void;
  onReset: () => void;
  spread?: boolean;
  compact?: boolean;
  /** Matches embedded focus-strip icon buttons (timer + music). */
  dock?: boolean;
  showStartPause?: boolean;
  showReset?: boolean;
  /** Solid blue Start when a task is selected (primary focus CTA). */
  emphasizeStart?: boolean;
}

export default function TimerControls({
  isRunning,
  onStartPause,
  onReset,
  spread,
  compact,
  dock,
  showStartPause = true,
  showReset = true,
  emphasizeStart = false,
}: TimerControlsProps) {
  if (compact) {
    if (dock) {
      return (
        <div className="flex items-center gap-0.5" role="group" aria-label="Timer control buttons">
          {showStartPause && (
            <button
              onClick={onStartPause}
              className={`flex-shrink-0 ${miniPlayButtonClass(isRunning, true, emphasizeStart && !isRunning)}`}
              aria-label={isRunning ? "Pause timer" : "Start timer"}
            >
              <MiniPlayPauseIcon playing={isRunning} size="md" />
            </button>
          )}
          {showReset && (
            <button
              onClick={onReset}
              className={`flex-shrink-0 ${miniResetButtonClass(true)}`}
              aria-label="Reset timer"
            >
              <MiniResetIcon size="sm" />
            </button>
          )}
        </div>
      );
    }

    const iconSize = "w-5 h-5";
    const btnPad = "p-2";
    return (
      <div className="flex items-center gap-0.5" role="group" aria-label="Timer control buttons">
        {showStartPause && (
          <button
            onClick={onStartPause}
            className={`${btnPad} rounded-lg transition-all active:scale-90 ${
              isRunning
                ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                : emphasizeStart
                  ? "bg-blue-700 text-white shadow-sm hover:bg-blue-800"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
            }`}
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? (
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010.049 9.9v4.2a1 1 0 001.506.864l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        )}
        {showReset && (
          <button
            onClick={onReset}
            className={`${btnPad} rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors`}
            aria-label="Reset timer"
          >
            <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  const startPauseButton = (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <button
        onClick={onStartPause}
        className={`pause-button w-12 h-12 ${
          isRunning ? "running" : emphasizeStart ? "primary-ready" : "idle-muted"
        }`}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
        title={isRunning ? "Pause" : "Start focus session"}
      >
        {isRunning ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010.049 9.9v4.2a1 1 0 001.506.864l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {isRunning ? "Pause" : "Start"}
      </span>
    </div>
  );

  const resetButton = (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <button
        onClick={onReset}
        className="reset-button w-12 h-12"
        aria-label="Reset timer"
        title="Reset current session"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
        Reset
      </span>
    </div>
  );

  return (
    <div
      className={spread ? "flex justify-between w-full" : "flex justify-center gap-3 my-0 sm:my-1"}
      role="group"
      aria-label="Timer control buttons"
    >
      {showStartPause && startPauseButton}
      {showReset && resetButton}
    </div>
  );
}
