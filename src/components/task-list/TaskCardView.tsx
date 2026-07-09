"use client";

import React, { useEffect, useRef, useState } from "react";
import { DEFAULT_PROJECT_ID, type Project, type Task } from "@/lib/types";
import { getToday } from "@/lib/dates";
import { sortCardTasks } from "@/components/task-list/bucket-order";
import {
  formatDueDate,
  getDaysOverdue,
  isDueDateOverdue,
  MAX_TASK_TITLE,
} from "@/components/task-list/utils";
import { isActionableOverdue } from "@/lib/task-status";
import { QuickAddForm } from "@/components/task-list/QuickAddForm";

interface TaskCardViewProps {
  projects: Project[];
  tasksByProject: Map<string, Task[]>;
  completedCountByProject?: Map<string, number>;
  activeTaskId: string | null;
  editingTaskId?: string | null;
  editTitle?: string;
  onQuickAdd: (title: string, projectId: string) => void;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onExpandProject?: (projectId: string) => void;
}

function CardDuePrefix({ task }: { task: Task }) {
  if (!task.dueDate) return null;

  const blocked = !!task.blocked;
  const overdue = !blocked && !task.someday && isDueDateOverdue(task.dueDate);
  const isToday = task.dueDate === getToday();
  const daysLate = overdue ? getDaysOverdue(task.dueDate) : 0;
  const label = formatDueDate(task.dueDate);

  return (
    <span
      className={`shrink-0 font-semibold tabular-nums ${
        overdue
          ? "text-red-600 dark:text-red-300"
          : blocked
            ? "text-amber-700 dark:text-amber-300"
            : isToday
              ? "text-amber-700 dark:text-amber-300"
              : "text-slate-500 dark:text-slate-400"
      }`}
      title={
        blocked
          ? "Waiting on external blocker"
          : overdue
            ? `${daysLate}d overdue`
            : isToday
              ? "Due today"
              : `Due ${label}`
      }
    >
      [{label}]
    </span>
  );
}

function CardHeaderCounts({
  open,
  completed,
  overdue,
}: {
  open: number;
  completed: number;
  overdue: number;
}) {
  if (open === 0 && completed === 0) return null;

  const title = `${open} open · ${completed} completed${overdue > 0 ? ` · ${overdue} overdue` : ""}`;

  return (
    <span className="text-[10px] tabular-nums leading-none pl-0.5" title={title}>
      <span className="text-slate-500 dark:text-slate-400">{open} open</span>
      {overdue > 0 && (
        <>
          <span className="text-slate-400 dark:text-slate-500"> · </span>
          <span className="text-red-600 dark:text-red-300 font-medium">{overdue} late</span>
        </>
      )}
    </span>
  );
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
  const someday = !!task.someday;

  return (
    <div
      className={`group/row rounded-md border-l-[3px] pl-1.5 pr-0.5 py-0.5 ${
        overdue
          ? "border-l-red-500 dark:border-l-red-400"
          : blocked
            ? "border-l-amber-500 dark:border-l-amber-400"
            : someday
              ? "border-l-violet-400 dark:border-l-violet-500"
              : task.dueDate
                ? task.dueDate === getToday()
                  ? "border-l-amber-400 dark:border-l-amber-500"
                  : "border-l-cyan-500 dark:border-l-cyan-400"
                : "border-l-slate-300/60 dark:border-l-slate-600"
      }`}
    >
      <div className="flex items-center gap-1 min-h-[1.25rem]">
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
            className="flex-1 min-w-0 flex items-baseline gap-1 text-xs font-normal text-slate-700 dark:text-slate-200 leading-snug"
            title={task.dueDate ? `Due ${formatDueDate(task.dueDate)} — ${task.title}` : task.title}
          >
            {task.dueDate && <CardDuePrefix task={task} />}
            <span className="min-w-0 truncate">{task.title}</span>
          </span>
        )}
        {onStartEdit && !isEditing && (
          <button
            type="button"
            onClick={() => onStartEdit(task)}
            className="shrink-0 p-0.5 rounded text-slate-400 dark:text-slate-500 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
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
    </div>
  );
}

