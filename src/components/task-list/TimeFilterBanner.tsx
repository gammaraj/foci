"use client";

interface TimeFilterBannerProps {
  description: string;
  datedCount: number;
  undatedCount?: number;
  overdueCount?: number;
  projectName?: string;
  className?: string;
  /** Clears the active Today/Week/Month/Year scope. */
  onClear?: () => void;
}

/** Clarifies active Today/Week/Month/Year scope in card, bucket, and list views. */
export function TimeFilterBanner({
  description,
  datedCount,
  undatedCount = 0,
  overdueCount = 0,
  projectName,
  className = "",
  onClear,
}: TimeFilterBannerProps) {
  return (
    <div
      className={`panel-inset-x mt-2 mb-0 px-2.5 sm:px-3 py-2 rounded-lg border border-blue-200/80 dark:border-blue-800/50 bg-blue-50/70 dark:bg-blue-950/25 text-sm app-text-meta text-slate-600 dark:text-slate-300 ${className}`}
      role="status"
    >
      <div className="flex items-start gap-2">
        <p className="app-inline-meta flex-1 min-w-0">
          <span className="font-semibold text-blue-800 dark:text-blue-200">Showing: {description}</span>
          {projectName && (
            <span className="font-medium text-slate-700 dark:text-slate-200">{projectName}</span>
          )}
          <span>{datedCount} due</span>
          {undatedCount > 0 && <span>{undatedCount} without a date hidden</span>}
          {overdueCount > 0 && (
            <span className="urgency-text--mild font-medium">{overdueCount} overdue</span>
          )}
        </p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 transition-colors touch-target-sm !min-h-8"
            aria-label="Clear time filter — show all times"
            title="Clear filter"
          >
            <span>Clear</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
