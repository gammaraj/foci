"use client";

import React from "react";
import { DEFAULT_PROJECT_ID, type Project, type Task } from "@/lib/types";
import { sortBucketTasks } from "@/components/task-list/bucket-order";
import { MAX_TASK_TITLE } from "@/components/task-list/utils";
import { isActionableOverdue } from "@/lib/task-status";

interface TaskCardViewProps {
  projects: Project[];
  tasksByProject: Map<string, Task[]>;
  activeTaskId: string | null;
  editingTaskId?: string | null;
  editTitle?: string;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onExpandProject?: (projectId: string) => void;
}

function CardTaskRow({
  task,
  isEditing,
  editTitle,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
}: {
  task: Task;
  isEditing: boolean;
  editTitle: string;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
}) {
  const overdue = isActionableOverdue(task);
  const blocked = !!task.blocked;

  return (
    <div
      className={`flex items-center gap-1 min-h-[1.625rem] rounded-md px-1 -mx-1 ${
        overdue
          ? "bg-red-50/80 dark:bg-red-950/30"
          : blocked
            ? "bg-amber-50/60 dark:bg-amber-950/20"
            : ""
      }`}
    >
      <span
        className={`w-1 h-1 rounded-full shrink-0 ${
          overdue
            ? "bg-red-500"
            : blocked
              ? "bg-amber-500"
              : task.dueDate
                ? "bg-cyan-500"
                : "bg-slate-300 dark:bg-slate-600"
        }`}
        aria-hidden
      />
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onEditTitleChange?.(e.target.value)}
          onBlur={() => onSaveEdit?.(task.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit?.(task.id);
            if (e.key === "Escape") onCancelEdit?.();
          }}
          maxLength={MAX_TASK_TITLE}
          className="flex-1 min-w-0 text-xs font-medium px-1 py-0 border border-cyan-300 dark:border-cyan-600 rounded bg-white dark:bg-[#131d30] dark:text-white outline-none"
          autoFocus
          aria-label="Edit task title"
        />
      ) : (
        <span
          className="flex-1 min-w-0 text-xs font-medium text-slate-800 dark:text-slate-100 truncate leading-tight"
          title={task.title}
        >
          {task.title}
        </span>
      )}
      {onStartEdit && !isEditing && (
        <button
          type="button"
          onClick={() => onStartEdit(task)}
          className="shrink-0 p-0.5 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
          title={`Edit "${task.title}"`}
          aria-label={`Edit task ${task.title}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  tasks,
  activeTaskId,
  editingTaskId,
  editTitle,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onExpandProject,
}: {
  project: Project;
  tasks: Task[];
  activeTaskId: string | null;
  editingTaskId?: string | null;
  editTitle?: string;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onExpandProject?: (projectId: string) => void;
}) {
  const topTasks = sortBucketTasks(tasks, activeTaskId).slice(0, 3);
  const remaining = tasks.length - topTasks.length;
  const isPersonal = project.id === DEFAULT_PROJECT_ID;

  return (
    <article
      className="rounded-lg border border-slate-200/90 dark:border-[#243350] bg-white/90 dark:bg-[#0f1729]/80 px-2.5 py-2 flex flex-col gap-1.5 min-h-[7.5rem]"
    >
      <header className="flex items-center gap-1.5 min-w-0">
        {project.color && (
          <span
            className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10"
            style={{ backgroundColor: project.color }}
            aria-hidden
          />
        )}
        <h3
          className="flex-1 min-w-0 truncate text-xs font-semibold text-slate-900 dark:text-white leading-tight"
          title={project.name}
        >
          {project.name}
        </h3>
        {isPersonal && (
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
            Personal
          </span>
        )}
      </header>

      <div className="flex-1 flex flex-col gap-0.5 justify-start">
        {topTasks.length === 0 ? (
          <p className="text-[11px] app-text-meta text-slate-400 dark:text-slate-500 py-1">
            No open tasks
          </p>
        ) : (
          topTasks.map((task) => (
            <CardTaskRow
              key={task.id}
              task={task}
              isEditing={editingTaskId === task.id}
              editTitle={editTitle ?? ""}
              onStartEdit={onStartEdit}
              onEditTitleChange={onEditTitleChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          ))
        )}
      </div>

      {remaining > 0 && onExpandProject && (
        <button
          type="button"
          onClick={() => onExpandProject(project.id)}
          className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400 hover:underline text-left shrink-0"
        >
          +{remaining} more
        </button>
      )}
    </article>
  );
}

export default function TaskCardView({
  projects,
  tasksByProject,
  activeTaskId,
  editingTaskId,
  editTitle,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onExpandProject,
}: TaskCardViewProps) {
  return (
    <div className="px-3 sm:px-4 pb-4 pt-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            tasks={tasksByProject.get(project.id) ?? []}
            activeTaskId={activeTaskId}
            editingTaskId={editingTaskId}
            editTitle={editTitle}
            onStartEdit={onStartEdit}
            onEditTitleChange={onEditTitleChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onExpandProject={onExpandProject}
          />
        ))}
      </div>
    </div>
  );
}
