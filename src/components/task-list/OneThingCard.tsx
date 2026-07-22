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
      <div className="no-print mx-3 sm:mx-4 mt-2 mb-1 rounded-xl border border-dashed border-amber-300/80 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/20 px-3.5 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-0.5">
              The One Thing
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">
              {hasOpenTasks
                ? "What’s the one thing that would make today a success?"
                : "Add a task, then set it as your One Thing."}
            </p>
            {hasOpenTasks && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Open any task’s details and choose <span className="font-semibold text-amber-700 dark:text-amber-300">Set as One Thing</span>.
              </p>
            )}
          </div>
          {onDismissEmpty && (
            <button
              type="button"
              onClick={onDismissEmpty}
              className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Dismiss One Thing prompt"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === "done" && task) {
    return (
      <div className="no-print mx-3 sm:mx-4 mt-2 mb-1 rounded-xl border border-emerald-300/70 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/25 px-3.5 py-3">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-0.5">
              One Thing done
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-through decoration-emerald-500/50 truncate">
              {task.title}
            </p>
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
              Day made. Come back tomorrow for the next one.
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded-md"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  if (status === "active" && task) {
    return (
      <div className="no-print mx-3 sm:mx-4 mt-2 mb-1 rounded-xl border border-amber-300/80 dark:border-amber-700/45 bg-gradient-to-br from-amber-50/90 to-white dark:from-amber-950/30 dark:to-[#131d30] px-3.5 py-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-0.5">
              The One Thing
            </p>
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate" title={task.title}>
              {task.title}
            </p>
            {projectName && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{projectName}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onFocus}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isFocused
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              }`}
              title={isFocused ? "Already focused" : isTimerRunning ? "Switch focus to One Thing" : "Focus and start timer"}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              {isFocused ? "Focused" : isTimerRunning ? "Switch" : "Focus"}
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              Done
            </button>
            <button
              type="button"
              onClick={onChange}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#243350] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
