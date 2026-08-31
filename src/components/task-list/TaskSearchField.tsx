"use client";

interface TaskSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** `toolbar` sits in When/Layout; `compact` is for portrait / landscape chrome. */
  size?: "toolbar" | "compact";
  className?: string;
  placeholder?: string;
}

export function TaskSearchField({
  value,
  onChange,
  size = "toolbar",
  className = "",
  placeholder = "Filter projects or tasks…",
}: TaskSearchFieldProps) {
  const compact = size === "compact";
  return (
    <label className={`relative block min-w-0 ${className}`.trim()}>
      <span className="sr-only">Search projects and tasks</span>
      <svg
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 ${
          compact ? "left-2 w-3.5 h-3.5" : "left-2.5 w-3.5 h-3.5"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={compact ? "Filter…" : placeholder}
        className={
          compact
            ? "w-full pl-7 pr-2.5 py-1 min-h-[1.875rem] text-xs rounded-md border border-[var(--control-border)] dark:border-blue-500/45 bg-[var(--surface-elevated)] dark:bg-[#131d30] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-400"
            : "w-full pl-8 pr-3 py-1.5 min-h-[2rem] text-sm rounded-lg border border-[var(--control-border)] dark:border-blue-500/45 bg-[var(--surface-elevated)] dark:bg-[#131d30] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-400 shadow-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
        }
        aria-label="Filter projects or tasks"
        data-tour="card-filter"
      />
    </label>
  );
}
