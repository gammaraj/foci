"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Project, Task } from "@/lib/types";
import type { SharedProject } from "@/lib/storage";
import { DEFAULT_PROJECT_ID } from "@/lib/types";
import {
  MAX_PROJECT_NAME,
  formatDueDate,
  isDueDateOverdue,
  resolveProjectColor,
} from "@/components/task-list/utils";
import { DueDateField } from "@/components/task-list/DueDateField";
import { ProjectTaskCounts } from "@/components/task-list/ProjectTaskCounts";
import { ProjectTemplatePicker } from "@/components/task-list/ProjectTemplatePicker";
import type { ProjectTemplate } from "@/lib/templates";
import TaskImportExport from "@/components/TaskImportExport";

function GripIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M7 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM7 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM7 13a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  );
}

export interface ProjectManageViewProps {
  sortedProjects: Project[];
  archivedProjects: Project[];
  sharedProjects: SharedProject[];
  tasks: Task[];
  user: { id: string } | null;
  editingProjectId: string | null;
  editProjectName: string;
  setEditProjectName: (v: string) => void;
  newProjectName: string;
  setNewProjectName: (v: string) => void;
  activeTaskId: string | null;
  isTimerRunning: boolean;
  onToggleFavorite: (id: string) => void;
  dragProjectId: string | null;
  dragOverProjectId: string | null;
  onProjectDragStart: (id: string) => void;
  onProjectDragOver: (e: React.DragEvent, id: string) => void;
  onProjectDrop: (targetId: string) => void;
  onProjectDragEnd: () => void;
  onMoveProject: (id: string, direction: "up" | "down") => void;
  onOpenProject: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateDueDate: (id: string, dueDate: string | undefined) => void;
  onStartRename: (p: Project) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onShare: (p: Project) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onUnarchive: (id: string) => void;
  onSelectSharedProject: (sp: SharedProject) => void;
  onLeaveShared: (sp: SharedProject) => void;
  onAddProject: (template?: ProjectTemplate) => void;
  /** Reload tasks/projects after an import from this screen. */
  onTasksImported?: (result?: {
    tasks: Task[];
    projects: Project[];
    focusProjectId?: string;
  }) => void;
  renderOpenTasks: (tasks: Task[], options?: { className?: string }) => React.ReactNode;
}

