import type { RecurrenceType } from "@/lib/types";
import { CHIP_TONE, META_CHIP_CLASS } from "@/components/task-list/utils";

export function TaskRecurrenceBadge({
  recurrence,
}: {
  recurrence: RecurrenceType;
  size?: "default" | "compact";
}) {
  const label = recurrence.charAt(0).toUpperCase() + recurrence.slice(1);
  const title = `Repeats ${recurrence}`;

  return (
    <span className={`${META_CHIP_CLASS} ${CHIP_TONE.recurrence}`} title={title}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {label}
    </span>
  );
}
