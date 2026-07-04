"use client";

import React from "react";
import type { Project } from "@/lib/types";
import { ProjectTabName } from "@/components/task-list/ProjectTabName";

export interface ProjectOrderListProps {
  projects: Project[];
  dragProjectId: string | null;
  dragOverProjectId: string | null;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (targetId: string) => void;
  onDragEnd: () => void;
  onMoveProject: (id: string, direction: "up" | "down") => void;
}

function GripIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M7 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM7 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM7 13a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  );
}

export default function ProjectOrderList({
  projects,
  dragProjectId,
  dragOverProjectId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveProject,
}: ProjectOrderListProps) {
  if (projects.length < 2) return null;

  return (
    <div className="mb-3 md:col-span-2 rounded-xl border border-slate-200 dark:border-[#243350] bg-slate-50/80 dark:bg-[#0f172a]/40">
      <div className="px-3 py-2 border-b border-slate-200/80 dark:border-[#243350]/80">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Tab order</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Drag to reorder tabs. Drop on a pinned project to pin, or on an unpinned one to unpin.
        </p>
      </div>
      <ol className="py-1" aria-label="Project tab order">
        {projects.map((project, index) => {
          const isDragging = dragProjectId === project.id;
          const isDropTarget = dragOverProjectId === project.id && dragProjectId !== project.id;
          return (
            <li key={project.id}>
              <div
                draggable
                onDragStart={() => onDragStart(project.id)}
                onDragOver={(e) => onDragOver(e, project.id)}
                onDrop={(e) => {
                  e.preventDefault();
                  onDrop(project.id);
                }}
                onDragEnd={onDragEnd}
                className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 cursor-grab active:cursor-grabbing transition-colors ${
                  isDragging ? "opacity-50" : ""
                } ${
                  isDropTarget
                    ? "bg-cyan-50 dark:bg-cyan-900/20 ring-1 ring-inset ring-cyan-400/60"
                    : "hover:bg-white/70 dark:hover:bg-[#131d30]/60"
                }`}
              >
                <span
                  className="text-slate-300 dark:text-slate-600 flex-shrink-0"
                  title="Drag to reorder"
                  aria-hidden
                >
                  <GripIcon />
                </span>
                {project.favorite && (
                  <svg
                    className="w-3.5 h-3.5 text-amber-400 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-label="Pinned"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
                {project.color && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                    aria-hidden
                  />
                )}
                <span className="flex-1 min-w-0 text-sm text-slate-700 dark:text-slate-200 truncate">
                  <ProjectTabName project={project} />
                </span>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onMoveProject(project.id, "up")}
                    disabled={index === 0}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label={`Move ${project.name} up`}
                    title="Move up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveProject(project.id, "down")}
                    disabled={index === projects.length - 1}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label={`Move ${project.name} down`}
                    title="Move down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
