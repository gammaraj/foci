import { isProjectCodeName } from "@/components/task-list/utils";

/** Project tab label — description first only for short ALL-CAPS codes (CD, BK). */
export function ProjectTabName({
  project,
}: {
  project: { name: string; description?: string };
}) {
  const desc = project.description?.trim();

  if (isProjectCodeName(project.name) && desc) {
    return (
      <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
        <span className="truncate font-medium" title={desc}>
          {desc}
        </span>
        <span
          className="shrink-0 text-xs app-badge font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-slate-200/90 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400"
          title={`Project code: ${project.name}`}
        >
          {project.name}
        </span>
      </span>
    );
  }
  return <span className="truncate">{project.name}</span>;
}
