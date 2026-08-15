/** Shared “Add project” control — opens Projects manage (create is at the top). */
export function AddProjectButton({
  onClick,
  size = "md",
  className = "",
}: {
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const pad =
    size === "sm"
      ? "gap-1 px-2 py-1.5 min-h-[2rem] text-xs"
      : "gap-1.5 px-2.5 py-1.5 min-h-[2.25rem] text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center justify-center ${pad} font-semibold rounded-lg border border-blue-300/80 dark:border-blue-600/50 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 dark:hover:border-blue-500 transition-colors ${className}`}
      title="Add a new project"
      aria-label="Add project"
      data-tour="add-project"
    >
      <svg className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span>Add project</span>
    </button>
  );
}
