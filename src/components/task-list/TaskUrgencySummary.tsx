"use client";

interface TaskUrgencySummaryProps {
  overdueCount: number;
  dueTodayCount: number;
  onViewOverdue?: () => void;
  onViewToday?: () => void;
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