function sortOpenTasks(projectTasks: Task[], activeTaskId: string | null): Task[] {
  return [...projectTasks].sort((a, b) => {
    if (a.id === activeTaskId && b.id !== activeTaskId) return -1;
    if (b.id === activeTaskId && a.id !== activeTaskId) return 1;
    const aOverdue = a.dueDate && isDueDateOverdue(a.dueDate);
    const bOverdue = b.dueDate && isDueDateOverdue(b.dueDate);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    if (a.order != null && b.order != null) return a.order - b.order;
    if (a.order != null) return -1;
    if (b.order != null) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

function FavoriteButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
        active
          ? "text-amber-400 hover:text-amber-500 bg-amber-50/80 dark:bg-amber-900/20"
          : "text-slate-300 dark:text-slate-600 hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
      }`}
      title={active ? "Pinned — click to unpin (pinned projects appear first)" : "Pin — keep this project at the top"}
      aria-label={active ? `Unpin ${label}` : `Pin ${label} to front`}
      aria-pressed={active}
    >
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </button>
  );
}

function ProjectRowMenu({
  project,
  user,
  onStartRename,
  onShare,
  onArchive,
  onDelete,
}: {
  project: Project;
  user: { id: string } | null;
  onStartRename: (p: Project) => void;
  onShare: (p: Project) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 200);
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleOpen();
        }}
        className="touch-target-sm p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] hover:text-slate-800 dark:hover:text-white transition-colors"
        aria-label={`Manage ${project.name}`}
        aria-expanded={open}
        title="Rename, archive, or delete"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute right-0 z-30 min-w-[9.5rem] py-1 rounded-lg border border-slate-200 dark:border-[#3a5070] bg-white dark:bg-[#131d30] shadow-lg ${
            openUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          role="menu"
        >
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
          {user && (
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
        </div>
      )}
    </div>
  );
}

function ProjectRow({
  project,
  projectIndex,
  projectCount,
  openTasks,
  completedCount,
  expanded,
  dragProjectId,
  dragOverProjectId,
  onProjectDragStart,
  onProjectDragOver,
  onProjectDrop,
  onProjectDragEnd,
  onMoveProject,
  onToggleExpanded,
  editingProjectId,
  editProjectName,
  setEditProjectName,
  user,
  onToggleFavorite,
  onOpenProject,
  onUpdateColor,
  onUpdateDueDate,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onShare,
  onArchive,
  onDelete,
  renderOpenTasks,
}: {
  project: Project;
  projectIndex: number;
  projectCount: number;
  openTasks: Task[];
  completedCount: number;
  expanded: boolean;
  dragProjectId: string | null;
  dragOverProjectId: string | null;
  onProjectDragStart: (id: string) => void;
  onProjectDragOver: (e: React.DragEvent, id: string) => void;
  onProjectDrop: (targetId: string) => void;
  onProjectDragEnd: () => void;
  onMoveProject: (id: string, direction: "up" | "down") => void;
  onToggleExpanded: () => void;
  editingProjectId: string | null;
  editProjectName: string;
  setEditProjectName: (v: string) => void;
  user: { id: string } | null;
  onToggleFavorite: (id: string) => void;
  onOpenProject: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateDueDate: (id: string, dueDate: string | undefined) => void;
  onStartRename: (p: Project) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onShare: (p: Project) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  renderOpenTasks: (tasks: Task[], options?: { className?: string }) => React.ReactNode;
}) {
  const canManage = project.id !== DEFAULT_PROJECT_ID;
  const canReorder = projectCount >= 2;
  const isDragging = dragProjectId === project.id;
  const isDropTarget = dragOverProjectId === project.id && dragProjectId !== project.id;

  return (
    <div
      onDragOver={(e) => {
        if (!canReorder) return;
        onProjectDragOver(e, project.id);
      }}
      onDrop={(e) => {
        if (!canReorder) return;
        e.preventDefault();
        onProjectDrop(project.id);
      }}
      className={`relative rounded-xl border border-slate-200 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/50 hover:z-10 focus-within:z-20 transition-colors ${
        isDragging ? "opacity-50" : ""
      } ${
        isDropTarget ? "ring-2 ring-blue-400/70 ring-offset-1 ring-offset-transparent bg-blue-50/50 dark:bg-blue-900/10" : ""
      }`}
    >
      <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2">
        {canReorder ? (
          <span
            draggable
            onDragStart={() => onProjectDragStart(project.id)}
            onDragEnd={onProjectDragEnd}
            className="hidden sm:inline-flex text-slate-300 dark:text-slate-600 flex-shrink-0 cursor-grab active:cursor-grabbing p-1.5 -ml-1 rounded hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-[#1a2d4a]"
            title="Drag to reorder"
            aria-label={`Drag ${project.name} to reorder`}
          >
            <GripIcon />
          </span>
        ) : (
          <div className="w-6 flex-shrink-0" aria-hidden />
        )}

        {canManage ? (
          <FavoriteButton
            active={!!project.favorite}
            onClick={() => onToggleFavorite(project.id)}
            label={project.name}
          />
        ) : (
          <div className="w-9 flex-shrink-0" aria-hidden />
        )}

        <label
          className="relative flex-shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-full cursor-pointer hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors"
          title="Change color"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="pointer-events-none w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ring-1 ring-black/15 dark:ring-white/20 shadow-sm"
            style={{ backgroundColor: resolveProjectColor(project) }}
            aria-hidden
          />
          <input
            type="color"
            value={resolveProjectColor(project)}
            onChange={(e) => onUpdateColor(project.id, e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`Color for ${project.name}`}
          />
        </label>

        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex-1 min-w-0 flex items-center gap-2 text-left py-1"
          aria-expanded={expanded}
        >
          <div className="min-w-0 flex-1">
            {editingProjectId === project.id ? (
              <input
                type="text"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                onBlur={onSaveRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveRename();
                  if (e.key === "Escape") onCancelRename();
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 text-sm border border-blue-300 rounded-lg bg-white text-slate-900 dark:bg-[#131d30] dark:text-white outline-none"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100 block truncate">
                {project.name}
              </span>
            )}
            <span className="block mt-0.5">
              <ProjectTaskCounts
                variant="inline"
                open={openTasks.length}
                completed={completedCount}
                overdue={openTasks.filter((t) => t.dueDate && isDueDateOverdue(t.dueDate)).length}
              />
              {project.dueDate && (
                <span
                  className={`text-xs ml-1 ${
                    isDueDateOverdue(project.dueDate)
                      ? "urgency-text--mild font-medium"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  · {formatDueDate(project.dueDate)}
                </span>
              )}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {canReorder && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveProject(project.id, "up");
              }}
              disabled={projectIndex === 0}
              className="touch-target-sm !min-h-8 !min-w-8 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label={`Move ${project.name} up`}
              title="Move up"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveProject(project.id, "down");
              }}
              disabled={projectIndex === projectCount - 1}
              className="touch-target-sm !min-h-8 !min-w-8 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label={`Move ${project.name} down`}
              title="Move down"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {canManage && (
          <ProjectRowMenu
            project={project}
            user={user}
            onStartRename={onStartRename}
            onShare={onShare}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-[#243350] overflow-hidden rounded-b-xl">
          {renderOpenTasks(openTasks, { className: "space-y-2 px-1 sm:px-2 py-2" })}

          <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-t border-slate-100 dark:border-[#243350] bg-slate-50/50 dark:bg-[#0f172a]/40">
            <button
              type="button"
              onClick={() => onOpenProject(project.id)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Open in List
            </button>
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => onStartRename(project)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
                >
                  Rename
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => onShare(project)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
                  >
                    Share
                  </button>
                )}
                <DueDateField
                  value={project.dueDate}
                  onChange={(date) => onUpdateDueDate(project.id, date)}
                  requireExplicitPick={!project.dueDate}
                  ariaLabel="Project due date"
                  className="inline-flex items-center px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-600 dark:text-slate-300"
                >
                  <span title="Project due date">
                    {project.dueDate ? formatDueDate(project.dueDate) : "Due date"}
                  </span>
                </DueDateField>
                <button
                  type="button"
                  onClick={() => onArchive(project.id)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-colors"
                >
                  Archive
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(project.id)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectManageView({
  sortedProjects,
  archivedProjects,
  sharedProjects,
  tasks,
  user,
  editingProjectId,
  editProjectName,
  setEditProjectName,
  newProjectName,
  setNewProjectName,
  activeTaskId,
  isTimerRunning,
  onToggleFavorite,
  dragProjectId,
  dragOverProjectId,
  onProjectDragStart,
  onProjectDragOver,
  onProjectDrop,
  onProjectDragEnd,
  onMoveProject,
  onOpenProject,
  onUpdateColor,
  onUpdateDueDate,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onShare,
  onArchive,
  onDelete,
  onUnarchive,
  onSelectSharedProject,
  onLeaveShared,
  onAddProject,
  onTasksImported,
  renderOpenTasks,
}: ProjectManageViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const newProjectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus create field when Projects opens so Add project is one tap + type.
    const id = window.setTimeout(() => newProjectInputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, []);

  // Persist missing / legacy-bright accents so swatches use the muted palette.
  const didBackfillColors = useRef(false);
  useEffect(() => {
    if (didBackfillColors.current) return;
    const toFix = sortedProjects.filter((p) => {
      if (!p.color) return true;
      return resolveProjectColor(p) !== p.color;
    });
    if (toFix.length === 0) return;
    didBackfillColors.current = true;
    for (const p of toFix) {
      onUpdateColor(p.id, resolveProjectColor(p));
    }
  }, [sortedProjects, onUpdateColor]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden panel-pad-x py-3 pb-10 min-h-0 max-h-[min(calc(100dvh-11rem),720px)] sm:max-h-[min(70vh,720px)] space-y-5">
        {/* Create first — primary action, not buried under the list */}
        <section
          className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-slate-50/70 dark:bg-[#0d1526]/55 p-3 sm:p-3.5 space-y-3"
          aria-labelledby="projects-create-heading"
        >
          <div className="flex items-center justify-between gap-2">
            <h3
              id="projects-create-heading"
              className="text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              New project
            </h3>
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                showImport
                  ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                  : "border-slate-200 dark:border-[#243350] text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1a2d4a]"
              }`}
              aria-expanded={showImport}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAddProject();
            }}
            className="flex gap-2"
          >
            <input
              ref={newProjectInputRef}
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name…"
              maxLength={MAX_PROJECT_NAME}
              className="flex-1 min-w-0 px-3 py-2.5 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white text-slate-900 dark:bg-[#131d30] dark:text-white outline-none focus:border-blue-400"
              aria-label="New project name"
            />
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="shrink-0 px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </form>

          <ProjectTemplatePicker onSelect={(tpl) => onAddProject(tpl)} />

          {showImport && (
            <div className="rounded-lg border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30]/80 p-3 space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Import into an existing project, a new one, or use the file’s Project column.
              </p>
              <TaskImportExport
                importOnly
                showDestinationPicker
                projects={sortedProjects}
                onTasksImported={(result) => {
                  onTasksImported?.(result);
                }}
              />
            </div>
          )}
        </section>

        {user && sharedProjects.length > 0 && (
          <section aria-labelledby="projects-shared-heading">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 id="projects-shared-heading" className="app-section-label text-slate-400">
                Shared with me
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {sharedProjects.length} project{sharedProjects.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div
              className={
                sharedProjects.length > 1
                  ? "grid grid-cols-1 md:grid-cols-2 gap-2 items-start"
                  : "space-y-1"
              }
            >
              {sharedProjects.map((sp) => (
                <div
                  key={`${sp._ownerId}:${sp.id}`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors min-w-0"
                >
                  <button
                    type="button"
                    onClick={() => onSelectSharedProject(sp)}
                    className="flex-1 min-w-0 text-left text-sm truncate"
                  >
                    {sp.color && (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: sp.color }}
                      />
                    )}
                    <span className="font-medium text-slate-900 dark:text-white">{sp.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {sp._ownerName || sp._ownerEmail.split("@")[0]}
                      {" · "}
                      {sp._myRole === "editor" ? "Can edit" : "View only"}
                      {sp._shareSource === "account" ? " · Full account" : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLeaveShared(sp)}
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title={
                      sp._shareSource === "account"
                        ? "Remove access to all projects from this person"
                        : "Remove your access to this project"
                    }
                    aria-label={
                      sp._shareSource === "account"
                        ? `Remove account access from ${sp._ownerName || sp._ownerEmail}`
                        : `Remove access to ${sp.name}`
                    }
                  >
                    <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="hidden sm:inline">Remove access</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="projects-yours-heading">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 id="projects-yours-heading" className="app-section-label text-slate-400">
              Your projects
            </h3>
            {sortedProjects.length >= 2 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Drag ⋮⋮ to reorder · ★ to pin
              </p>
            )}
          </div>
          {sortedProjects.length >= 2 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 sm:hidden">
              Use ▲▼ to reorder · ★ to pin · ⋯ for more
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 items-start">
            {sortedProjects.map((project, index) => {
              const openTasks = sortOpenTasks(
                tasks.filter((t) => t.projectId === project.id && !t.completed && !t.archivedAt),
                activeTaskId
              );
              const completedCount = tasks.filter(
                (t) => t.projectId === project.id && t.completed && !t.archivedAt
              ).length;
              const isExpanded = expandedIds.has(project.id);

              return (
                <div
                  key={project.id}
                  className={isExpanded ? "md:col-span-2 xl:col-span-3 min-w-0" : "min-w-0"}
                >
                  <ProjectRow
                    project={project}
                    projectIndex={index}
                    projectCount={sortedProjects.length}
                    openTasks={openTasks}
                    completedCount={completedCount}
                    expanded={isExpanded}
                    dragProjectId={dragProjectId}
                    dragOverProjectId={dragOverProjectId}
                    onProjectDragStart={onProjectDragStart}
                    onProjectDragOver={onProjectDragOver}
                    onProjectDrop={onProjectDrop}
                    onProjectDragEnd={onProjectDragEnd}
                    onMoveProject={onMoveProject}
                    onToggleExpanded={() => toggleExpanded(project.id)}
                    editingProjectId={editingProjectId}
                    editProjectName={editProjectName}
                    setEditProjectName={setEditProjectName}
                    user={user}
                    onToggleFavorite={onToggleFavorite}
                    onOpenProject={onOpenProject}
                    onUpdateColor={onUpdateColor}
                    onUpdateDueDate={onUpdateDueDate}
                    onStartRename={onStartRename}
                    onSaveRename={onSaveRename}
                    onCancelRename={onCancelRename}
                    onShare={onShare}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    renderOpenTasks={renderOpenTasks}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {archivedProjects.length > 0 && (
          <section aria-labelledby="projects-archived-heading">
            <button
              type="button"
              id="projects-archived-heading"
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-2 app-section-label text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-expanded={showArchived}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showArchived ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Archived ({archivedProjects.length})
            </button>
            {showArchived && (
              <div className="mt-2 space-y-1">
                {archivedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 dark:border-[#243350] text-sm text-slate-400"
                  >
                    {p.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full opacity-50"
                        style={{ backgroundColor: p.color }}
                      />
                    )}
                    <span className="flex-1 truncate">{p.name}</span>
                    <button
                      type="button"
                      onClick={() => onUnarchive(p.id)}
                      className="touch-target-sm px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:underline"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      className="touch-target-sm px-2 py-1 text-xs font-medium text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
