"use client";

import React from "react";
import type { Project, Task } from "@/lib/types";
import type { SharedProject } from "@/lib/storage";
import { DEFAULT_PROJECT_ID, PROJECT_COLORS } from "@/lib/types";
import { MAX_PROJECT_NAME, formatDueDate, isDueDateOverdue } from "@/components/task-list/utils";

export interface ProjectManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortedProjects: Project[];
  archivedProjects: Project[];
  sharedProjects: SharedProject[];
  tasks: Task[];
  selectedProjectId: string;
  selectedSharedProject: SharedProject | null;
  user: { id: string } | null;
  editingProjectId: string | null;
  editProjectName: string;
  setEditProjectName: (v: string) => void;
  showArchivedProjects: boolean;
  setShowArchivedProjects: (v: boolean | ((prev: boolean) => boolean)) => void;
  newProjectName: string;
  setNewProjectName: (v: string) => void;
  onSelectProject: (id: string) => void;
  onSelectSharedProject: (sp: SharedProject) => void;
  onUpdateColor: (id: string, color: string) => void;
  onToggleFavorite: (id: string) => void;
  onFocusProject?: (id: string) => void;
  onUpdateDueDate: (id: string, dueDate: string | undefined) => void;
  onStartRename: (p: Project) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onShare: (p: Project) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onUnarchive: (id: string) => void;
  onLeaveShared: (sp: SharedProject) => void;
  onAddProject: () => void;
}

export default function ProjectManageModal({
  isOpen,
  onClose,
  sortedProjects,
  archivedProjects,
  sharedProjects,
  tasks,
  selectedProjectId,
  selectedSharedProject,
  user,
  editingProjectId,
  editProjectName,
  setEditProjectName,
  showArchivedProjects,
  setShowArchivedProjects,
  newProjectName,
  setNewProjectName,
  onSelectProject,
  onSelectSharedProject,
  onUpdateColor,
  onToggleFavorite,
  onFocusProject,
  onUpdateDueDate,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onShare,
  onArchive,
  onDelete,
  onUnarchive,
  onLeaveShared,
  onAddProject,
}: ProjectManageModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-16 sm:pt-20 pb-8 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg max-h-[min(80vh,640px)] flex flex-col bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-xl shadow-2xl overflow-hidden animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="Manage projects"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-[#243350] shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Projects</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Star favorites to pin them first · rename, color, archive
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {sortedProjects.map((p) => (
            <div
              key={p.id}
              className={`group/proj flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                p.id === selectedProjectId
                  ? "bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-200"
                  : "text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
              }`}
            >
              <input
                type="color"
                value={p.color || PROJECT_COLORS[0]}
                onChange={(e) => onUpdateColor(p.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded-full border-0 cursor-pointer p-0 appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                title="Change color"
              />
              {editingProjectId === p.id ? (
                <input
                  type="text"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  onBlur={onSaveRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveRename();
                    if (e.key === "Escape") onCancelRename();
                  }}
                  className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded bg-white dark:bg-[#131d30] dark:text-white outline-none"
                  autoFocus
                />
              ) : (
                <>
                  <button
                    type="button"
                    className="flex-1 truncate text-left"
                    onClick={() => onSelectProject(p.id)}
                  >
                    {p.favorite && <span className="text-amber-400 mr-1" aria-hidden>★</span>}
                    {p.name}
                  </button>
                  {p.dueDate && (
                    <span className={`text-xs ${isDueDateOverdue(p.dueDate) ? "text-red-500" : "text-slate-400"}`}>
                      {formatDueDate(p.dueDate)}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 tabular-nums">
                    {tasks.filter((t) => t.projectId === p.id && !t.completed).length}
                  </span>
                  {p.id !== DEFAULT_PROJECT_ID && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(p.id)}
                        className={`p-1.5 transition-colors ${p.favorite ? "text-amber-400" : "text-slate-400 hover:text-amber-400"}`}
                        title={p.favorite ? "Unpin" : "Pin to front"}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill={p.favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={p.favorite ? 0 : 1.5}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                      {onFocusProject && (
                        <button type="button" onClick={() => { onFocusProject(p.id); onClose(); }} className="p-1.5 text-slate-400 hover:text-orange-500" title="Focus">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      )}
                      <input
                        type="date"
                        value={p.dueDate ?? ""}
                        onChange={(e) => onUpdateDueDate(p.id, e.target.value || undefined)}
                        className="w-6 h-6 opacity-40 hover:opacity-100 cursor-pointer bg-transparent [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        title="Project due date"
                      />
                      <button type="button" onClick={() => onStartRename(p)} className="p-1.5 text-slate-400 hover:text-blue-500" title="Rename">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      {user && (
                        <button type="button" onClick={() => { onShare(p); onClose(); }} className="p-1.5 text-slate-400 hover:text-blue-500" title="Share">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        </button>
                      )}
                      <button type="button" onClick={() => onArchive(p.id)} className="p-1.5 text-slate-400 hover:text-amber-500" title="Archive">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                      </button>
                      <button type="button" onClick={() => onDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-500" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {archivedProjects.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowArchivedProjects((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
              >
                <svg className={`w-3 h-3 ${showArchivedProjects ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Archived ({archivedProjects.length})
              </button>
              {showArchivedProjects &&
                archivedProjects.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                    {p.color && <span className="w-2.5 h-2.5 rounded-full opacity-50" style={{ backgroundColor: p.color }} />}
                    <span className="flex-1 truncate">{p.name}</span>
                    <button type="button" onClick={() => onUnarchive(p.id)} className="p-1.5 hover:text-green-500" title="Unarchive">↩</button>
                    <button type="button" onClick={() => onDelete(p.id)} className="p-1.5 hover:text-red-500" title="Delete">×</button>
                  </div>
                ))}
            </>
          )}

          {user && sharedProjects.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide border-t border-slate-100 dark:border-[#243350]">
                Shared with me
              </div>
              {sharedProjects.map((sp) => (
                <div
                  key={`${sp._ownerId}:${sp.id}`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${
                    selectedSharedProject?.id === sp.id ? "bg-blue-50 dark:bg-blue-900/25" : "hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
                  }`}
                >
                  <button type="button" onClick={() => onSelectSharedProject(sp)} className="flex-1 truncate text-left">
                    {sp.color && <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: sp.color }} />}
                    {sp.name}
                  </button>
                  <button type="button" onClick={() => onLeaveShared(sp)} className="p-1 text-slate-400 hover:text-red-500 text-xs shrink-0">
                    Leave
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddProject();
          }}
          className="flex gap-2 p-3 border-t border-slate-100 dark:border-[#243350] shrink-0"
        >
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project name..."
            maxLength={MAX_PROJECT_NAME}
            className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={!newProjectName.trim()}
            className="px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
