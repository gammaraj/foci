"use client";

import React, { useState, useRef, useEffect } from "react";
import type { ProjectTemplate } from "@/lib/templates";
import { ProjectTemplatePicker } from "@/components/task-list/ProjectTemplatePicker";
import { startOnboardingTour } from "@/lib/onboarding";
import { showWhatsNewBanner, startFeatureTour } from "@/lib/whats-new";
import { isStandaloneDisplay, openPwaInstallGuide } from "@/lib/pwa-install";

interface TaskPanelMenuProps {
  user: { id: string } | null;
  onOpenSettings: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  templates?: ProjectTemplate[];
  onSelectTemplate?: (template: ProjectTemplate) => void;
  onPrint?: () => void;
  printDisabled?: boolean;
}

export default function TaskPanelMenu({
  user,
  onOpenSettings,
  onToggleFullscreen,
  isFullscreen,
  templates,
  onSelectTemplate,
  onPrint,
  printDisabled,
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
        className="touch-target-sm p-2 rounded-lg text-blue-700/70 dark:text-blue-200/70 hover:text-blue-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
            onClick={() => {
              window.dispatchEvent(new Event("foci-open-project-menu"));
              setOpen(false);
            }}
          >
            Projects
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("foci-open-settings", { detail: { tab: "data" } }),
              );
              setOpen(false);
            }}
          >
            Import tasks…
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
            onClick={() => { onOpenSettings(); setOpen(false); }}
          >
            Settings
          </button>
          {onPrint && (
            <button
              type="button"
              disabled={printDisabled}
              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => { onPrint(); setOpen(false); }}
            >
              Print current view
            </button>
          )}
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
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
            onClick={() => {
              startOnboardingTour();
              setOpen(false);
            }}
          >
            Take product tour
          </button>
          {!isStandaloneDisplay() && (
            <button
              type="button"
              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
              onClick={() => {
                openPwaInstallGuide();
                setOpen(false);
              }}
            >
              Add to Home Screen
            </button>
          )}
          {onToggleFullscreen && (
            <button
              type="button"
              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
              onClick={() => { onToggleFullscreen(); setOpen(false); }}
            >
              {isFullscreen ? "Exit expand" : "Expand tasks"}
            </button>
          )}
          {user && (
            <button
              type="button"
              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("foci-open-settings", { detail: { tab: "sharing" } }),
                );
                setOpen(false);
              }}
            >
              Collaboration & sharing
            </button>
          )}
          {hasTemplates && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-[#243350]" />
              <div className="px-3 py-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Project templates
                </span>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                <ProjectTemplatePicker
                  variant="menu"
                  templates={templates}
                  onSelect={(tpl) => {
                    onSelectTemplate!(tpl);
                    setOpen(false);
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
