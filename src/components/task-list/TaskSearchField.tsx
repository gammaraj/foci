"use client";

import { SearchIcon } from "@/components/ui/icons";

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
      <span className="sr-only">{placeholder}</span>
      <SearchIcon
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 ${
          compact ? "left-2" : "left-2.5"
        }`}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={compact ? "Filter…" : placeholder}
        className={
          compact
            ? "control-field control-field--sm w-full pl-7 pr-2.5 py-1 min-h-[1.875rem] text-xs app-placeholder"
            : "control-field w-full pl-8 pr-3 py-1.5 min-h-[2rem] text-sm app-placeholder shadow-sm"
        }
        aria-label={placeholder}
        data-tour="card-filter"
      />
    </label>
  );
}
