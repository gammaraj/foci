"use client";

import { getToday, getTomorrow } from "@/lib/dates";
import { DueDateField } from "@/components/task-list/DueDateField";
import {
  CHIP_TONE,
  META_CHIP_CLASS,
  formatDueChip,
  formatOverdueChip,
  formatOverdueLabel,
  getDaysOverdue,
  isDueDateOverdue,
  overdueDayChipClass,
} from "@/components/task-list/utils";

export function DueChip({
  dueDate,
  blocked = false,
  /** Cards/list already show −Nd — hide the duplicate date chip. */
  skipIfOverdue = false,
  taskId,
  onSetDueDate,
}: {
  dueDate: string;
  blocked?: boolean;
  skipIfOverdue?: boolean;
  taskId?: string;
  onSetDueDate?: (taskId: string, date: string | undefined) => void;
}) {
  const overdue = !blocked && isDueDateOverdue(dueDate);
  if (overdue && skipIfOverdue) return null;

  const daysLate = overdue ? getDaysOverdue(dueDate) : 0;
  const isToday = dueDate === getToday();
  const isTomorrow = dueDate === getTomorrow();
  const interactive = !!(taskId && onSetDueDate);
  const label = overdue ? formatOverdueChip(daysLate) : formatDueChip(dueDate);

  const tone = overdue
    ? overdueDayChipClass(daysLate)
    : blocked
      ? CHIP_TONE.waiting
      : isToday
        ? CHIP_TONE.today
        : isTomorrow
          ? CHIP_TONE.tomorrow
          : CHIP_TONE.due;

  const title = blocked
    ? "Waiting on external blocker"
    : overdue
      ? `${formatOverdueLabel(daysLate)}${interactive ? " — click to change" : ""}`
      : isToday
        ? "Due today"
        : isTomorrow
          ? "Due tomorrow"
          : interactive
            ? `Due ${label} — click to change`
            : `Due ${label}`;

  const className = `${META_CHIP_CLASS} ${tone} ${
    interactive ? "cursor-pointer" : ""
  }`;

  const body = <span title={title}>{label}</span>;

  if (!interactive) {
    return (
      <span className={className} title={title}>
        {label}
      </span>
    );
  }

  return (
    <DueDateField
      value={dueDate}
      onChange={(date) => onSetDueDate!(taskId!, date)}
      ariaLabel="Change due date"
      className={className}
    >
      {body}
    </DueDateField>
  );
}
