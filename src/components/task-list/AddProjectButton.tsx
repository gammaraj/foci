/** Shared “Add project” control — solid primary CTA (opens Projects manage). */
export function AddProjectButton({
  onClick,
  size = "md",
  className = "",
  label = "Add project",
  shortLabel,
}: {
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
  label?: string;
  /** When set, shown below `min-[380px]`; icon-only otherwise keeps toolbar compact. */
  shortLabel?: string;
}) {
  const pad =
    size === "sm"
      ? "gap-1 px-2.5 py-1.5 min-h-[2rem] text-xs"
      : "gap-1.5 px-3 py-2 min-h-[2.25rem] text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-primary shrink-0 ${pad} ${className}`}
      title="Add a new project"
      aria-label="Add project"
      data-tour="add-project"
    >
      <svg className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M12 4v16m8-8H4" />
      </svg>
      {shortLabel ? (
        <span className="hidden min-[380px]:inline">{shortLabel}</span>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
