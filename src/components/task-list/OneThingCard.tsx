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
  /** `strip` = full-width bar; `inline` = compact chip for toolbar rows. */
  variant?: "strip" | "inline";
}

const stripShell =
  "no-print mx-3 sm:mx-4 mt-1.5 mb-1 flex items-center gap-2.5 min-h-[2.5rem] min-w-0 rounded-lg border-2 px-3 py-1.5";
const inlineShell =
  "no-print flex items-center gap-2 min-h-[2.25rem] min-w-0 max-w-full rounded-lg border px-2.5 py-1";

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
  variant = "strip",
}: OneThingCardProps) {
  const shell = variant === "inline" ? inlineShell : stripShell;
  const compact = variant === "inline";

  if (status === "unset") {
    return (
      <div
        data-tour="one-thing"
        className={`${shell} relative justify-center border-blue-600 dark:border-blue-600/80 bg-blue-50 dark:bg-blue-950/55 ${
          compact ? "" : "shadow-sm shadow-blue-900/20"
        }`}
      >
        <div className={`flex items-center justify-center gap-2 min-w-0 ${compact ? "" : "gap-2.5"} ${onDismissEmpty ? "px-7" : ""}`}>
          <span className="inline-flex items-center gap-1 shrink-0 rounded-md bg-blue-800 dark:bg-blue-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            <StarIcon className="w-3 h-3" />
            {compact ? "One Thing" : <>Today&apos;s One Thing</>}
          </span>
          <p className="min-w-0 truncate text-sm font-medium text-blue-950 dark:text-blue-50">
            {hasOpenTasks
              ? compact
                ? "Pick today’s priority task"
                : "What’s the one thing that would make today a success?"
              : "Add a task, then set it as your One Thing"}
          </p>
          {hasOpenTasks && !compact && (
            <span className="hidden sm:inline text-xs font-semibold text-blue-800 dark:text-blue-200/90">
              Open a task → Set as Today&apos;s One Thing
            </span>
          )}
        </div>
        {onDismissEmpty && (
          <button
            type="button"
            onClick={onDismissEmpty}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-blue-700/70 dark:text-blue-200/60 hover:text-blue-950 dark:hover:text-blue-50 hover:bg-blue-200/50 dark:hover:bg-blue-800/40"
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
        data-tour="one-thing"
        className={`${shell} border-slate-200 dark:border-emerald-500/40 bg-slate-50 dark:bg-emerald-500/10 border-l-[3px] border-l-emerald-500 dark:border-l-emerald-400`}
      >
        <div className={`flex items-center gap-2 min-w-0 flex-1 ${compact ? "" : "justify-center gap-2.5"}`}>
          <span className="inline-flex items-center shrink-0 rounded-md bg-slate-700 dark:bg-emerald-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            Done
          </span>
          <p
            className="min-w-0 truncate text-sm font-medium text-slate-600 dark:text-emerald-50 line-through decoration-slate-400/70 dark:decoration-emerald-600/50"
            title={task.title}
          >
            {task.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-xs font-semibold text-slate-500 dark:text-emerald-200 hover:text-slate-800 dark:hover:text-emerald-50 hover:underline px-1.5 py-0.5"
        >
          Clear
        </button>
      </div>
    );
  }

  if (status === "active" && task) {
    return (
      <div
        data-tour="one-thing"
        className={`${shell} border-blue-600 dark:border-blue-600/80 bg-blue-50 dark:bg-blue-950/55 ${
          compact ? "" : "shadow-sm shadow-blue-900/20"
        }`}
      >
        <div className={`flex items-center gap-2 min-w-0 flex-1 ${compact ? "" : "justify-center gap-2.5"}`}>
          <span
            className="inline-flex items-center gap-1 shrink-0 rounded-md bg-blue-800 dark:bg-blue-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
            title={projectName ? `Today's One Thing · ${projectName}` : "Today's One Thing"}
          >
            <StarIcon className="w-3 h-3" />
            {compact ? "One Thing" : <>Today&apos;s One Thing</>}
          </span>
          <p
            className="min-w-0 truncate text-sm font-semibold text-blue-950 dark:text-white"
            title={projectName ? `${task.title} · ${projectName}` : task.title}
          >
            {task.title}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onFocus}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
              isFocused
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-600/60 hover:bg-blue-50 dark:hover:bg-blue-900/60"
            }`}
            title={isFocused ? "Already focused" : isTimerRunning ? "Switch focus to One Thing" : "Focus and start timer"}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            {compact ? (isFocused ? "On" : "Focus") : isFocused ? "Focused" : "Focus"}
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Done
          </button>
          {!compact && (
            <button
              type="button"
              onClick={onChange}
              className="hidden sm:inline-flex items-center px-1.5 py-1 text-xs font-semibold text-blue-900 dark:text-blue-100 hover:underline"
            >
              Change
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center p-1 rounded-md text-blue-800/70 dark:text-blue-200/70 hover:text-blue-950 dark:hover:text-white hover:bg-blue-200/50 dark:hover:bg-blue-800/40"
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
