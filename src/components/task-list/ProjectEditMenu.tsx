"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_PROJECT_ID, PROJECT_COLORS, type Project } from "@/lib/types";
import { MAX_PROJECT_NAME, resolveProjectColor } from "@/components/task-list/utils";

export type ProjectEditMenuMode = "full" | "color";

export interface ProjectEditMenuCoords {
  projectId: string;
  x: number;
  y: number;
  mode: ProjectEditMenuMode;
}

export interface ProjectEditHandlers {
  editingId: string | null;
  editName: string;
  onEditNameChange: (value: string) => void;
  onStartRename: (project: Project) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onUpdateColor: (id: string, color: string) => void;
  /** Move every task from `sourceId` into `targetId`, then delete the source project. */
  onMergeProject: (sourceId: string, targetId: string) => void;
}

export function canRenameProject(project: Pick<Project, "id">): boolean {
  return project.id !== DEFAULT_PROJECT_ID;
}

export function useProjectEditMenu() {
  const [menu, setMenu] = useState<ProjectEditMenuCoords | null>(null);
  const pressRef = useRef<{ id: string; x: number; y: number; timer: number } | null>(null);

  const open = useCallback((projectId: string, x: number, y: number, mode: ProjectEditMenuMode = "full") => {
    setMenu({ projectId, x, y, mode });
  }, []);

  const openColor = useCallback(
    (projectId: string, x: number, y: number) => open(projectId, x, y, "color"),
    [open],
  );

  const close = useCallback(() => setMenu(null), []);

  const clearPress = useCallback(() => {
    if (pressRef.current) window.clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  }, []);

  const bind = useCallback(
    (projectId: string) => ({
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        open(projectId, e.clientX, e.clientY, "full");
      },
      onTouchStart: (e: React.TouchEvent) => {
        const t = e.touches[0];
        if (!t) return;
        clearPress();
        pressRef.current = {
          id: projectId,
          x: t.clientX,
          y: t.clientY,
          timer: window.setTimeout(() => {
            const p = pressRef.current;
            if (!p || p.id !== projectId) return;
            open(projectId, p.x, p.y, "full");
            pressRef.current = null;
          }, 520),
        };
      },
      onTouchMove: (e: React.TouchEvent) => {
        const t = e.touches[0];
        const p = pressRef.current;
        if (!t || !p || p.id !== projectId) return;
        if (Math.hypot(t.clientX - p.x, t.clientY - p.y) > 12) clearPress();
      },
      onTouchEnd: clearPress,
      onTouchCancel: clearPress,
    }),
    [open, clearPress],
  );

  return { menu, open, openColor, close, bind };
}

/** Clickable project color dot — left-click opens the color picker. */
export function ProjectColorSwatch({
  projectName,
  onOpenColor,
  color,
  useAccentVar = false,
  className = "",
  nested = false,
}: {
  projectName: string;
  onOpenColor?: (x: number, y: number) => void;
  /** Explicit fill when not using CSS project accent var. */
  color?: string;
  /** Use `.project-accent-swatch` (parent sets `--project-accent`). */
  useAccentVar?: boolean;
  className?: string;
  /** Render as a span so it can sit inside a parent button. */
  nested?: boolean;
}) {
  const dot = (
    <span
      className={`block w-3.5 h-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/15 ${
        useAccentVar ? "project-accent-swatch" : ""
      }`}
      style={useAccentVar || !color ? undefined : { backgroundColor: color }}
      aria-hidden
    />
  );

  if (!onOpenColor) {
    return (
      <span
        className={`inline-flex shrink-0 ${className}`}
        title={`${projectName} color`}
        role="img"
        aria-label={`${projectName} color`}
      >
        {dot}
      </span>
    );
  }

  const open = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    onOpenColor(r.left, r.bottom + 6);
  };
  const interactiveClass = `inline-flex shrink-0 items-center justify-center p-1 -m-0.5 rounded-full hover:bg-slate-500/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-colors ${className}`;

  if (nested) {
    return (
      <span
        className={interactiveClass}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          open(e.currentTarget);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title={`Change ${projectName} color`}
      >
        {dot}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open(e.currentTarget);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={interactiveClass}
      title={`Change ${projectName} color`}
      aria-label={`Change ${projectName} color`}
    >
      {dot}
    </button>
  );
}

