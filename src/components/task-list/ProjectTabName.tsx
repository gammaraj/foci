/** Project tab label — full description first when name is a short acronym (CD, BK, …). */
export function ProjectTabName({
  project,
  variant = "tab",
}: {
  project: { name: string; description?: string };
  /** tab: acronym tabs show description + code badge. column: name first with muted subtitle. */
  variant?: "tab" | "column";
}) {
  const desc = project.description?.trim();

  if (variant === "column") {
    if (desc && desc !== project.name) {
      return (
        <span className="block min-w-0 max-w-full">
          <span className="block truncate font-bold text-slate-900 dark:text-white leading-tight">
            {project.name}
          </span>
          <span
            className="block truncate text-xs app-text-meta font-medium leading-tight mt-0.5 text-slate-500 dark:text-slate-400"
            title={desc}
          >
            {desc}
          </span>
        </span>
      );
    }
    return <span className="truncate font-bold text-slate-900 dark:text-white">{project.name}</span>;
  }

  if (project.name.length <= 4 && desc) {
    const label = desc.length > 28 ? `${desc.slice(0, 28)}…` : desc;
    return (
      <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
        <span className="truncate font-medium">{label}</span>
        <span
          className="shrink-0 text-xs app-badge font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-slate-200/90 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400"
          title={`Project code: ${project.name}`}
        >
          {project.name}
        </span>
      </span>
    );
  }
  return <span className="truncate">{project.name}</span>;
}
