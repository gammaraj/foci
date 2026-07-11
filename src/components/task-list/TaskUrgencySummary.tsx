"use client";

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
  if (overdueCount === 0 && dueTodayCount === 0) return null;

  const aria =
    overdueCount > 0 && dueTodayCount > 0
      ? `${overdueCount} overdue, ${dueTodayCount} due today`
      : overdueCount > 0
        ? `${overdueCount} overdue`
        : `${dueTodayCount} due today`;

  const worstLabel = worstOverdue
    ? `${worstOverdue.projectName} · ${worstOverdue.daysLate}d`
    : null;
  const worstTitle = worstOverdue
    ? `Jump to ${worstOverdue.projectName}: “${worstOverdue.title}” (${worstOverdue.daysLate} day${worstOverdue.daysLate === 1 ? "" : "s"} overdue)`
    : undefined;

  const handleWorst = () => {
    if (onJumpToWorst) onJumpToWorst();
    else onViewOverdue?.();
  };

  const pad = compact ? "px-1.5 py-0.5 rounded-md text-xs" : "px-2.5 py-1.5 rounded-lg text-xs sm:text-sm";

  return (
    <div
      className={`urgency-summary-bar inline-flex items-center gap-1.5 max-w-full overflow-x-auto scrollbar-hide ${className}`}
      role="status"
      aria-label={aria}
    >
      {overdueCount > 0 && (
        <button
          type="button"
          onClick={onViewOverdue}
          className={`inline-flex items-center gap-1 sm:gap-1.5 ${pad} font-semibold whitespace-nowrap shrink-0 border border-red-200/80 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100/80 dark:hover:bg-red-900/40 transition-colors`}
          title={`${overdueCount} overdue — view all`}
        >
          {!compact && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold tabular-nums leading-none">
              {overdueCount}
            </span>
          )}
          {compact && <span className="tabular-nums font-bold">{overdueCount}</span>}
          <span className="leading-none">{compact ? "late" : "overdue"}</span>
        </button>
      )}
      {worstOverdue && worstOverdue.daysLate >= 1 && (
        <button
          type="button"
          onClick={handleWorst}
          className={`inline-flex items-center gap-1 sm:gap-1.5 ${pad} font-semibold whitespace-nowrap shrink-0 border transition-colors max-w-[14rem] ${
            worstOverdue.daysLate >= 5
              ? "border-red-800/70 dark:border-red-500/60 bg-red-700 text-white hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-700"
              : worstOverdue.daysLate >= 3
                ? "border-red-500/80 dark:border-red-600/60 bg-red-600 text-white hover:bg-red-700"
                : "border-red-300/90 dark:border-red-700/50 bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200 hover:bg-red-200/90"
          }`}
          title={worstTitle}
        >
          <span
            className={`inline-flex items-center justify-center min-w-[1.35rem] h-4 sm:h-5 px-1 rounded text-[10px] font-bold tabular-nums leading-none ${
              worstOverdue.daysLate >= 3 ? "bg-black/20 text-white" : "bg-red-600 text-white"
            }`}
          >
            {worstOverdue.daysLate}d
          </span>
          <span className="leading-none truncate">
            {compact ? worstLabel : (
              <>
                {worstOverdue.projectName}
                <span className="font-medium opacity-90"> — jump</span>
              </>
            )}
          </span>
        </button>
      )}
      {dueTodayCount > 0 && (
        <button
          type="button"
          onClick={onViewToday}
          className={`inline-flex items-center gap-1 sm:gap-1.5 ${pad} font-medium whitespace-nowrap shrink-0 border border-orange-200/80 dark:border-orange-800/50 bg-white dark:bg-[#131d30] text-orange-700 dark:text-orange-300 hover:bg-orange-50/80 dark:hover:bg-orange-900/20 transition-colors ${compact ? "" : "shadow-sm"}`}
          title={`${dueTodayCount} due today`}
        >
          {!compact && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold tabular-nums leading-none">
              {dueTodayCount}
            </span>
          )}
          {compact && <span className="tabular-nums font-bold">{dueTodayCount}</span>}
          <span className="leading-none">{compact ? "today" : "due today"}</span>
        </button>
      )}
    </div>
  );
}
