"use client";

import React, { useState } from "react";
import type { Task } from "@/lib/types";
import { formatDuration } from "@/components/task-list/utils";

interface DoneTodaySectionProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  getProjectName?: (projectId: string) => string;
  showProject?: boolean;
  /** Compact layout for bucket columns. */
  compact?: boolean;
  /** Start collapsed (bucket defaults open so wins stay visible). */
  defaultCollapsed?: boolean;
}

export function DoneTodaySection({
  tasks,
  onToggleComplete,
  getProjectName,
  showProject = false,
  compact = false,
  defaultCollapsed = false,
}: DoneTodaySectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (tasks.length === 0) return null;

  return (
    <div
      className={
        compact
          ? "mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40"
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
        <span className="truncate">
          Done today
          <span className="ml-1 tabular-nums font-medium normal-case tracking-normal">
            ({tasks.length})
          </span>
        </span>
      </button>

      {!collapsed && (
        <div className={compact ? "space-y-0.5" : "space-y-1"}>
          {tasks.map((task) => (
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
              <span
                className={`min-w-0 flex-1 truncate ${
                  compact
                    ? "text-sm text-slate-700 dark:text-slate-200"
                    : "text-sm text-slate-700 dark:text-slate-200"
                }`}
              >
                {task.title}
                {showProject && getProjectName && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-slate-100 dark:bg-[#1a2d4a] text-slate-500 dark:text-slate-300 align-middle">
                    {getProjectName(task.projectId)}
                  </span>
                )}
              </span>
              {((task.timeSpent || 0) > 0 || task.sessions > 0) && (
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto flex-shrink-0 tabular-nums">
                  {(task.timeSpent || 0) > 0
                    ? formatDuration(task.timeSpent)
                    : `${task.sessions}s`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
