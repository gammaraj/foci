/** Project tab label with breathing room between acronym and description. */
export function ProjectTabName({
  project,
}: {
  project: { name: string; description?: string };
}) {
  const desc = project.description?.trim();
  if (project.name.length <= 4 && desc) {
    const short = desc.length > 18 ? `${desc.slice(0, 18)}…` : desc;
    return (
      <span className="inline-flex items-center gap-2 min-w-0 max-w-full">
        <span className="shrink-0 font-medium">{project.name}</span>
        <span
          className="text-slate-500 dark:text-slate-500/90 shrink-0 select-none px-0.5"
          aria-hidden
        >
          ·
        </span>
        <span className="truncate font-normal">{short}</span>
      </span>
    );
  }
  return <span className="truncate">{project.name}</span>;
}
