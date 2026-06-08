import React from "react";

export function MiniPlayPauseIcon({ playing, size = "md" }: { playing: boolean; size?: "sm" | "md" }) {
  const className = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  if (playing) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="6" y="5" width="4.5" height="14" rx="1" />
        <rect x="13.5" y="5" width="4.5" height="14" rx="1" />
      </svg>
    );
  }
  return (
    <svg className={`${className} ml-px`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.8v12.4c0 .5.55.8 1 .5l10.2-6.4a.6.6 0 000-1l-10.2-6.3c-.45-.3-1 0-1 .4z" />
    </svg>
  );
}

export function miniPlayButtonClass(playing: boolean, dock = false, emphasizeStart = false) {
  const size = dock ? "w-7 h-7" : "w-8 h-8";
  const base = `${size} rounded-full flex items-center justify-center touch-target-sm transition-colors`;
  if (playing) {
    return `${base} border border-blue-500/70 bg-blue-600 text-white shadow-sm hover:bg-blue-700`;
  }
  if (emphasizeStart) {
    return `${base} border border-blue-500/70 bg-blue-600 text-white shadow-sm hover:bg-blue-700 ring-2 ring-blue-400/35`;
  }
  return `${base} border border-slate-300 dark:border-[#3a5070] bg-white dark:bg-[#1a2d4a] text-blue-600 dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-900/25 hover:border-blue-400/60`;
}

export function MiniResetIcon({ size = "md" }: { size?: "sm" | "md" }) {
  const className = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
    </svg>
  );
}

export function miniResetButtonClass(dock = false) {
  const size = dock ? "w-7 h-7" : "w-8 h-8";
  return `${size} rounded-full flex items-center justify-center touch-target-sm border border-slate-300 dark:border-[#3a5070] bg-white dark:bg-[#1a2d4a] text-slate-500 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-[#243350] hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400/60 transition-colors`;
}
