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

/** Collapsed “Done today” reel — filled emerald chip so it reads on dark cards. */
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
            ? "mt-2 pt-2 border-t border-emerald-300/50 dark:border-emerald-800/50"
            : "pt-2 border-t border-emerald-300/60 dark:border-emerald-800/50"
      }
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className={`w-full flex items-center gap-1.5 text-left mb-1.5 transition-colors rounded-lg border ${
          compact ? "px-2 py-1.5" : "px-2.5 py-1.5"
        } bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200/80 dark:border-emerald-600/55 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/70`}
        aria-expanded={!collapsed}
      >
        <svg
          className={`w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-300 transition-transform ${collapsed ? "" : "rotate-90"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className={`truncate font-semibold ${compact ? "text-xs" : "text-sm"}`}>
          Done today
          <span className="ml-1 tabular-nums font-bold text-emerald-800 dark:text-emerald-200">
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
                  compact ? "px-1.5 py-0.5" : "px-2 py-0.5"
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
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    {task.title}
                    {showProject && getProjectName && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 align-middle">
                        {getProjectName(task.projectId)}
                      </span>
                    )}
                  </div>
                  {meta && (
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 tabular-nums truncate mt-0.5">
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
