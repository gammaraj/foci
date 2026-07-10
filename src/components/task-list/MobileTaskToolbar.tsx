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

const MOBILE_SELECT_CLASS =
  "flex-1 min-w-0 px-3 py-2.5 min-h-[2.75rem] text-sm font-medium rounded-lg bg-slate-100 dark:bg-[#131d30] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243350] outline-none focus:border-cyan-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8 truncate";

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
  onPrint: () => void;
  onManageProjects: () => void;
  overdueCount: number;
  projects?: Project[];
  projectJumpId?: string;
  onProjectJump?: (projectId: string) => void;
  projectCounts?: Map<string, number>;
  showProjectJump?: boolean;
  printDisabled?: boolean;
}

const VIEW_OPTIONS: { mode: TaskViewMode; label: string }[] = [
  { mode: "bucket", label: "Buckets" },
  { mode: "card", label: "Cards" },
  { mode: "list", label: "List" },
  { mode: "calendar", label: "Calendar" },
];

function scopeLabel(id: TimeScopeId, overdueCount: number): string {
  switch (id) {
    case TODAY_FILTER_ID:
      return overdueCount > 0 ? `Today · ${overdueCount} late` : "Today";
    case THIS_WEEK_FILTER_ID:
      return "This week";
    case THIS_MONTH_FILTER_ID:
      return "This month";
    case THIS_YEAR_FILTER_ID:
      return "This year";
    default:
      return "All tasks";
  }
}

/** Compact mobile toolbar: time scope + view mode in one row, optional project jump + manage. */
export function MobileTaskToolbar({
  selectedScope,
  onSelectScope,
  viewMode,
  onSelectViewMode,
  onPrint,
  onManageProjects,
  overdueCount,
  projects = [],
  projectJumpId = "",
  onProjectJump,
  projectCounts,
  showProjectJump = false,
  printDisabled = false,
}: MobileTaskToolbarProps) {
  return (
    <div className="no-print sm:hidden space-y-2 mt-2" data-tour="time-filters">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="mobile-time-scope">
          Time scope
        </label>
        <select
          id="mobile-time-scope"
          value={selectedScope}
          onChange={(e) => onSelectScope(e.target.value)}
          className={MOBILE_SELECT_CLASS}
          aria-label="Filter tasks by due date"
        >
          <option value={ALL_PROJECTS_ID}>{scopeLabel(ALL_PROJECTS_ID, overdueCount)}</option>
          <option value={TODAY_FILTER_ID}>{scopeLabel(TODAY_FILTER_ID, overdueCount)}</option>
          <option value={THIS_WEEK_FILTER_ID}>{scopeLabel(THIS_WEEK_FILTER_ID, overdueCount)}</option>
          <option value={THIS_MONTH_FILTER_ID}>{scopeLabel(THIS_MONTH_FILTER_ID, overdueCount)}</option>
          <option value={THIS_YEAR_FILTER_ID}>{scopeLabel(THIS_YEAR_FILTER_ID, overdueCount)}</option>
        </select>
        <label className="sr-only" htmlFor="mobile-view-mode">
          View mode
        </label>
        <select
          id="mobile-view-mode"
          value={viewMode === "plan" ? "card" : viewMode}
          onChange={(e) => onSelectViewMode(e.target.value as TaskViewMode)}
          className={MOBILE_SELECT_CLASS}
          aria-label="Task view mode"
          data-tour="view-modes"
        >
          {VIEW_OPTIONS.map(({ mode, label }) => (
            <option key={mode} value={mode}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onPrint}
          disabled={printDisabled}
          className="flex-shrink-0 touch-target-sm p-2.5 rounded-lg border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-cyan-300 dark:hover:border-cyan-600/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Print current view"
          aria-label="Print current view"
          data-tour="print-tasks"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {showProjectJump && projects.length > 1 && onProjectJump && (
          <>
            <label className="sr-only" htmlFor="mobile-project-jump">
              Jump to project
            </label>
            <select
              id="mobile-project-jump"
              value={projectJumpId}
              onChange={(e) => onProjectJump(e.target.value)}
              className={`${MOBILE_SELECT_CLASS} flex-[1.4]`}
              aria-label="Jump to project"
            >
              <option value="">All projects</option>
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
          className="inline-flex items-center justify-center gap-1.5 flex-1 min-w-0 px-3 py-2.5 min-h-[2.75rem] text-sm font-semibold rounded-lg border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] hover:border-cyan-300 dark:hover:border-cyan-600/50 transition-colors shadow-sm"
          data-tour="manage-projects"
        >
          <svg className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4" />
          </svg>
          <span className="truncate">Projects</span>
          <svg className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
