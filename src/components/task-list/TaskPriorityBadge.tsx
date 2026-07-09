import type { TaskPriority } from "@/lib/types";

export function TaskPriorityBadge({
  priority,
  size = "default",
}: {
  priority: TaskPriority;
  size?: "default" | "compact";
}) {
  const label = priority === 1 ? "HIGH" : priority === 2 ? "MED" : "LOW";
  const colors =
    priority === 1
      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50"
      : priority === 2
        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50"
        : "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50";

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase rounded border shrink-0 ${
        size === "compact" ? "px-1 py-0 text-xs leading-tight" : "px-1.5 py-0.5 text-xs"
      } ${colors}`}
      title={`${label} priority`}
    >
      {label}
    </span>
  );
}
