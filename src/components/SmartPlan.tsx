"use client";

import { useMemo, useState } from "react";
import type { Task, Project, Settings } from "@/lib/types";
import { generateSmartPlan, type ScoredTask, type DayPlan } from "@/lib/smartplan";

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function TaskRow({
  st,
  onStartTask,
  onSetOneThing,
  isOneThing,
  showOneThing,
}: {
  st: ScoredTask;
  onStartTask: (id: string) => void;
  onSetOneThing?: (id: string) => void;
  isOneThing?: boolean;
  showOneThing?: boolean;
}) {
  const t = st.task;
  const subtaskProgress =
    t.subtasks && t.subtasks.length > 0
      ? `${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length}`
      : null;

  return (
    <div
      className={`group flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 rounded-lg transition-colors ${
        st.overdue
          ? "border-l-2 border-[var(--urgency-chip)]"
          : st.atRisk
            ? "border-l-2 border-amber-600"
            : ""
      } ${isOneThing ? "bg-blue-50/80 dark:bg-blue-950/30" : "hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"}`}
    >
      {st.projectColor && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: st.projectColor }}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        className="flex-1 min-w-0 text-left"
        onClick={() => onStartTask(t.id)}
        title="Focus this task"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{t.title}</span>
          {isOneThing && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
              One Thing
            </span>
          )}
          {st.overdue && (
            <span className="text-[10px] font-semibold urgency-chip--soft px-1.5 py-0.5 rounded flex-shrink-0">
              Overdue
            </span>
          )}
          {st.atRisk && !st.overdue && (
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded flex-shrink-0">
              Won&apos;t fit
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 mt-0.5">
          <span className="text-xs text-slate-400 dark:text-slate-300">{st.projectName}</span>
          {t.sessions > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-300">
              · {t.sessions}s ({formatDuration(t.timeSpent)})
            </span>
          )}
          {subtaskProgress && (
            <span className="text-xs text-slate-400 dark:text-slate-300">· {subtaskProgress}</span>
          )}
        </div>
      </button>

      <div className="flex items-center gap-0.5 shrink-0">
        {showOneThing && onSetOneThing && !isOneThing && (
          <button
            type="button"
            onClick={() => onSetOneThing(t.id)}
            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Set as Today’s One Thing"
            aria-label={`Set ${t.title} as One Thing`}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2.25l2.472 6.342h6.668l-5.4 3.923 2.061 6.342L12 15.934l-5.801 3.923 2.061-6.342-5.4-3.923h6.668L12 2.25z" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={() => onStartTask(t.id)}
          className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
          title="Focus and start timer"
          aria-label={`Focus task: ${t.title}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function DaySection({
  day,
  onStartTask,
  onSetOneThing,
  oneThingTaskId,
  workDurationMin,
}: {
  day: DayPlan;
  onStartTask: (id: string) => void;
  onSetOneThing?: (id: string) => void;
  oneThingTaskId?: string | null;
  workDurationMin: number;
}) {
  const isToday = day.label === "Today";
  const totalTime = day.tasks.length * workDurationMin;

  return (
    <div className={`mb-3 sm:mb-4 ${isToday ? "rounded-xl border border-blue-200/80 dark:border-blue-800/50 bg-blue-50/40 dark:bg-blue-950/20 p-2.5 sm:p-3" : ""}`}>
      <div className="flex items-center justify-between mb-1.5 px-0.5 gap-2">
        <h3
          className={`text-sm font-semibold flex-shrink-0 ${
            isToday ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"
          }`}
        >
          {day.label}
          {!isToday && day.label !== "Tomorrow" && (
            <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-slate-500">{day.date}</span>
          )}
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-300 flex-shrink-0 whitespace-nowrap">
          {day.tasks.length} task{day.tasks.length !== 1 ? "s" : ""} · ~{totalTime}m
        </span>
      </div>
      {day.tasks.length > 0 ? (
        <div className="space-y-0.5">
          {day.tasks.map((st) => (
            <TaskRow
              key={st.task.id}
              st={st}
              onStartTask={onStartTask}
              onSetOneThing={onSetOneThing}
              isOneThing={oneThingTaskId === st.task.id}
              showOneThing={isToday}
            />
          ))}
        </div>
      ) : (
        <div className="px-3 py-3 text-sm text-slate-400 dark:text-slate-300 italic">
          Capacity free — add a task or pull from backlog
        </div>
      )}
    </div>
  );
}

export default function SmartPlan({
  tasks,
  projects,
  settings,
  onStartTask,
  onSetOneThing,
  oneThingTaskId = null,
}: {
  tasks: Task[];
  projects: Project[];
  settings: Settings;
  onStartTask: (id: string) => void;
  onSetOneThing?: (id: string) => void;
  oneThingTaskId?: string | null;
}) {
  const plan = useMemo(() => generateSmartPlan(tasks, projects, settings), [tasks, projects, settings]);
  const [backlogOpen, setBacklogOpen] = useState(false);

  const workDurationMin = Math.round(settings.workDuration / 60_000);
  const recommended = plan.recommended;
  const recommendedIsOneThing = !!recommended && oneThingTaskId === recommended.task.id;

  const commitToday = () => {
    if (!recommended) return;
    onSetOneThing?.(recommended.task.id);
    onStartTask(recommended.task.id);
  };

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-hidden min-w-0">
      <div className="px-0.5">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Smart Plan</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
          Spreads open work across days using your capacity ({settings.dailyGoal} session
          {settings.dailyGoal !== 1 ? "s" : ""}/day × {workDurationMin}m). Use it to pick today&apos;s focus — not as a
          calendar to edit.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-50 dark:bg-[#131d30] rounded-xl px-3 py-2.5 text-center">
          <div className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{plan.summary.todayCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-300">Today</div>
        </div>
        <div className="bg-slate-50 dark:bg-[#131d30] rounded-xl px-3 py-2.5 text-center">
          <div className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{plan.summary.daysNeeded}</div>
          <div className="text-xs text-slate-500 dark:text-slate-300">Days to clear</div>
        </div>
        {plan.summary.overdueCount > 0 && (
          <div className="rounded-xl px-3 py-2.5 text-center urgency-surface border">
            <div className="text-lg font-bold urgency-text--mild tabular-nums">{plan.summary.overdueCount}</div>
            <div className="text-xs urgency-text--mild">Overdue</div>
          </div>
        )}
        {plan.summary.atRiskCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/15 rounded-xl px-3 py-2.5 text-center">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {plan.summary.atRiskCount}
            </div>
            <div className="text-xs text-amber-500 dark:text-amber-400">Won&apos;t fit</div>
          </div>
        )}
        {plan.summary.overdueCount === 0 && plan.summary.atRiskCount === 0 && (
          <>
            <div className="bg-slate-50 dark:bg-[#131d30] rounded-xl px-3 py-2.5 text-center">
              <div className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{plan.summary.totalTasks}</div>
              <div className="text-xs text-slate-500 dark:text-slate-300">Open</div>
            </div>
            <div className="bg-slate-50 dark:bg-[#131d30] rounded-xl px-3 py-2.5 text-center col-span-2 sm:col-span-1">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">On track</div>
              <div className="text-xs text-slate-500 dark:text-slate-300">No overdue</div>
            </div>
          </>
        )}
      </div>

      {recommended && (
        <div className="rounded-xl border border-blue-300/80 dark:border-blue-600/50 bg-blue-50 dark:bg-blue-950/40 px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-blue-800 dark:text-blue-200">
            Recommended for today
          </p>
          <p className="mt-1 text-sm font-semibold text-blue-950 dark:text-white truncate" title={recommended.task.title}>
            {recommended.task.title}
          </p>
          <p className="text-xs text-blue-800/80 dark:text-blue-200/80 mt-0.5">
            {recommended.projectName}
            {recommended.overdue ? " · overdue" : ""}
            {recommendedIsOneThing ? " · already your One Thing" : ""}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {onSetOneThing && !recommendedIsOneThing && (
              <button
                type="button"
                onClick={() => onSetOneThing(recommended.task.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white dark:bg-blue-900/50 text-blue-800 dark:text-blue-100 border border-blue-300 dark:border-blue-600/60 hover:bg-blue-100/80 dark:hover:bg-blue-900/70 transition-colors"
              >
                Set as One Thing
              </button>
            )}
            <button
              type="button"
              onClick={commitToday}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {recommendedIsOneThing ? "Focus now" : "One Thing + Focus"}
            </button>
          </div>
        </div>
      )}

      {plan.days.length > 0 ? (
        plan.days.map((day) => (
          <DaySection
            key={day.date}
            day={day}
            onStartTask={onStartTask}
            onSetOneThing={onSetOneThing}
            oneThingTaskId={oneThingTaskId}
            workDurationMin={workDurationMin}
          />
        ))
      ) : (
        <div className="text-center py-8 text-slate-400 dark:text-slate-300">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-200">All clear</p>
          <p className="text-xs mt-1">No open tasks to schedule. Add work from Cards or List.</p>
        </div>
      )}

      {plan.unscheduled.length > 0 && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setBacklogOpen((o) => !o)}
            className="flex items-center gap-2 mb-1.5 px-0.5 text-left w-full group"
            aria-expanded={backlogOpen}
          >
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-300">Backlog</h3>
            <span className="text-xs text-slate-400 dark:text-slate-400">
              {plan.unscheduled.length} beyond this window
            </span>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 ml-auto transition-transform ${backlogOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {backlogOpen && (
            <div className="space-y-0.5 opacity-80">
              {plan.unscheduled.map((st) => (
                <TaskRow key={st.task.id} st={st} onStartTask={onStartTask} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
