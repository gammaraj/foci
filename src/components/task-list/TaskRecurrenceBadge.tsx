import type { RecurrenceType } from "@/lib/types";

export function TaskRecurrenceBadge({
  recurrence,
  size = "default",
}: {
  recurrence: RecurrenceType;
  size?: "default" | "compact";
}) {
  const label = recurrence.toUpperCase();
  const title = `Repeats ${recurrence}`;

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-semibold uppercase rounded border shrink-0 bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600/60 ${
        size === "compact" ? "px-1 py-0 text-xs leading-tight" : "px-1.5 py-0.5 text-xs"
      }`}
      title={title}
    >
      <svg className={size === "compact" ? "w-2.5 h-2.5" : "w-3 h-3"} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {label}
    </span>
  );
}
