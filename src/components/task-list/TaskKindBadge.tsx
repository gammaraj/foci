import type { TaskKind } from "@/lib/types";

export function TaskKindBadge({
  kind,
  size = "default",
}: {
  kind: TaskKind;
  size?: "default" | "compact";
}) {
  if (kind === "task") return null;

  const label = kind === "note" ? "NOTE" : "Q";
  const title = kind === "note" ? "Note" : "Question";
  const colors =
    kind === "note"
      ? "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600/60"
      : "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50";

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase rounded border shrink-0 ${
        size === "compact" ? "px-1 py-0 text-xs leading-tight" : "px-1.5 py-0.5 text-xs"
      } ${colors}`}
      title={title}
    >
      {label}
    </span>
  );
}
