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

/** Shared dock control size — rounded square, not mismatched circles. */
const DOCK_BTN =
  "w-8 h-8 rounded-lg flex items-center justify-center touch-target-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50";

export function miniPlayButtonClass(playing: boolean, dock = false, emphasizeStart = false) {
  if (dock) {
    if (playing) {
      return `${DOCK_BTN} bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm`;
    }
    if (emphasizeStart) {
      return `${DOCK_BTN} bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm ring-2 ring-cyan-400/30`;
    }
    return `${DOCK_BTN} text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-cyan-600 dark:hover:text-cyan-400`;
  }

  const base =
    "w-8 h-8 rounded-full flex items-center justify-center touch-target-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60";
  if (playing) {
    return `${base} border border-cyan-500/70 bg-cyan-600 text-white shadow-sm hover:bg-cyan-700`;
  }
  if (emphasizeStart) {
    return `${base} border border-cyan-500/70 bg-cyan-600 text-white shadow-sm hover:bg-cyan-700 ring-2 ring-cyan-400/35`;
  }
  return `${base} border border-slate-300 dark:border-[#3a5070] bg-white dark:bg-[#1a2d4a] text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50/80 dark:hover:bg-cyan-900/25 hover:border-cyan-400/60`;
}

export function MiniResetIcon({ size = "md" }: { size?: "sm" | "md" }) {
  const className = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export function miniResetButtonClass(dock = false) {
  if (dock) {
    return `${DOCK_BTN} text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200`;
  }
  return "w-8 h-8 rounded-full flex items-center justify-center touch-target-sm border border-slate-300 dark:border-[#3a5070] bg-white dark:bg-[#1a2d4a] text-slate-500 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-[#243350] hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60";
}

/** Shortcuts / secondary dock actions — matches reset ghost style. */
export function miniDockGhostButtonClass(active = false) {
  if (active) {
    return `${DOCK_BTN} relative text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30`;
  }
  return `${DOCK_BTN} relative text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200`;
}
