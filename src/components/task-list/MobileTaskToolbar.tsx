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

const SELECT_CLASS =
  "min-w-0 px-2 py-1.5 min-h-[2.25rem] text-xs font-medium rounded-md border outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.35rem_center] bg-no-repeat pr-6 truncate";

const SELECT_PRIMARY =
  `${SELECT_CLASS} bg-blue-50/90 dark:bg-[#131d30] text-slate-700 dark:text-slate-200 border-blue-200/80 dark:border-[#243350]`;

const SELECT_SECONDARY =
  `${SELECT_CLASS} bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-slate-200/90 dark:border-[#243350]`;

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
  { mode: "plan", label: "Plan" },
];

function scopeLabel(id: TimeScopeId): string {
  switch (id) {
    case TODAY_FILTER_ID:
      return "Today";
    case THIS_WEEK_FILTER_ID:
      return "This week";
    case THIS_MONTH_FILTER_ID:
      return "This month";
    case THIS_YEAR_FILTER_ID:
      return "This year";
    default:
      return "All times";
  }
}

/**
 * Mobile toolbar: Layout is primary; When is a quieter secondary filter.
 * Done tally lives in the Tasks title row.
 */
export function MobileTaskToolbar({
  selectedScope,
  onSelectScope,
  viewMode,
  onSelectViewMode,
  onManageProjects,
  projects = [],
  projectJumpId = "",
  onProjectJump,
  projectCounts,
  showProjectJump = false,
}: MobileTaskToolbarProps) {
  const showJump = showProjectJump && projects.length > 1 && !!onProjectJump;

  return (
    <div className="no-print sm:hidden mt-1.5" data-tour="time-filters">
      <div className="flex items-center gap-1.5 min-w-0">
        <label className="sr-only" htmlFor="mobile-view-mode">
          Layout
        </label>
        <select
          id="mobile-view-mode"
          value={viewMode}
          onChange={(e) => onSelectViewMode(e.target.value as TaskViewMode)}
          className={`${SELECT_PRIMARY} flex-[1.15] min-w-[5.5rem]`}
          aria-label="Task layout"
          data-tour="view-modes"
        >
          {VIEW_OPTIONS.map(({ mode, label }) => (
            <option key={mode} value={mode}>
              {label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="mobile-time-scope">
          When
        </label>
        <select
          id="mobile-time-scope"
          value={selectedScope}
          onChange={(e) => onSelectScope(e.target.value)}
          className={`${SELECT_SECONDARY} flex-1 min-w-[4.75rem]`}
          aria-label="Filter tasks by due date"
        >
          <option value={ALL_PROJECTS_ID}>{scopeLabel(ALL_PROJECTS_ID)}</option>
          <option value={TODAY_FILTER_ID}>{scopeLabel(TODAY_FILTER_ID)}</option>
          <option value={THIS_WEEK_FILTER_ID}>{scopeLabel(THIS_WEEK_FILTER_ID)}</option>
          <option value={THIS_MONTH_FILTER_ID}>{scopeLabel(THIS_MONTH_FILTER_ID)}</option>
          <option value={THIS_YEAR_FILTER_ID}>{scopeLabel(THIS_YEAR_FILTER_ID)}</option>
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
              className={`${SELECT_SECONDARY} flex-[1.1] min-w-[5rem]`}
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
          className="shrink-0 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 min-h-[2.25rem] rounded-md border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-600/50 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          data-tour="manage-projects"
          title="Projects — manage, create, import"
          aria-label="Projects"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4" />
          </svg>
          <span className="text-xs font-semibold hidden min-[380px]:inline">Projects</span>
        </button>
      </div>
    </div>
  );
}
