"use client";

import React from "react";
import type { Task } from "@/lib/types";
import type { OneThingStatus } from "@/lib/one-thing";

export interface OneThingCardProps {
  status: OneThingStatus;
  task: Task | null;
  projectName?: string;
  hasOpenTasks: boolean;
  isTimerRunning: boolean;
  isFocused: boolean;
  onFocus: () => void;
  onComplete: () => void;
  onChange: () => void;
  onClear: () => void;
  onDismissEmpty?: () => void;
}

const strip =
  "no-print mx-3 sm:mx-4 mt-1.5 mb-1 flex items-center gap-2.5 min-h-[2.5rem] min-w-0 rounded-lg border-2 px-3 py-1.5";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.25l2.472 6.342h6.668l-5.4 3.923 2.061 6.342L12 15.934l-5.801 3.923 2.061-6.342-5.4-3.923h6.668L12 2.25z" />
    </svg>
  );
}

export function OneThingCard({
  status,
  task,
  projectName,
  hasOpenTasks,
  isTimerRunning,
  isFocused,
  onFocus,
  onComplete,
  onChange,
  onClear,
  onDismissEmpty,
}: OneThingCardProps) {
  if (status === "unset") {
    return (
      <div
        className={`${strip} border-teal-400 dark:border-teal-400/70 bg-teal-50 dark:bg-teal-500/15 shadow-sm shadow-teal-500/10`}
      >
        <span className="inline-flex items-center gap-1 shrink-0 rounded-md bg-teal-600 dark:bg-teal-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
          <StarIcon className="w-3 h-3" />
          One Thing
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-teal-950 dark:text-teal-50">
          {hasOpenTasks
            ? "What’s the one thing that would make today a success?"
            : "Add a task, then set it as your One Thing"}
        </p>
        {hasOpenTasks && (
          <span className="hidden sm:inline shrink-0 text-xs font-semibold text-teal-800 dark:text-teal-200/90">
            Open a task → Set as One Thing
          </span>
        )}
        {onDismissEmpty && (
          <button
            type="button"
            onClick={onDismissEmpty}
            className="shrink-0 p-1 rounded-md text-teal-700/70 dark:text-teal-200/60 hover:text-teal-950 dark:hover:text-teal-50 hover:bg-teal-200/50 dark:hover:bg-teal-500/20"
            aria-label="Dismiss One Thing prompt"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  if (status === "done" && task) {
    return (
      <div
        className={`${strip} border-emerald-400 dark:border-emerald-500/70 bg-emerald-100 dark:bg-emerald-500/15`}
      >
        <span className="inline-flex items-center shrink-0 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
          Done
        </span>
        <p
          className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-950 dark:text-emerald-50 line-through decoration-emerald-600/50"
          title={task.title}
        >
          {task.title}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:underline px-1.5 py-0.5"
        >
          Clear
        </button>
      </div>
    );
  }

  if (status === "active" && task) {
    return (
      <div
        className={`${strip} border-teal-400 dark:border-teal-400/70 bg-teal-50 dark:bg-teal-500/15 shadow-sm shadow-teal-500/10`}
      >
        <span
          className="inline-flex items-center gap-1 shrink-0 rounded-md bg-teal-600 dark:bg-teal-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
          title={projectName ? `The One Thing · ${projectName}` : "The One Thing"}
        >
          <StarIcon className="w-3 h-3" />
          One Thing
        </span>
        <p
          className="min-w-0 flex-1 truncate text-sm font-semibold text-teal-950 dark:text-white"
          title={projectName ? `${task.title} · ${projectName}` : task.title}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onFocus}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              isFocused
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-600/60 hover:bg-blue-50 dark:hover:bg-blue-900/60"
            }`}
            title={isFocused ? "Already focused" : isTimerRunning ? "Switch focus to One Thing" : "Focus and start timer"}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            {isFocused ? "Focused" : "Focus"}
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onChange}
            className="hidden sm:inline-flex items-center px-1.5 py-1 text-xs font-semibold text-teal-900 dark:text-teal-100 hover:underline"
          >
            Change
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center p-1 rounded-md text-teal-800/70 dark:text-teal-200/70 hover:text-teal-950 dark:hover:text-white hover:bg-teal-200/50 dark:hover:bg-teal-500/20"
            aria-label="Clear One Thing"
            title="Clear"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
