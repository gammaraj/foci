import type { TaskPriority } from "@/lib/types";
import { CHIP_TONE, META_CHIP_CLASS } from "@/components/task-list/utils";

export function TaskPriorityBadge({
  priority,
}: {
  priority: TaskPriority;
  size?: "default" | "compact";
}) {
  const label = priority === 1 ? "High" : priority === 2 ? "Med" : "Low";
  const tone = priority === 1 ? CHIP_TONE.high : priority === 2 ? CHIP_TONE.med : CHIP_TONE.low;

  return (
    <span className={`${META_CHIP_CLASS} ${tone}`} title={`${label} priority`}>
      {label}
    </span>
  );
}
