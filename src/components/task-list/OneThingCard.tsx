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
  "no-print mx-3 sm:mx-4 mt-1.5 mb-0.5 flex items-center gap-2 min-h-[2.25rem] min-w-0 rounded-lg border px-2.5 py-1.5";

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
        className={`${strip} border-dashed border-amber-300/70 dark:border-amber-700/45 bg-amber-50/40 dark:bg-amber-950/15`}
      >
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          One Thing
        </span>
        <p className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
          {hasOpenTasks
            ? "Pick today’s critical task from any task’s details"
            : "Add a task, then set it as your One Thing"}
        </p>
        {onDismissEmpty && (
          <button
            type="button"
            onClick={onDismissEmpty}
            className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
        className={`${strip} border-emerald-300/60 dark:border-emerald-800/45 bg-emerald-50/50 dark:bg-emerald-950/20`}
      >
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Done
        </span>
        <p
          className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200 line-through decoration-emerald-500/50"
          title={task.title}
        >
          {task.title}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1.5 py-0.5"
        >
          Clear
        </button>
      </div>
    );
  }

  if (status === "active" && task) {
    return (
      <div
        className={`${strip} border-amber-300/70 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20`}
      >
        <span
          className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400"
          title={projectName ? `The One Thing · ${projectName}` : "The One Thing"}
        >
          One Thing
        </span>
        <p
          className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white"
          title={projectName ? `${task.title} · ${projectName}` : task.title}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onFocus}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
              isFocused
                ? "bg-blue-600 text-white"
                : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/50"
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
            className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onChange}
            className="hidden sm:inline-flex items-center px-1.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Change
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
