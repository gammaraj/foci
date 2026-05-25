"use client";

import React, { useState, useRef, useEffect } from "react";

interface TaskPanelMenuProps {
  user: { id: string } | null;
  onOpenSettings: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export default function TaskPanelMenu({
  user,
  onOpenSettings,
  onToggleFullscreen,
  isFullscreen,
}: TaskPanelMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="touch-target-sm p-2 rounded-lg text-slate-500 dark:text-white/70 hover:bg-slate-200/60 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Task panel menu"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 py-1 rounded-xl app-surface dark:bg-[#131d30] shadow-xl border border-slate-200 dark:border-[#243350] z-50">
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
            onClick={() => { onOpenSettings(); setOpen(false); }}
          >
            Settings & import
          </button>
          {onToggleFullscreen && (
            <button
              type="button"
              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
              onClick={() => { onToggleFullscreen(); setOpen(false); }}
            >
              {isFullscreen ? "Exit focus view" : "Focus view (tasks)"}
            </button>
          )}
          {user && (
            <button
              type="button"
              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
              onClick={() => { onOpenSettings(); setOpen(false); }}
            >
              Collaboration & sharing
            </button>
          )}
        </div>
      )}
    </div>
  );
}
