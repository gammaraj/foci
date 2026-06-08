"use client";

import React, { useState, useRef, useEffect } from "react";
import type { TaskTemplate } from "@/lib/templates";
import { showWhatsNewBanner, startFeatureTour } from "@/lib/whats-new";

interface TaskPanelMenuProps {
  user: { id: string } | null;
  onOpenSettings: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  templates?: TaskTemplate[];
  onSelectTemplate?: (template: TaskTemplate) => void;
  onTogglePlan?: () => void;
  isPlanView?: boolean;
}

export default function TaskPanelMenu({
  user,
  onOpenSettings,
  onToggleFullscreen,
  isFullscreen,
  templates,
  onSelectTemplate,
  onTogglePlan,
  isPlanView,
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

  const hasTemplates = templates && templates.length > 0 && onSelectTemplate;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="touch-target-sm p-2 rounded-lg text-slate-500 dark:text-white/70 hover:bg-slate-200/60 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Task panel menu"
        aria-expanded={open}
        data-tour="task-panel-menu"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute right-0 top-full mt-1 py-1 rounded-xl app-surface dark:bg-[#131d30] shadow-xl border border-slate-200 dark:border-[#243350] z-50 ${
            hasTemplates ? "w-64" : "w-48"
          }`}
        >
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
            onClick={() => { onOpenSettings(); setOpen(false); }}
          >
            Settings & import
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
            onClick={() => {
              showWhatsNewBanner();
              startFeatureTour();
              setOpen(false);
            }}
          >
            What&apos;s new & tour
          </button>
          {onTogglePlan && (
            <button
              type="button"
              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
              onClick={() => { onTogglePlan(); setOpen(false); }}
            >
              {isPlanView ? "← Back to task list" : "✦ Plan my day with AI"}
            </button>
          )}
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
          {hasTemplates && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-[#243350]" />
              <div className="px-3 py-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Task templates
                </span>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {templates.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition-colors border-b border-slate-50 dark:border-[#1e3050]/50 last:border-b-0"
                    onClick={() => {
                      onSelectTemplate(tpl);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base flex-shrink-0">{tpl.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{tpl.label}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-300 truncate">
                          {tpl.tasks.length} tasks
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
