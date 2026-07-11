"use client";

export interface WorstOverdueHint {
  daysLate: number;
  title: string;
  projectName: string;
}

interface TaskUrgencySummaryProps {
  overdueCount: number;
  dueTodayCount: number;
  onViewOverdue?: () => void;
  onViewToday?: () => void;
  /** Most stale overdue item — surfaced for cross-project triage. */
  worstOverdue?: WorstOverdueHint | null;
  className?: string;
  /** Compact chips for the title row — side-by-side, shorter labels. */
  compact?: boolean;
}

/** Urgency chips — overdue (red) and due today (orange) with explicit labels. */
export function TaskUrgencySummary({
  overdueCount,
  dueTodayCount,
  onViewOverdue,
  onViewToday,
  worstOverdue = null,
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
    ? `${worstOverdue.projectName} · ${worstOverdue.daysLate}d late`
    : null;
  const worstTitle = worstOverdue
    ? `Most overdue: “${worstOverdue.title}” in ${worstOverdue.projectName} (${worstOverdue.daysLate} day${worstOverdue.daysLate === 1 ? "" : "s"} late)`
    : undefined;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 flex-nowrap ${className}`}
        role="status"
        aria-label={aria}
      >
        {overdueCount > 0 && (
          <button
            type="button"
            onClick={onViewOverdue}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap border border-red-200/70 dark:border-red-800/50 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300"
            title={`${overdueCount} overdue — view all`}
          >
            <span className="tabular-nums font-bold">{overdueCount}</span>
            <span className="leading-none">late</span>
          </button>
        )}
        {worstLabel && (
          <button
            type="button"
            onClick={onViewOverdue}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap border border-red-300/80 dark:border-red-700/60 bg-red-100/80 dark:bg-red-950/50 text-red-800 dark:text-red-200 max-w-[9rem] truncate"
            title={worstTitle}
          >
            {worstLabel}
          </button>
        )}
        {dueTodayCount > 0 && (
          <button
            type="button"
            onClick={onViewToday}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap border border-orange-200/70 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
            title={`${dueTodayCount} due today`}
          >
            <span className="tabular-nums font-bold">{dueTodayCount}</span>
            <span className="leading-none">today</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}
      role="status"
      aria-label={aria}
    >
      {overdueCount > 0 && (
        <button
          type="button"
          onClick={onViewOverdue}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap border border-red-200/80 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100/80 dark:hover:bg-red-900/40 transition-colors"
          title={`${overdueCount} overdue task${overdueCount === 1 ? "" : "s"} — view all`}
        >
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold tabular-nums leading-none">
            {overdueCount}
          </span>
          <span className="leading-none">overdue</span>
        </button>
      )}
      {worstOverdue && worstOverdue.daysLate >= 3 && (
        <button
          type="button"
          onClick={onViewOverdue}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap border border-red-300/90 dark:border-red-700/60 bg-red-100/90 dark:bg-red-950/45 text-red-800 dark:text-red-200 hover:bg-red-200/80 dark:hover:bg-red-900/50 transition-colors max-w-[16rem]"
          title={worstTitle}
        >
          <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 rounded-md bg-red-700 text-white text-[10px] font-bold tabular-nums leading-none">
            {worstOverdue.daysLate}d
          </span>
          <span className="leading-none truncate">
            {worstOverdue.projectName}
            <span className="font-medium opacity-80"> most late</span>
          </span>
        </button>
      )}
      {dueTodayCount > 0 && (
        <button
          type="button"
          onClick={onViewToday}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap border border-orange-200/80 dark:border-orange-800/50 bg-white dark:bg-[#131d30] text-orange-700 dark:text-orange-300 hover:bg-orange-50/80 dark:hover:bg-orange-900/20 transition-colors shadow-sm"
          title={`${dueTodayCount} task${dueTodayCount === 1 ? "" : "s"} due today`}
        >
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold tabular-nums leading-none">
            {dueTodayCount}
          </span>
          <span className="leading-none">due today</span>
        </button>
      )}
    </div>
  );
}