export function ProjectNameInput({
  value,
  onChange,
  onSave,
  onCancel,
  className = "",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      maxLength={MAX_PROJECT_NAME}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSave();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={`min-w-0 px-2 py-1 text-sm font-semibold border border-blue-300 dark:border-blue-600 rounded-lg bg-surface-elevated text-slate-900 dark:bg-surface-elevated dark:text-white outline-none select-text ${className}`}
      aria-label={ariaLabel ?? "Project name"}
      autoFocus
    />
  );
}

export function ProjectEditMenu({
  project,
  x,
  y,
  mode = "full",
  onClose,
  onUpdateColor,
  onRename,
  mergeTargets,
  onMergeInto,
}: {
  project: Project;
  x: number;
  y: number;
  mode?: ProjectEditMenuMode;
  onClose: () => void;
  onUpdateColor: (id: string, color: string) => void;
  onRename?: () => void;
  /** Candidate projects to merge this one into. */
  mergeTargets?: Project[];
  onMergeInto?: (targetProjectId: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const [pickingMergeTarget, setPickingMergeTarget] = useState(false);
  const current = resolveProjectColor(project);
  const showRename = mode === "full" && !!onRename && canRenameProject(project);
  const showMerge =
    mode === "full" &&
    !!onMergeInto &&
    canRenameProject(project) &&
    !!mergeTargets &&
    mergeTargets.length > 0;
  const merging = pickingMergeTarget && showMerge;

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const pad = 8;
    setPos({
      left: Math.min(Math.max(pad, x), window.innerWidth - width - pad),
      top: Math.min(Math.max(pad, y), window.innerHeight - height - pad),
    });
  }, [x, y, merging]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const t = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9998] w-[13.5rem] py-2 rounded-lg border surface-panel shadow-xl"
      style={{ left: pos.left, top: pos.top }}
      role="menu"
      aria-label={
        merging
          ? `Merge ${project.name} into another project`
          : showRename
            ? `Edit ${project.name}`
            : `Change ${project.name} color`
      }
      onContextMenu={(e) => e.preventDefault()}
    >
      {merging && mergeTargets ? (
        <>
          <div className="flex items-center gap-1 px-2 pb-1.5">
            <button
              type="button"
              onClick={() => setPickingMergeTarget(false)}
              className="p-1 -ml-0.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-surface-muted dark:hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
              aria-label="Back"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 truncate">
              Merge {project.name} into
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {mergeTargets.map((target) => (
              <button
                key={target.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onClose();
                  onMergeInto?.(target.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-surface-hover"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full ring-1 ring-black/15 dark:ring-white/20 shrink-0"
                  style={{ backgroundColor: resolveProjectColor(target) }}
                  aria-hidden
                />
                <span className="truncate">{target.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Color
          </p>
          <div className="px-3 pb-2 grid grid-cols-5 gap-1.5">
            {PROJECT_COLORS.map((color) => {
              const selected = current.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  role="menuitem"
                  onClick={() => onUpdateColor(project.id, color)}
                  className={`w-6 h-6 rounded-full ring-1 ring-black/15 dark:ring-white/20 transition-shadow ${
                    selected ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-1 ring-offset-white dark:ring-offset-[#131d30]" : "hover:ring-2 hover:ring-slate-400/70"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Set color ${color}`}
                  aria-pressed={selected}
                  title="Set project color"
                />
              );
            })}
          </div>
          <label className="mx-3 mb-1 flex items-center gap-2 px-1 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-muted dark:hover:bg-surface-hover cursor-pointer">
            <span
              className="w-4 h-4 rounded-full ring-1 ring-black/15 dark:ring-white/20 shrink-0"
              style={{ backgroundColor: current }}
              aria-hidden
            />
            Custom color
            <input
              type="color"
              value={current}
              onChange={(e) => onUpdateColor(project.id, e.target.value)}
              className="sr-only"
              aria-label={`Custom color for ${project.name}`}
            />
          </label>
          {showRename && (
            <>
              <div className="my-1.5 border-t border-slate-100 dark:border-surface-border" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onClose();
                  onRename();
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-surface-hover"
              >
                Rename
              </button>
            </>
          )}
          {showMerge && (
            <>
              {!showRename && <div className="my-1.5 border-t border-slate-100 dark:border-surface-border" />}
              <button
                type="button"
                role="menuitem"
                onClick={() => setPickingMergeTarget(true)}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-surface-hover"
              >
                Merge into…
              </button>
            </>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}
