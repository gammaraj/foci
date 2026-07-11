"use client";

interface TimeFilterBannerProps {
  description: string;
  datedCount: number;
  undatedCount?: number;
  overdueCount?: number;
  projectName?: string;
  className?: string;
}

/** Clarifies active Today/Week/Month/Year scope in card, bucket, and list views. */
export function TimeFilterBanner({
  description,
  datedCount,
  undatedCount = 0,
  overdueCount = 0,
  projectName,
  className = "",
}: TimeFilterBannerProps) {
  return (
    <div
      className={`mx-3 sm:mx-4 mt-2 mb-0 px-3 py-2 rounded-lg border border-blue-200/80 dark:border-blue-800/50 bg-blue-50/70 dark:bg-blue-950/25 text-sm app-text-meta text-slate-600 dark:text-slate-300 ${className}`}
      role="status"
    >
      <p className="app-inline-meta">
        <span className="font-semibold text-blue-800 dark:text-blue-200">Showing: {description}</span>
        {projectName && (
          <span className="font-medium text-slate-700 dark:text-slate-200">{projectName}</span>
        )}
        <span>{datedCount} due</span>
        {undatedCount > 0 && <span>{undatedCount} without a date hidden</span>}
        {overdueCount > 0 && (
          <span className="text-red-600 dark:text-red-400 font-medium">{overdueCount} overdue</span>
        )}
      </p>
    </div>
  );
}
