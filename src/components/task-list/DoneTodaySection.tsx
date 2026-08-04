"use client";

import React, { useState } from "react";
import type { Task } from "@/lib/types";
import { formatDoneTaskMeta } from "@/lib/done-today";

interface DoneTodaySectionProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  getProjectName?: (projectId: string) => string;
  showProject?: boolean;
  /** Compact layout for bucket/card columns. */
  compact?: boolean;
  /** Skip outer margin/border when the parent already provides a separator. */
  flush?: boolean;
  /** Start collapsed — wins stay one click away without crowding open work. */
  defaultCollapsed?: boolean;
}

export function DoneTodaySection({
  tasks,
  onToggleComplete,
  getProjectName,
  showProject = false,
  compact = false,
  flush = false,
  defaultCollapsed = true,
}: DoneTodaySectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (tasks.length === 0) return null;

  return (
    <div
      data-done-today-section
      className={
        flush
          ? "pt-0"
          : compact
            ? "mt-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40"
            : "pt-2 border-t border-emerald-200/70 dark:border-emerald-900/40"
      }
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className={`w-full flex items-center gap-1.5 text-left mb-1.5 transition-colors ${
          compact
            ? "bucket-lane-label text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 px-1"
            : "app-section-label text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300"
        }`}
        aria-expanded={!collapsed}
      >
        <svg
          className={`w-3 h-3 shrink-0 transition-transform ${collapsed ? "" : "rotate-90"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="truncate text-emerald-700 dark:text-emerald-400">
          Done today
          <span className="ml-1 tabular-nums font-semibold normal-case tracking-normal text-emerald-800 dark:text-emerald-300">
            ({tasks.length})
          </span>
        </span>
      </button>

      {!collapsed && (
        <div className={compact ? "space-y-0.5" : "space-y-1"}>
          {tasks.map((task) => {
            const meta = formatDoneTaskMeta(task);
            return (
              <div
                key={task.id}
                className={`flex items-center gap-2 rounded-lg transition-colors hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 ${
                  compact ? "px-1.5 py-1.5" : "p-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleComplete(task.id)}
                  className="flex-shrink-0 w-5 h-5 rounded border-2 border-emerald-400 bg-emerald-500 flex items-center justify-center"
                  aria-label={`Mark "${task.title}" incomplete`}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    {task.title}
                    {showProject && getProjectName && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 align-middle">
                        {getProjectName(task.projectId)}
                      </span>
                    )}
                  </div>
                  {meta && (
                    <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 tabular-nums truncate mt-0.5">
                      {meta}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
