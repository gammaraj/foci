"use client";

import React, { useState } from "react";
import type { Task, Project } from "@/lib/types";
import { ALL_PROJECTS_ID } from "@/lib/types";
import { formatDueDate } from "./utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface TaskCalendarViewProps {
  tasks: Task[];
  projects: Project[];
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
  onSetDueDate: (id: string, date: string | undefined) => void;
  activeTaskId: string | null;
  onStartTask: (taskId: string) => void;
  isTimerRunning: boolean;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  onQuickAdd?: (title: string, dueDate: string) => void;
  expandedTaskId?: string | null;
  onToggleTaskDetail?: (taskId: string) => void;
  renderBelowTask?: (task: Task) => React.ReactNode;
}

export default function TaskCalendarView({
  tasks,
  projects,
  calendarDate,
  setCalendarDate,
  onSetDueDate,
  activeTaskId,
  onStartTask,
  isTimerRunning,
  selectedDay,
  onSelectDay,
  onQuickAdd,
  expandedTaskId = null,
  onToggleTaskDetail,
  renderBelowTask,
}: TaskCalendarViewProps) {
  const [projectFilter, setProjectFilter] = useState<string>(ALL_PROJECTS_ID);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDow = new Date(year, month, 1).getDay();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const filteredTasks =
    projectFilter === ALL_PROJECTS_ID
      ? tasks
      : tasks.filter((t) => t.projectId === projectFilter);

  const tasksByDate: Record<string, Task[]> = {};
  for (const t of filteredTasks) {
    if (t.dueDate && !t.archivedAt) {
      (tasksByDate[t.dueDate] ??= []).push(t);
    }
  }

  const unscheduledTasks = filteredTasks.filter((t) => !t.dueDate && !t.completed && !t.archivedAt);
  const visibleProjects = projects.filter((p) => !p.archived);

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCalendarDate(new Date());
    onSelectDay(todayStr);
  };

  const emptyCells = Array.from({ length: startingDow });
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const selectedTasks = selectedDay ? (tasksByDate[selectedDay] ?? []) : [];

  return (
    <div className="p-4">
      {visibleProjects.length > 1 && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setProjectFilter(ALL_PROJECTS_ID)}
            className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              projectFilter === ALL_PROJECTS_ID
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-slate-200 dark:border-[#1e3050] text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500"
            }`}
          >
            All
          </button>
          {visibleProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => setProjectFilter(p.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                projectFilter === p.id
                  ? "border-transparent text-white"
                  : "border-slate-200 dark:border-[#1e3050] text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500"
              }`}
              style={projectFilter === p.id && p.color ? { backgroundColor: p.color, borderColor: p.color } : {}}
            >
              {p.color && (
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${projectFilter === p.id ? "hidden" : ""}`}
                  style={{ backgroundColor: p.color }}
                />
              )}
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            onClick={goToday}
            className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 dark:text-slate-300 uppercase">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {emptyCells.map((_, i) => (
          <div key={`e-${i}`} className="min-h-[68px]" />
        ))}
        {dayCells.map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayTasks = tasksByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;
          const isPast = dateStr < todayStr;
          const hasOverdue = isPast && dayTasks.some((t) => !t.completed);

          return (
            <button
              key={day}
              onClick={() => onSelectDay(isSelected ? null : dateStr)}
              className={`min-h-[68px] rounded-lg flex flex-col p-1 text-xs transition-all w-full text-left ${
                isSelected
                  ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-[#111827]"
                  : isToday
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700"
                    : "hover:bg-slate-100 dark:hover:bg-[#1a2d4a] text-slate-600 dark:text-slate-300"
              }`}
            >
              <span className={`text-xs font-semibold self-end leading-none mb-1 ${isToday && !isSelected ? "font-bold" : ""}`}>{day}</span>
              <div className="flex flex-col gap-0.5 w-full">
                {dayTasks.slice(0, 2).map((t) => {
                  const chipColor = isSelected
                    ? "bg-white/20 text-white"
                    : t.completed
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : hasOverdue && !t.completed
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
                  return (
                    <div
                      key={t.id}
                      className={`w-full truncate text-xs leading-tight px-1 py-0.5 rounded ${chipColor} ${t.completed ? "line-through" : ""}`}
                    >
                      {t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 2 && (
                  <span className={`text-xs leading-none px-1 ${isSelected ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                    +{dayTasks.length - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400 dark:text-slate-300">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> Pending</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" /> Done</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Overdue</div>
      </div>

      {selectedDay && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e3050]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {formatDueDate(selectedDay)}
              {selectedDay === todayStr && " — Today"}
            </h4>
            <span className="text-xs text-slate-400">{selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}</span>
          </div>
          {selectedTasks.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-400 dark:text-slate-400">No tasks due on this day.</p>
              {onQuickAdd && selectedDay && (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!quickAddTitle.trim()) return;
                    onQuickAdd(quickAddTitle, selectedDay);
                    setQuickAddTitle("");
                  }}
                >
                  <input
                    type="text"
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    placeholder="Add a task for this day..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedTasks.map((task) => (
                <div key={task.id}>
                <div
                  role={onToggleTaskDetail ? "button" : undefined}
                  tabIndex={onToggleTaskDetail ? 0 : undefined}
                  onClick={onToggleTaskDetail ? () => onToggleTaskDetail(task.id) : undefined}
                  onKeyDown={
                    onToggleTaskDetail
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onToggleTaskDetail(task.id);
                          }
                        }
                      : undefined
                  }
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${
                    onToggleTaskDetail ? "cursor-pointer" : ""
                  } ${
                    expandedTaskId === task.id
                      ? "border-violet-300 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-900/15 ring-1 ring-violet-400/25"
                      : task.completed
                        ? "border-slate-100 dark:border-[#1e3050] opacity-60"
                        : activeTaskId === task.id
                          ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : selectedDay < todayStr
                            ? "border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10"
                            : "border-slate-200 dark:border-[#1e3050] hover:bg-slate-50/80 dark:hover:bg-[#131d30]/60"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.completed ? "bg-green-400" : selectedDay < todayStr ? "bg-red-400" : "bg-blue-400"
                  }`} />
                  <span className={`text-sm flex-1 truncate ${
                    task.completed
                      ? "line-through text-slate-400"
                      : "text-slate-700 dark:text-slate-200 font-medium"
                  }`}>
                    {task.title}
                  </span>
                  {!task.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartTask(task.id);
                      }}
                      className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      {isTimerRunning ? "Switch" : "Start"}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDueDate(task.id, undefined);
                    }}
                    className="flex-shrink-0 p-1 text-slate-400 dark:text-slate-400 hover:text-red-400 transition-colors"
                    title="Remove due date"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {renderBelowTask?.(task)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {unscheduledTasks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e3050]">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            No due date ({unscheduledTasks.length})
          </h4>
          <div className="space-y-1">
            {unscheduledTasks.slice(0, 8).map((task) => (
              <div key={task.id}>
              <div
                role={onToggleTaskDetail ? "button" : undefined}
                tabIndex={onToggleTaskDetail ? 0 : undefined}
                onClick={onToggleTaskDetail ? () => onToggleTaskDetail(task.id) : undefined}
                onKeyDown={
                  onToggleTaskDetail
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onToggleTaskDetail(task.id);
                        }
                      }
                    : undefined
                }
                className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                  onToggleTaskDetail ? "cursor-pointer" : "border-transparent"
                } ${
                  expandedTaskId === task.id
                    ? "border-violet-300 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-900/15"
                    : "border-transparent hover:bg-slate-50/80 dark:hover:bg-[#131d30]/60"
                }`}
              >
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate flex-1">{task.title}</span>
                <div
                  className="relative flex-shrink-0 p-1 text-slate-400 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  title="Set due date"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="date"
                    onChange={(e) => { if (e.target.value) onSetDueDate(task.id, e.target.value); }}
                    onFocus={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                  />
                </div>
              </div>
              {renderBelowTask?.(task)}
              </div>
            ))}
            {unscheduledTasks.length > 8 && (
              <p className="text-xs text-slate-400 text-center">+{unscheduledTasks.length - 8} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
