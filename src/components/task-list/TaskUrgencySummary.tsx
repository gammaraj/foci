"use client";

interface TaskUrgencySummaryProps {
  overdueCount: number;
  dueTodayCount: number;
  onViewOverdue?: () => void;
  onViewToday?: () => void;
  className?: string;
}

/** Single urgency strip — overdue (red) and due today (orange) with explicit labels. */
export function TaskUrgencySummary({
  overdueCount,
  dueTodayCount,
  onViewOverdue,
  onViewToday,
  className = "",
}: TaskUrgencySummaryProps) {
  if (overdueCount === 0 && dueTodayCount === 0) return null;

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}
      role="status"
      aria-label={
        overdueCount > 0 && dueTodayCount > 0
          ? `${overdueCount} overdue, ${dueTodayCount} due today`
          : overdueCount > 0
            ? `${overdueCount} overdue`
            : `${dueTodayCount} due today`
      }
    >
      {overdueCount > 0 && (
        <button
          type="button"
          onClick={onViewOverdue}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap border border-red-200/80 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100/80 dark:hover:bg-red-900/40 transition-colors touch-target-sm !min-h-0"
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
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap border border-orange-200/80 dark:border-orange-800/50 bg-white dark:bg-[#131d30] text-orange-700 dark:text-orange-300 hover:bg-orange-50/80 dark:hover:bg-orange-900/20 transition-colors shadow-sm touch-target-sm !min-h-0"
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
