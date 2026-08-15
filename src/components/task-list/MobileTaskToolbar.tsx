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
  /** Opens Projects with create at the top. */
  onAddProject?: () => void;
  projects?: Project[];
  projectJumpId?: string;
  onProjectJump?: (projectId: string) => void;
  projectCounts?: Map<string, number>;
  /** Show project jump (bucket view only — cards scroll naturally). */
  showProjectJump?: boolean;
  /** Clears active Today/Week/Month/Year scope. */
  onClearTimeFilter?: () => void;
  /** Landscape: search shares the filter row to save vertical space. */
  cardQuery?: string;
  onCardQueryChange?: (value: string) => void;
  showCardSearch?: boolean;
}

const VIEW_OPTIONS: { mode: TaskViewMode; label: string }[] = [
  { mode: "card", label: "Cards" },
  { mode: "bucket", label: "Buckets" },
  { mode: "list", label: "List" },
  { mode: "calendar", label: "Calendar" },
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
 * On land-compact, search joins this row so cards get more vertical room.
 */
export function MobileTaskToolbar({
  selectedScope,
  onSelectScope,
  viewMode,
  onSelectViewMode,
  onManageProjects,
  onAddProject,
  projects = [],
  projectJumpId = "",
  onProjectJump,
  projectCounts,
  showProjectJump = false,
  onClearTimeFilter,
  cardQuery = "",
  onCardQueryChange,
  showCardSearch = false,
}: MobileTaskToolbarProps) {
  const showJump = showProjectJump && projects.length > 1 && !!onProjectJump;
  const timeFilterActive = selectedScope !== ALL_PROJECTS_ID;
  const landscapeSearch = showCardSearch && !!onCardQueryChange;

  return (
    <div className="no-print roomy:hidden mt-1.5 space-y-1.5" data-tour="time-filters">
      <div className="flex items-center gap-1.5 min-w-0">
        <label className="sr-only" htmlFor="mobile-view-mode">
          Layout
        </label>
        <select
          id="mobile-view-mode"
          value={viewMode}
          onChange={(e) => onSelectViewMode(e.target.value as TaskViewMode)}
          className={`${SELECT_PRIMARY} flex-[1.15] min-w-[5.5rem] land-compact:flex-none land-compact:max-w-[7rem]`}
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
          className={`${SELECT_SECONDARY} flex-1 min-w-[4.75rem] land-compact:flex-none land-compact:max-w-[7.5rem]`}
          aria-label="Filter tasks by due date"
        >
          <option value={ALL_PROJECTS_ID}>{scopeLabel(ALL_PROJECTS_ID)}</option>
          <option value={TODAY_FILTER_ID}>{scopeLabel(TODAY_FILTER_ID)}</option>
          <option value={THIS_WEEK_FILTER_ID}>{scopeLabel(THIS_WEEK_FILTER_ID)}</option>
          <option value={THIS_MONTH_FILTER_ID}>{scopeLabel(THIS_MONTH_FILTER_ID)}</option>
          <option value={THIS_YEAR_FILTER_ID}>{scopeLabel(THIS_YEAR_FILTER_ID)}</option>
        </select>
        {timeFilterActive && onClearTimeFilter && (
          <button
            type="button"
            onClick={onClearTimeFilter}
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200/90 dark:border-[#243350] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
            aria-label="Clear time filter — show all times"
            title="Clear filter"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {showJump && (
          <>
            <label className="sr-only" htmlFor="mobile-project-jump">
              Jump to project
            </label>
            <select
              id="mobile-project-jump"
              value={projectJumpId}
              onChange={(e) => onProjectJump?.(e.target.value)}
              className={`${SELECT_SECONDARY} flex-[1.1] min-w-[5rem] land-compact:max-w-[8rem]`}
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

        {landscapeSearch && (
          <label className="relative hidden land-compact:block flex-1 min-w-[7rem]">
            <span className="sr-only">Search projects and tasks</span>
            <svg
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="search"
              value={cardQuery}
              onChange={(e) => onCardQueryChange?.(e.target.value)}
              placeholder="Filter…"
              className="w-full pl-7 pr-2 py-1.5 min-h-[2.25rem] text-xs rounded-md border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-blue-500"
              aria-label="Filter projects or tasks"
              data-tour="card-filter"
            />
          </label>
        )}

        <button
          type="button"
          onClick={onManageProjects}
          className="shrink-0 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 min-h-[2.25rem] rounded-md border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-600/50 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          data-tour="manage-projects"
          title="Projects — manage, pin, share, import"
          aria-label="Manage projects"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4" />
          </svg>
          <span className="text-xs font-semibold">All</span>
        </button>

        {/* Inline Add project on short/landscape — full-width CTA below on taller phones */}
        {onAddProject && (
          <button
            type="button"
            onClick={onAddProject}
            className="shrink-0 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 min-h-[2.25rem] rounded-md border border-blue-300/80 dark:border-blue-600/50 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors [@media(min-height:501px)]:hidden"
            data-tour="add-project"
            title="Add a new project"
            aria-label="Add project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Project
          </button>
        )}
      </div>

      {onAddProject && (
        <button
          type="button"
          onClick={onAddProject}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[2.5rem] rounded-lg border border-blue-300/80 dark:border-blue-600/50 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors [@media(max-height:500px)]:hidden"
          data-tour="add-project"
          title="Add a new project"
          aria-label="Add project"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add project
        </button>
      )}
    </div>
  );
}
