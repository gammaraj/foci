"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { buttonClassName } from "@/components/ui/button-styles";

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
 * Labeled “Manage” / “Projects” control for the list project toolbar.
 * Renders a fixed-position menu so it isn’t clipped by nearby scroll containers.
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
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const placeMenu = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = 168;
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 220) {
      setCoords({ bottom: window.innerHeight - rect.top + 4, left });
    } else {
      setCoords({ top: rect.bottom + 4, left });
    }
  };

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    placeMenu();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onReposition = () => placeMenu();
    // Defer so the opening click doesn’t immediately close the menu.
    const t = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const hasProjectActions = !!project && (!!onStartRename || !!onShare || !!onArchive || !!onDelete);
  const label = project ? "Manage" : "Projects";
  const title = project ? `Manage ${project.name}` : "Manage projects";

  return (
    <div className={`relative shrink-0 ${className}`.trim()} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={buttonClassName({
          variant: "chipActive",
          size: "sm",
          className: `gap-1.5 min-h-[2rem] touch-target-sm${
            open ? " ring-2 ring-blue-400/40 dark:ring-blue-300/30" : ""
          }`,
        })}
        title={title}
        aria-label={title}
        aria-expanded={open}
        aria-haspopup="menu"
        data-tour="list-project-menu"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
        <span>{label}</span>
      </button>
      {open && coords && (
        <div
          ref={panelRef}
          className="fixed z-[9998] min-w-[10.5rem] py-1 rounded-lg border surface-panel shadow-xl"
          style={{ top: coords.top, bottom: coords.bottom, left: coords.left }}
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
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-surface-hover"
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
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-surface-hover"
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
            <div className="my-1 border-t border-slate-100 dark:border-surface-border" />
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onManageProjects();
            }}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-surface-hover"
          >
            Manage projects
          </button>
        </div>
      )}
    </div>
  );
}
