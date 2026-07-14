"use client";

import type { Project } from "@/lib/types";
import type { TaskViewMode } from "@/components/task-list/types";
import {
  ALL_PROJECTS_ID,
  TODAY_FILTER_ID,
  THIS_WEEK_FILTER_ID,
  THIS_MONTH_FILTER_ID,
  THIS_YEAR_FILTER_ID,
} from "@/lib/types";
import { projectTabLabel, projectTabTooltip } from "@/components/task-list/utils";
import { DoneTodayTally } from "@/components/task-list/DoneTodayTally";

const SELECT_CLASS =
  "min-w-0 px-2 py-1.5 min-h-[2.25rem] text-xs font-medium rounded-md bg-blue-50/90 dark:bg-[#131d30] text-slate-700 dark:text-slate-200 border border-blue-200/80 dark:border-[#243350] outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.35rem_center] bg-no-repeat pr-6 truncate";

type TimeScopeId =
  | typeof ALL_PROJECTS_ID
  | typeof TODAY_FILTER_ID
  | typeof THIS_WEEK_FILTER_ID
  | typeof THIS_MONTH_FILTER_ID
  | typeof THIS_YEAR_FILTER_ID;

interface MobileTaskToolbarProps {
  selectedScope: TimeScopeId;
  onSelectScope: (id: string) => void;
  viewMode: TaskViewMode;
  onSelectViewMode: (mode: TaskViewMode) => void;
  onManageProjects: () => void;
  overdueCount: number;
  doneTodayCount?: number;
  doneWeekCount?: number;
  doneMonthCount?: number;
  onDoneTodayClick?: () => void;
  projects?: Project[];
  projectJumpId?: string;
  onProjectJump?: (projectId: string) => void;
  projectCounts?: Map<string, number>;
  /** Show project jump (bucket view only — cards scroll naturally). */
  showProjectJump?: boolean;
}

const VIEW_OPTIONS: { mode: TaskViewMode; label: string }[] = [
  { mode: "bucket", label: "Buckets" },
  { mode: "card", label: "Cards" },
  { mode: "list", label: "List" },
  { mode: "calendar", label: "Cal" },
];

function scopeLabel(id: TimeScopeId, overdueCount: number): string {
  switch (id) {
    case TODAY_FILTER_ID:
      return overdueCount > 0 ? `Today · ${overdueCount} late` : "Today";
    case THIS_WEEK_FILTER_ID:
      return "Week";
    case THIS_MONTH_FILTER_ID:
      return "Month";
    case THIS_YEAR_FILTER_ID:
      return "Year";
    default:
      return "All";
  }
}

/**
 * Single-row mobile toolbar: scope · view · projects.
 * Print lives in the ⋯ menu. Project jump only for bucket columns.
 */
export function MobileTaskToolbar({
  selectedScope,
  onSelectScope,
  viewMode,
  onSelectViewMode,
  onManageProjects,
  overdueCount,
  doneTodayCount = 0,
  doneWeekCount = 0,
  doneMonthCount = 0,
  onDoneTodayClick,
  projects = [],
  projectJumpId = "",
  onProjectJump,
  projectCounts,
  showProjectJump = false,
}: MobileTaskToolbarProps) {
  const showJump = showProjectJump && projects.length > 1 && !!onProjectJump;

  return (
    <div className="no-print sm:hidden mt-1.5 space-y-1.5" data-tour="time-filters">
      <div className="flex items-center gap-1.5">
        <label className="sr-only" htmlFor="mobile-time-scope">
          Time scope
        </label>
        <select
          id="mobile-time-scope"
          value={selectedScope}
          onChange={(e) => onSelectScope(e.target.value)}
          className={`${SELECT_CLASS} flex-[1.1]`}
          aria-label="Filter tasks by due date"
        >
          <option value={ALL_PROJECTS_ID}>{scopeLabel(ALL_PROJECTS_ID, overdueCount)}</option>
          <option value={TODAY_FILTER_ID}>{scopeLabel(TODAY_FILTER_ID, overdueCount)}</option>
          <option value={THIS_WEEK_FILTER_ID}>{scopeLabel(THIS_WEEK_FILTER_ID, overdueCount)}</option>
          <option value={THIS_MONTH_FILTER_ID}>{scopeLabel(THIS_MONTH_FILTER_ID, overdueCount)}</option>
          <option value={THIS_YEAR_FILTER_ID}>{scopeLabel(THIS_YEAR_FILTER_ID, overdueCount)}</option>
        </select>

        <DoneTodayTally
          count={doneTodayCount}
          weekCount={doneWeekCount}
          monthCount={doneMonthCount}
          onClick={onDoneTodayClick}
        />

        <label className="sr-only" htmlFor="mobile-view-mode">
          View mode
        </label>
        <select
          id="mobile-view-mode"
          value={viewMode === "plan" ? "card" : viewMode}
          onChange={(e) => onSelectViewMode(e.target.value as TaskViewMode)}
          className={`${SELECT_CLASS} flex-1`}
          aria-label="Task view mode"
          data-tour="view-modes"
        >
          {VIEW_OPTIONS.map(({ mode, label }) => (
            <option key={mode} value={mode}>
              {label}
            </option>
          ))}
        </select>

        {showJump && (
          <>
            <label className="sr-only" htmlFor="mobile-project-jump">
              Jump to project
            </label>
            <select
              id="mobile-project-jump"
              value={projectJumpId}
              onChange={(e) => onProjectJump?.(e.target.value)}
              className={`${SELECT_CLASS} flex-[1.2]`}
              aria-label="Jump to project"
            >
              <option value="">Project…</option>
              {projects.map((p) => {
                const count = projectCounts?.get(p.id) ?? 0;
                return (
                  <option key={p.id} value={p.id} title={projectTabTooltip(p)}>
                    {projectTabLabel(p)} ({count})
                  </option>
                );
              })}
            </select>
          </>
        )}

        <button
          type="button"
          onClick={onManageProjects}
          className="shrink-0 inline-flex items-center justify-center px-2 py-1.5 min-h-[2.25rem] min-w-[2.25rem] rounded-md border border-blue-200/80 dark:border-[#243350] bg-white dark:bg-[#131d30] text-blue-600/80 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-600/50 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          data-tour="manage-projects"
          title="Manage projects"
          aria-label="Manage projects"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
