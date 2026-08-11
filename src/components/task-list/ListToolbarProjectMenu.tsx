"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/types";

interface ListToolbarProjectMenuProps {
  /** When set, show rename/share/archive/delete for this project. */
  project?: Project | null;
  user: { id: string } | null;
  onManageProjects: () => void;
  onStartRename?: (project: Project) => void;
  onShare?: (project: Project) => void;
  onArchive?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  className?: string;
}

/**
 * ⋮ control for the list project toolbar. Always opens a real menu — never
 * navigates on the button click itself (that was navigating to ?projects=1).
 */
export function ListToolbarProjectMenu({
  project,
  user,
  onManageProjects,
  onStartRename,
  onShare,
  onArchive,
  onDelete,
  className = "",
}: ListToolbarProjectMenuProps) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 220);
    }
    setOpen((v) => !v);
  };

  const hasProjectActions = !!project && (!!onStartRename || !!onShare || !!onArchive || !!onDelete);

  return (
    <div className={`relative shrink-0 ${className}`.trim()} ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className={`flex-shrink-0 touch-target-sm p-2 sm:p-1.5 rounded-lg transition-colors ${
          open
            ? "bg-slate-200 dark:bg-[#1a2d4a] text-slate-700 dark:text-slate-200"
            : "text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131d30] hover:text-slate-600 dark:hover:text-slate-300"
        }`}
        title={project ? `Manage ${project.name}` : "Manage projects"}
        aria-label={project ? `Manage ${project.name}` : "Manage projects"}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute right-0 z-40 min-w-[10rem] py-1 rounded-lg border border-slate-200 dark:border-[#3a5070] bg-white dark:bg-[#131d30] shadow-lg ${
            openUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          role="menu"
        >
          {hasProjectActions && project && onStartRename && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onStartRename(project);
              }}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
            >
              Rename
            </button>
          )}
          {hasProjectActions && project && user && onShare && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onShare(project);
              }}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
            >
              Share
            </button>
          )}
          {hasProjectActions && project && onArchive && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onArchive(project.id);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              Archive
            </button>
          )}
          {hasProjectActions && project && onDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete(project.id);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete project…
            </button>
          )}
          {hasProjectActions && (
            <div className="my-1 border-t border-slate-100 dark:border-[#243350]" />
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onManageProjects();
            }}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
          >
            Manage projects
          </button>
        </div>
      )}
    </div>
  );
}
