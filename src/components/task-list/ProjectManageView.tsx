"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Project, Task } from "@/lib/types";
import type { SharedProject } from "@/lib/storage";
import { DEFAULT_PROJECT_ID, PROJECT_COLORS } from "@/lib/types";
import { ProjectTabName } from "@/components/task-list/ProjectTabName";
import {
  MAX_PROJECT_NAME,
  formatDueDate,
  isDueDateOverdue,
} from "@/components/task-list/utils";
import { ProjectTaskCounts } from "@/components/task-list/ProjectTaskCounts";

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
  onClose: () => void;
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
  onUnarchive: (id: string) => void;
  onFocusProject?: (id: string) => void;
  onSelectSharedProject: (sp: SharedProject) => void;
  onLeaveShared: (sp: SharedProject) => void;
  onAddProject: () => void;
  onToggleComplete: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onSelectTask: (taskId: string | null) => void;
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
      title={active ? "Unpin project" : "Pin to front"}
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
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
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
        className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] hover:text-slate-800 dark:hover:text-white transition-colors"
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
            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
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
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
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
  openTasks,
  completedCount,
  expanded,
  onToggleExpanded,
  editingProjectId,
  editProjectName,
  setEditProjectName,
  activeTaskId,
  isTimerRunning,
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
  onFocusProject,
  onToggleComplete,
  onStartTask,
  onSelectTask,
}: {
  project: Project;
  openTasks: Task[];
  completedCount: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  editingProjectId: string | null;
  editProjectName: string;
  setEditProjectName: (v: string) => void;
  activeTaskId: string | null;
  isTimerRunning: boolean;
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
  onFocusProject?: (id: string) => void;
  onToggleComplete: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onSelectTask: (taskId: string | null) => void;
}) {
  const canManage = project.id !== DEFAULT_PROJECT_ID;

  return (
    <div className="relative rounded-xl border border-slate-200 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/50 hover:z-10 focus-within:z-20">
      <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2">
        {canManage ? (
          <FavoriteButton
            active={!!project.favorite}
            onClick={() => onToggleFavorite(project.id)}
            label={project.name}
          />
        ) : (
          <div className="w-9 flex-shrink-0" aria-hidden />
        )}

        <input
          type="color"
          value={project.color || PROJECT_COLORS[0]}
          onChange={(e) => onUpdateColor(project.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded-full border-0 cursor-pointer p-0 appearance-none bg-transparent flex-shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
          title="Change color"
        />

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
                className="w-full px-2 py-1 text-sm border border-blue-300 rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100 block truncate">
                <ProjectTabName project={project} />
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
                      ? "text-red-600 dark:text-red-300 font-medium"
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
          {openTasks.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No open tasks</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-[#243350]">
              {openTasks.map((task) => {
                const overdue = task.dueDate && isDueDateOverdue(task.dueDate);
                return (
                  <li
                    key={task.id}
                    className={`flex items-center gap-2 px-3 py-2.5 ${
                      activeTaskId === task.id
                        ? "bg-blue-50/80 dark:bg-blue-900/20"
                        : "hover:bg-slate-50/80 dark:hover:bg-[#1a2d4a]/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleComplete(task.id)}
                      className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 transition-colors"
                      aria-label={`Complete "${task.title}"`}
                    />
                    <button
                      type="button"
                      onClick={() => onSelectTask(activeTaskId === task.id ? null : task.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-200 truncate block">
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs ${overdue ? "text-red-500" : "text-slate-400"}`}>
                          {formatDueDate(task.dueDate)}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartTask(task.id)}
                      className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded-md border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      {activeTaskId === task.id ? "Linked" : isTimerRunning ? "Switch" : "Focus"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-t border-slate-100 dark:border-[#243350] bg-slate-50/50 dark:bg-[#0f172a]/40">
            <button
              type="button"
              onClick={() => onOpenProject(project.id)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Open in tasks
            </button>
            {canManage && (
              <>
                {onFocusProject && (
                  <button
                    type="button"
                    onClick={() => onFocusProject(project.id)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
                  >
                    Focus project
                  </button>
                )}
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
                <input
                  type="date"
                  value={project.dueDate ?? ""}
                  onChange={(e) => onUpdateDueDate(project.id, e.target.value || undefined)}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-600 dark:text-slate-300"
                  title="Project due date"
                />
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
  onClose,
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
  onUnarchive,
  onFocusProject,
  onSelectSharedProject,
  onLeaveShared,
  onAddProject,
  onToggleComplete,
  onStartTask,
  onSelectTask,
}: ProjectManageViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [showArchived, setShowArchived] = useState(false);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pinnedCount = sortedProjects.filter((p) => p.favorite).length;

  return (
    <div className="flex flex-col min-h-0">
      <div className="px-3 sm:px-4 pt-2 pb-3 border-b border-slate-100 dark:border-[#243350]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to tasks
            </button>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Projects</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {sortedProjects.length} project{sortedProjects.length === 1 ? "" : "s"}
              {pinnedCount > 0 && (
                <span className="text-amber-600 dark:text-amber-300"> · {pinnedCount} pinned</span>
              )}
              {" "}— tap ★ to pin · ⋯ to rename, archive, or delete
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-visible px-3 sm:px-4 py-3 pb-6 space-y-2 min-h-0 max-h-[min(70vh,720px)]">
        {sortedProjects.map((project) => {
          const openTasks = sortOpenTasks(
            tasks.filter((t) => t.projectId === project.id && !t.completed && !t.archivedAt),
            activeTaskId
          );
          const completedCount = tasks.filter(
            (t) => t.projectId === project.id && t.completed && !t.archivedAt
          ).length;

          return (
            <ProjectRow
              key={project.id}
              project={project}
              openTasks={openTasks}
              completedCount={completedCount}
              expanded={expandedIds.has(project.id)}
              onToggleExpanded={() => toggleExpanded(project.id)}
              editingProjectId={editingProjectId}
              editProjectName={editProjectName}
              setEditProjectName={setEditProjectName}
              activeTaskId={activeTaskId}
              isTimerRunning={isTimerRunning}
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
              onFocusProject={onFocusProject}
              onToggleComplete={onToggleComplete}
              onStartTask={onStartTask}
              onSelectTask={onSelectTask}
            />
          );
        })}

        {archivedProjects.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
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
                      className="text-xs text-green-600 dark:text-green-400 hover:underline"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {user && sharedProjects.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-[#243350]">
            <p className="app-section-label text-slate-400 mb-2">
              Shared with me
            </p>
            <div className="space-y-1">
              {sharedProjects.map((sp) => (
                <div
                  key={`${sp._ownerId}:${sp.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 dark:border-[#243350] hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition-colors"
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
                    {sp.name}
                    <span className="block text-xs text-slate-400">
                      {sp._ownerName || sp._ownerEmail.split("@")[0]}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLeaveShared(sp)}
                    className="text-xs text-red-500 hover:underline shrink-0"
                  >
                    Leave
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAddProject();
        }}
        className="flex gap-2 px-3 sm:px-4 py-3 border-t border-slate-100 dark:border-[#243350] shrink-0"
      >
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New project name..."
          maxLength={MAX_PROJECT_NAME}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={!newProjectName.trim()}
          className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}
