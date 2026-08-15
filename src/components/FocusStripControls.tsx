import React from "react";

export function MiniPlayPauseIcon({ playing, size = "md" }: { playing: boolean; size?: "sm" | "md" | "lg" }) {
  const iconClass =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-[1.125rem] h-[1.125rem]";
  if (playing) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="6" y="5" width="4.5" height="14" rx="1" />
        <rect x="13.5" y="5" width="4.5" height="14" rx="1" />
      </svg>
    );
  }
  return (
    <svg className={`${iconClass} ml-px`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.8v12.4c0 .5.55.8 1 .5l10.2-6.4a.6.6 0 000-1l-10.2-6.3c-.45-.3-1 0-1 .4z" />
    </svg>
  );
}

/** Shared dock control size — compact so the Tasks focus bar stays short. */
const DOCK_BTN =
  "w-7 h-7 rounded-md flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";

export function miniPlayButtonClass(playing: boolean, dock = false, emphasizeStart = false) {
  if (dock) {
    if (playing) {
      return `${DOCK_BTN} bg-blue-600 text-white hover:bg-blue-700`;
    }
    if (emphasizeStart) {
      return `${DOCK_BTN} bg-blue-600 text-white hover:bg-blue-700`;
    }
    return `${DOCK_BTN} text-blue-600 dark:text-blue-400 hover:bg-slate-100/90 dark:hover:bg-white/10`;
  }

  const base =
    "w-9 h-9 rounded-md flex items-center justify-center touch-target-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60";
  if (playing) {
    return `${base} bg-blue-600 text-white hover:bg-blue-700`;
  }
  if (emphasizeStart) {
    return `${base} bg-blue-600 text-white hover:bg-blue-700`;
  }
  return `${base} text-blue-600 dark:text-blue-400 hover:bg-slate-100/90 dark:hover:bg-white/10`;
}

export function MiniResetIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconClass =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-[1.125rem] h-[1.125rem]";
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export function miniResetButtonClass(dock = false) {
  if (dock) {
    return `${DOCK_BTN} text-slate-500 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200`;
  }
  return "w-9 h-9 rounded-md flex items-center justify-center touch-target-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60";
}

/** Shortcuts / secondary dock actions — matches reset ghost style.
 *  Hint state stays visually neutral (blue dot only) so it doesn’t look selected. */
export function miniDockGhostButtonClass(_active = false) {
  return `${DOCK_BTN} relative text-slate-500 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200`;
}
