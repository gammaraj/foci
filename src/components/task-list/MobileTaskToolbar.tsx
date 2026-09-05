"use client";

import type { Project } from "@/lib/types";
import type { TaskViewMode } from "@/components/task-list/types";
import { AddProjectButton } from "@/components/task-list/AddProjectButton";
import {
  ALL_PROJECTS_ID,
  TODAY_FILTER_ID,
  THIS_WEEK_FILTER_ID,
  THIS_MONTH_FILTER_ID,
  THIS_YEAR_FILTER_ID,
} from "@/lib/types";
import { projectTabLabel, projectTabTooltip } from "@/components/task-list/utils";
import { TaskSearchField } from "@/components/task-list/TaskSearchField";
import { SELECT_FIELD_CLASS } from "@/components/ui/Select";
import { cn } from "@/lib/cn";

const SELECT_PRIMARY = cn(
  SELECT_FIELD_CLASS,
  "bg-blue-50/90 dark:bg-surface-elevated text-slate-700 dark:text-slate-200 border-blue-200/80 dark:border-surface-border",
);

const SELECT_SECONDARY = cn(
  SELECT_FIELD_CLASS,
  "bg-surface-elevated dark:bg-surface-recessed text-slate-600 dark:text-slate-300 border-surface-border",
);

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
  /** Hide the Projects control (drill-in puts Manage in the focus bar). */
  showManageProjects?: boolean;
  searchPlaceholder?: string;
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
 * Add project stays inline (no full-width second row) to keep portrait chrome short.
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
  showManageProjects = true,
  searchPlaceholder,
}: MobileTaskToolbarProps) {
  const showJump = showProjectJump && projects.length > 1 && !!onProjectJump;
  const timeFilterActive = selectedScope !== ALL_PROJECTS_ID;
  const landscapeSearch = showCardSearch && !!onCardQueryChange;

  return (
    <div className="no-print roomy:hidden mt-1" data-tour="time-filters">
      <div className="flex items-center gap-1 min-w-0">
        <label className="sr-only" htmlFor="mobile-view-mode">
          Layout
        </label>
        <select
          id="mobile-view-mode"
          value={viewMode}
          onChange={(e) => onSelectViewMode(e.target.value as TaskViewMode)}
          className={`${SELECT_PRIMARY} flex-[1.1] min-w-[4.75rem] land-compact:flex-none land-compact:max-w-[7rem]`}
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
          className={`${SELECT_SECONDARY} flex-1 min-w-[4.25rem] land-compact:flex-none land-compact:max-w-[7.5rem]`}
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
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-surface-border dark:border-surface-border text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-hover transition-colors"
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
              className={`${SELECT_SECONDARY} flex-[1.1] min-w-[4.5rem] land-compact:max-w-[8rem]`}
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
          <TaskSearchField
            value={cardQuery}
            onChange={onCardQueryChange ?? (() => {})}
            size="compact"
            className="hidden land-compact:block flex-1 min-w-[7rem]"
            placeholder={searchPlaceholder}
          />
        )}

        {showManageProjects && (
          <button
            type="button"
            onClick={onManageProjects}
            className="shrink-0 inline-flex items-center justify-center gap-0.5 px-2 py-1 min-h-[2rem] rounded-md border border-surface-border dark:border-surface-border bg-surface-elevated text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-600/50 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            data-tour="manage-projects"
            title="Projects — manage, pin, share, delete, import"
            aria-label="Manage projects"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-2a2 2 0 100 4m0-4a2 2 0 110 4" />
            </svg>
            <span className="text-xs font-semibold">Projects</span>
          </button>
        )}

        {onAddProject && (
          <AddProjectButton onClick={onAddProject} size="sm" shortLabel="Project" />
        )}
      </div>
    </div>
  );
}
