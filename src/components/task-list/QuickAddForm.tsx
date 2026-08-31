"use client";

import React from "react";
import { MAX_TASK_TITLE } from "@/components/task-list/utils";

export function QuickAddForm({
  draft,
  onDraftChange,
  onSubmit,
  onAddWithDetails,
  inputRef,
  className = "px-3 py-2.5 shrink-0",
  compact = false,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  /** Create the task and open the details drawer (due date, subtasks, etc.). */
  onAddWithDetails?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
  compact?: boolean;
}) {
  const canSubmit = Boolean(draft.trim());
  const showDetails = Boolean(onAddWithDetails);

  return (
    <form className={className} onSubmit={onSubmit}>
      <div
        className={`flex items-center gap-1.5 rounded-xl bg-slate-100/70 dark:bg-white/5 focus-within:ring-2 focus-within:ring-blue-500/15 dark:focus-within:ring-blue-400/20 transition-shadow ${
          compact ? "px-2 py-1.5" : "px-3 py-2"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (!onAddWithDetails || !canSubmit) return;
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              onAddWithDetails();
            }
          }}
          placeholder="Quick add a task…"
          maxLength={MAX_TASK_TITLE}
          className={`app-placeholder flex-1 min-w-0 bg-transparent border-0 outline-none text-slate-700 dark:text-slate-200 ${
            compact ? "text-xs" : "text-sm"
          }`}
        />
        {showDetails && canSubmit ? (
          <button
            type="button"
            onClick={onAddWithDetails}
            className={`shrink-0 inline-flex items-center gap-0.5 font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              compact ? "text-xs" : "text-sm"
            }`}
            aria-label="Add with details"
            title="Add with details (⌘/Ctrl+Enter)"
          >
            Details
            <svg
              className={compact ? "w-3 h-3" : "w-3.5 h-3.5"}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`shrink-0 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
            compact ? "text-xs" : "text-sm"
          }`}
          aria-label="Quick Add"
          title="Quick Add"
        >
          Add
        </button>
      </div>
    </form>
  );
}
