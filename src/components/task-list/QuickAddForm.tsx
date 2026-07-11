"use client";

import React from "react";
import { MAX_TASK_TITLE } from "@/components/task-list/utils";

export function QuickAddForm({
  draft,
  onDraftChange,
  onSubmit,
  inputRef,
  className = "px-3 py-2.5 shrink-0",
  compact = false,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
  compact?: boolean;
}) {
  return (
    <form className={className} onSubmit={onSubmit}>
      <div
        className={`flex items-center gap-2 rounded-xl bg-slate-100/70 dark:bg-white/5 focus-within:ring-2 focus-within:ring-blue-500/15 dark:focus-within:ring-blue-400/20 transition-shadow ${
          compact ? "px-2 py-1.5" : "px-3 py-2"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Add a task…"
          maxLength={MAX_TASK_TITLE}
          className={`app-placeholder flex-1 min-w-0 bg-transparent border-0 outline-none text-slate-700 dark:text-slate-200 ${
            compact ? "text-xs" : "text-sm"
          }`}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className={`font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
            compact ? "text-xs" : "text-sm"
          }`}
          aria-label="Add task"
          title="Add task"
        >
          Add
        </button>
      </div>
    </form>
  );
}
