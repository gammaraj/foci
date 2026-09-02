"use client";

/** Shared open / done / late counts — consistent sizing in bucket headers and project list. */
export function ProjectTaskCounts({
  open,
  completed = 0,
  overdue = 0,
  showOverdue = false,
  variant = "badge",
}: {
  open: number;
  completed?: number;
  overdue?: number;
  /** Manage list only — cards/buckets already show −Nd on rows and a global late pill. */
  showOverdue?: boolean;
  variant?: "badge" | "inline";
}) {
  const title = `${open} open · ${completed} completed${overdue > 0 ? ` · ${overdue} overdue` : ""}`;

  const numClass = "font-semibold tabular-nums text-slate-900 dark:text-slate-50";
  const labelClass = "font-medium text-slate-700 dark:text-slate-300";
  const doneClass = "font-medium tabular-nums text-emerald-700 dark:text-emerald-300";
  const lateClass = "font-medium tabular-nums urgency-text--mild";

  const content = (
    <span className="inline-flex items-center flex-wrap gap-x-1">
      <span>
        <span className={numClass}>{open}</span>
        <span className={labelClass}> open</span>
      </span>
      {completed > 0 && (
        <>
          <span className={labelClass} aria-hidden>
            ·
          </span>
          <span className={doneClass}>{completed} done</span>
        </>
      )}
      {showOverdue && overdue > 0 && (
        <>
          <span className={labelClass} aria-hidden>
            ·
          </span>
          <span className={lateClass}>{overdue} late</span>
        </>
      )}
    </span>
  );

  if (variant === "inline") {
    return (
      <span className="text-xs app-text-meta tabular-nums leading-snug" title={title}>
        {content}
      </span>
    );
  }

  return (
    <span
      title={title}
      className="inline-flex items-center text-xs app-text-meta tabular-nums leading-snug rounded-full px-2.5 py-1 shrink-0 max-w-full overflow-hidden bg-slate-100/95 dark:bg-surface-hover/90 border border-slate-200/90 dark:border-surface-border/70 text-slate-800 dark:text-slate-100"
    >
      {content}
    </span>
  );
}
