"use client";

import { formatOverdueChip, formatOverdueLabel } from "@/components/task-list/utils";

export interface WorstOverdueHint {
  daysLate: number;
  title: string;
  projectName: string;
  projectId: string;
}

interface TaskUrgencySummaryProps {
  overdueCount: number;
  dueTodayCount: number;
  onViewOverdue?: () => void;
  onViewToday?: () => void;
  /** Most stale overdue item — surfaced for cross-project triage. */
  worstOverdue?: WorstOverdueHint | null;
  /** Jump to the project card for the worst overdue item. */
  onJumpToWorst?: () => void;
  className?: string;
  /** Compact chips for the title row — side-by-side, shorter labels. */
  compact?: boolean;
}

/** Shared sizing so late / today / worst / done-today tablets align. */
export const STATUS_PILL_COMPACT =
  "inline-flex items-center justify-center gap-1 h-7 min-h-[1.75rem] px-2 rounded-md text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 transition-colors";

/** Urgency summary bar — horizontal scroll when chips overflow. */
export function TaskUrgencySummary({
  overdueCount,
  dueTodayCount,
  onViewOverdue,
  onViewToday,
  worstOverdue = null,
  onJumpToWorst,
  className = "",
  compact = false,
}: TaskUrgencySummaryProps) {
  // Compact title row: only “N late”. Due-today / −Nd live elsewhere (When filter, cards).
  if (compact) {
    if (overdueCount === 0) return null;
  } else if (overdueCount === 0 && dueTodayCount === 0) {
    return null;
  }

  const aria =
    overdueCount > 0 && dueTodayCount > 0
      ? `${overdueCount} overdue, ${dueTodayCount} due today`
      : overdueCount > 0
        ? `${overdueCount} overdue`
        : `${dueTodayCount} due today`;

  const worstTitle = worstOverdue
    ? `Open ${worstOverdue.projectName}: “${worstOverdue.title}” (${formatOverdueLabel(worstOverdue.daysLate)})`
    : undefined;

  const handleWorst = () => {
    if (onJumpToWorst) onJumpToWorst();
    else onViewOverdue?.();
  };

  const pad = compact
    ? STATUS_PILL_COMPACT
    : "inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[2rem] rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors";

  return (
    <div
      className={`urgency-summary-bar inline-flex items-center gap-1.5 max-w-full min-w-0 overflow-x-auto overflow-y-hidden scrollbar-hide ${className}`}
      role="status"
      aria-label={compact ? `${overdueCount} overdue` : aria}
    >
      {overdueCount > 0 && (
        <button
          type="button"
          onClick={onViewOverdue}
          className={`urgency-pill ${pad}`}
          title={`${overdueCount} overdue — view all`}
        >
          {!compact && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full urgency-chip--mid text-xs font-bold tabular-nums leading-none shrink-0">
              {overdueCount}
            </span>
          )}
          {compact && <span className="tabular-nums font-bold">{overdueCount}</span>}
          <span className="leading-none">{compact ? "late" : "overdue"}</span>
        </button>
      )}
      {!compact && dueTodayCount > 0 && (
        <button
          type="button"
          onClick={onViewToday}
          className={`${pad} border border-orange-200/80 dark:border-orange-800/50 bg-white dark:bg-[#131d30] text-orange-700 dark:text-orange-300 hover:bg-orange-50/80 dark:hover:bg-orange-900/20 shadow-sm`}
          title={`${dueTodayCount} due today`}
        >
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold tabular-nums leading-none shrink-0">
            {dueTodayCount}
          </span>
          <span className="leading-none whitespace-nowrap">due today</span>
        </button>
      )}
      {!compact && worstOverdue && worstOverdue.daysLate >= 1 && (
        <button
          type="button"
          onClick={handleWorst}
          className={`urgency-pill ${pad} cursor-pointer max-w-[14rem]`}
          title={worstTitle}
          aria-label={worstTitle}
        >
          <span className="inline-flex items-center justify-center h-5 px-1.5 rounded text-[10px] font-bold tabular-nums leading-none whitespace-nowrap shrink-0 urgency-chip--mid">
            {formatOverdueChip(worstOverdue.daysLate)}
          </span>
          <span className="leading-none truncate min-w-0">
            {worstOverdue.projectName}
            <span className="font-medium opacity-90"> — jump</span>
          </span>
        </button>
      )}
    </div>
  );
}
