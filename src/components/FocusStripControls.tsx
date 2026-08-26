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

/** Page-title row icon actions (Print, ⋮, expand) — icon-only, same size. */
export const FOCUS_BAR_ICON_BTN =
  "items-center justify-center p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors";

/** Music / Timer section labels — sentence case, quieter than the page title. */
export const FOCUS_STRIP_LABEL =
  "text-xs font-semibold tracking-tight leading-none shrink-0";

/** Bordered chips for source, track, and timer duration. */
export const FOCUS_STRIP_CHIP =
  "inline-flex items-center h-7 rounded-md border border-slate-200/90 dark:border-[#2a3f5f] bg-white/50 dark:bg-white/[0.04] text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition-colors";

export const FOCUS_STRIP_CHIP_OPEN =
  "border-blue-300 dark:border-blue-600 bg-blue-50/80 dark:bg-blue-900/25 text-blue-700 dark:text-blue-200";

/** Static frame (no hover) for composite chips that contain their own buttons. */
export const FOCUS_STRIP_CHIP_FRAME =
  "inline-flex items-center h-7 rounded-md border border-slate-200/90 dark:border-[#2a3f5f] bg-white/50 dark:bg-white/[0.04]";

export function MiniMusicIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  );
}

export function FocusStripChipChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/** Music play — ghost, so the solid blue play in the row is always the timer. */
export function miniMusicPlayButtonClass(playing: boolean) {
  if (playing) {
    return `${DOCK_BTN} text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-white/10 hover:bg-slate-200/80 dark:hover:bg-white/[0.14]`;
  }
  return `${DOCK_BTN} text-slate-500 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200`;
}

export function miniPlayButtonClass(playing: boolean, dock = false, emphasizeStart = false) {
  if (dock) {
    if (playing) {
      return `${DOCK_BTN} bg-blue-700 text-white hover:bg-blue-800`;
    }
    if (emphasizeStart) {
      return `${DOCK_BTN} bg-blue-700 text-white hover:bg-blue-800`;
    }
    return `${DOCK_BTN} text-blue-600 dark:text-blue-400 hover:bg-slate-100/90 dark:hover:bg-white/10`;
  }

  const base =
    "w-9 h-9 rounded-md flex items-center justify-center touch-target-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60";
  if (playing) {
    return `${base} bg-blue-700 text-white hover:bg-blue-800`;
  }
  if (emphasizeStart) {
    return `${base} bg-blue-700 text-white hover:bg-blue-800`;
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

export function MiniSettingsIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconClass =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-[1.125rem] h-[1.125rem]";
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
