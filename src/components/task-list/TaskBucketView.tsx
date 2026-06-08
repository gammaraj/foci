"use client";

import React, { useState } from "react";
import type { Project, Task } from "@/lib/types";
import { getToday } from "@/lib/dates";
import { formatDueDate, isDueDateOverdue, MAX_TASK_TITLE } from "@/components/task-list/utils";
import { ProjectTabName } from "@/components/task-list/ProjectTabName";

const BUCKET_COLUMN_WIDTH = "w-[min(100%,288px)] sm:w-[288px]";

interface TaskBucketViewProps {
  projects: Project[];
  tasksByProject: Map<string, Task[]>;
  activeTaskId: string | null;
  isTimerRunning: boolean;
  /** Label for the dated (in-scope) swimlane, e.g. "Due today". */
  datedLaneLabel?: string;
  onToggleComplete: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onSelectTask: (taskId: string | null) => void;
  onQuickAdd: (title: string, projectId: string) => void;
}

function sortBucketTasks(tasks: Task[], activeTaskId: string | null): Task[] {
  return [...tasks].sort((a, b) => {
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

interface BucketSwimlane {
  id: string;
  label: string;
  tasks: Task[];
}

function buildSwimlanes(
  tasks: Task[],
  activeTaskId: string | null,
  datedLaneLabel: string
): BucketSwimlane[] {
  const sorted = sortBucketTasks(tasks, activeTaskId);
  const overdue = sorted.filter((t) => t.dueDate && isDueDateOverdue(t.dueDate));
  const dated = sorted.filter((t) => t.dueDate && !isDueDateOverdue(t.dueDate));
  const undated = sorted.filter((t) => !t.dueDate);

  const lanes: BucketSwimlane[] = [];
  if (overdue.length > 0) lanes.push({ id: "overdue", label: "Overdue", tasks: overdue });
  if (dated.length > 0) lanes.push({ id: "dated", label: datedLaneLabel, tasks: dated });
  if (undated.length > 0) lanes.push({ id: "undated", label: "No date", tasks: undated });
  return lanes;
}

function DueBadge({ dueDate }: { dueDate: string }) {
  const today = getToday();
  const overdue = isDueDateOverdue(dueDate);
  const isToday = dueDate === today;
  const label = isToday ? "Today" : formatDueDate(dueDate);

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
        overdue
          ? "bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-300"
          : isToday
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
            : "bg-slate-100 dark:bg-[#1a2d4a] text-slate-500 dark:text-slate-400"
      }`}
    >
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {label}
    </span>
  );
}

function BucketTaskCard({
  task,
  isActive,
  isTimerRunning,
  onToggleComplete,
  onStartTask,
  onSelectTask,
}: {
  task: Task;
  isActive: boolean;
  isTimerRunning: boolean;
  onToggleComplete: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onSelectTask: (taskId: string | null) => void;
}) {
  const showFocusAction = isActive || isTimerRunning;

  return (
    <div
      className={`group rounded-lg border px-2 py-1.5 transition-colors ${
        isActive
          ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/25 ring-1 ring-blue-400/25"
          : "border-slate-200 dark:border-[#243350] bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-[#2d4266]"
      }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-slate-300 dark:border-slate-600 hover:border-green-400"
          }`}
          aria-label={`Mark "${task.title}" complete`}
        >
          {task.completed && (
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1 min-w-0">
            <p
              className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug truncate"
              title={task.title}
            >
              {task.title}
            </p>
            <div
              className={`shrink-0 transition-opacity ${
                showFocusAction
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              }`}
            >
              {isActive && isTimerRunning ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-blue-600 text-white whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Active
                </span>
              ) : isActive ? (
                <button
                  type="button"
                  onClick={() => onSelectTask(null)}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap"
                >
                  Clear
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartTask(task.id)}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-md text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-900/25 hover:bg-blue-100 dark:hover:bg-blue-900/40 whitespace-nowrap"
                  title={`Focus on "${task.title}"`}
                >
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Focus
                </button>
              )}
            </div>
          </div>
          {task.dueDate && (
            <div className="mt-1">
              <DueBadge dueDate={task.dueDate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BucketColumn({
  project,
  tasks,
  datedLaneLabel,
  activeTaskId,
  isTimerRunning,
  onToggleComplete,
  onStartTask,
  onSelectTask,
  onQuickAdd,
}: {
  project: Project;
  tasks: Task[];
  datedLaneLabel: string;
  activeTaskId: string | null;
  isTimerRunning: boolean;
  onToggleComplete: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onSelectTask: (taskId: string | null) => void;
  onQuickAdd: (title: string, projectId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const swimlanes = buildSwimlanes(tasks, activeTaskId, datedLaneLabel);
  const showLaneHeaders = swimlanes.length > 1;

  return (
    <div
      className={`${BUCKET_COLUMN_WIDTH} flex-shrink-0 flex flex-col rounded-xl border border-slate-200 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/50 max-h-[min(70vh,640px)]`}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-[#243350] shrink-0"
        title={project.description?.trim() || project.name}
      >
        {project.favorite && (
          <svg className="w-3 h-3 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="Pinned project">
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
        <div className="min-w-0 flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <ProjectTabName project={project} />
        </div>
        <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500 shrink-0">{tasks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 min-h-[120px]">
        {tasks.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 px-2">No tasks here</p>
        ) : (
          <div className="space-y-3">
            {swimlanes.map((lane) => (
              <div key={lane.id}>
                {showLaneHeaders && (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 px-0.5 mb-1.5">
                    {lane.label}
                    <span className="ml-1 tabular-nums font-normal normal-case tracking-normal">
                      ({lane.tasks.length})
                    </span>
                  </p>
                )}
                <div className="space-y-1.5">
                  {lane.tasks.map((task) => (
                    <BucketTaskCard
                      key={task.id}
                      task={task}
                      isActive={activeTaskId === task.id}
                      isTimerRunning={isTimerRunning}
                      onToggleComplete={onToggleComplete}
                      onStartTask={onStartTask}
                      onSelectTask={onSelectTask}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        className="p-2 border-t border-slate-100 dark:border-[#243350] shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          const title = draft.trim();
          if (!title) return;
          onQuickAdd(title, project.id);
          setDraft("");
        }}
      >
        <div className="flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="+ Add task"
            maxLength={MAX_TASK_TITLE}
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TaskBucketView({
  projects,
  tasksByProject,
  activeTaskId,
  isTimerRunning,
  datedLaneLabel = "Scheduled",
  onToggleComplete,
  onStartTask,
  onSelectTask,
  onQuickAdd,
}: TaskBucketViewProps) {
  const columnsWithTasks = projects.filter((p) => (tasksByProject.get(p.id)?.length ?? 0) > 0);
  const emptyColumns = projects.filter((p) => (tasksByProject.get(p.id)?.length ?? 0) === 0);
  const orderedColumns = [...columnsWithTasks, ...emptyColumns];

  return (
    <div className="px-3 sm:px-4 pb-4 pt-1">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide items-stretch snap-x snap-mandatory sm:snap-none">
        {orderedColumns.map((project) => (
          <BucketColumn
            key={project.id}
            project={project}
            tasks={tasksByProject.get(project.id) ?? []}
            datedLaneLabel={datedLaneLabel}
            activeTaskId={activeTaskId}
            isTimerRunning={isTimerRunning}
            onToggleComplete={onToggleComplete}
            onStartTask={onStartTask}
            onSelectTask={onSelectTask}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>
    </div>
  );
}