function ProjectCard({
  project,
  tasks,
  completedCount,
  activeTaskId,
  editingTaskId,
  editTitle,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onExpandProject,
  onQuickAdd,
}: {
  project: Project;
  tasks: Task[];
  completedCount: number;
  activeTaskId: string | null;
  editingTaskId?: string | null;
  editTitle?: string;
  onQuickAdd: (title: string, projectId: string) => void;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onExpandProject?: (projectId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const topTasks = sortCardTasks(tasks, activeTaskId).slice(0, 3);
  const remaining = tasks.length - topTasks.length;
  const overdueCount = tasks.filter((t) => isActionableOverdue(t)).length;
  const isPersonal = project.id === DEFAULT_PROJECT_ID;

  useEffect(() => {
    if (showAdd) addInputRef.current?.focus();
  }, [showAdd]);

  const submitQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onQuickAdd(title, project.id);
    setDraft("");
    setShowAdd(false);
  };

  return (
    <article
      className={`rounded-lg border px-2.5 py-2 flex flex-col gap-1 ${
        isPersonal
          ? "border-slate-200/90 dark:border-slate-600/40 bg-slate-50/90 dark:bg-[#151c2c]/80"
          : "border-slate-200/90 dark:border-[#243350] bg-white/90 dark:bg-[#0f1729]/80"
      }`}
      style={
        !isPersonal && project.color
          ? {
              borderTopWidth: 2,
              borderTopColor: project.color,
            }
          : undefined
      }
    >
      <header
        className="flex flex-col gap-0.5 min-w-0 pb-1.5 mb-0.5 border-b border-slate-200/70 dark:border-[#243350]/80"
        style={
          project.color
            ? {
                borderBottomColor: `color-mix(in srgb, ${project.color} 25%, transparent)`,
              }
            : undefined
        }
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {project.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10"
              style={{ backgroundColor: project.color }}
              aria-hidden
            />
          )}
          <h3
            className="flex-1 min-w-0 truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight"
            title={project.name}
          >
            {project.name}
          </h3>
          {isPersonal && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 shrink-0">
              Personal
            </span>
          )}
        </div>
        <CardHeaderCounts open={tasks.length} completed={completedCount} overdue={overdueCount} />
      </header>

      <div className="flex flex-col gap-0.5">
        {topTasks.length === 0 ? (
          <p className="text-[11px] app-text-meta text-slate-400 dark:text-slate-500 py-0.5">
            No tasks
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

      <div className="flex items-center gap-2 pt-0.5">
        {remaining > 0 && onExpandProject && (
          <button
            type="button"
            onClick={() => onExpandProject(project.id)}
            className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400 hover:underline shrink-0"
          >
            +{remaining} more
          </button>
        )}
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="text-[10px] font-medium text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {showAdd && (
        <QuickAddForm
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={submitQuickAdd}
          inputRef={addInputRef}
          compact
          className="shrink-0"
        />
      )}
    </article>
  );
}

export default function TaskCardView({
  projects,
  tasksByProject,
  completedCountByProject,
  activeTaskId,
  editingTaskId,
  editTitle,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onExpandProject,
  onQuickAdd,
}: TaskCardViewProps) {
  return (
    <div className="px-3 sm:px-4 pb-4 pt-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            tasks={tasksByProject.get(project.id) ?? []}
            completedCount={completedCountByProject?.get(project.id) ?? 0}
            activeTaskId={activeTaskId}
            editingTaskId={editingTaskId}
            editTitle={editTitle}
            onStartEdit={onStartEdit}
            onEditTitleChange={onEditTitleChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onExpandProject={onExpandProject}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>
    </div>
  );
}
