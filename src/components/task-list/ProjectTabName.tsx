/** Project tab label — full description first when name is a short acronym (CD, BK, …). */
export function ProjectTabName({
  project,
}: {
  project: { name: string; description?: string };
}) {
  const desc = project.description?.trim();
  if (project.name.length <= 4 && desc) {
    const label = desc.length > 28 ? `${desc.slice(0, 28)}…` : desc;
    return (
      <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
        <span className="truncate font-medium">{label}</span>
        <span
          className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-slate-200/90 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400"
          title={`Project code: ${project.name}`}
        >
          {project.name}
        </span>
      </span>
    );
  }
  return <span className="truncate">{project.name}</span>;
}
