"use client";

import { useMemo, useState } from "react";
import type { Task, Project, Settings } from "@/lib/types";
import { generateSmartPlan, type ScoredTask, type DayPlan } from "@/lib/smartplan";
import { BusyBeaver } from "@/components/BusyBeaver";

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
  compact,
}: {
  st: ScoredTask;
  onStartTask: (id: string) => void;
  onSetOneThing?: (id: string) => void;
  isOneThing?: boolean;
  showOneThing?: boolean;
  compact?: boolean;
}) {
  const t = st.task;
  const meta: string[] = [st.projectName];
  if (!compact && t.sessions > 0) meta.push(`${t.sessions}s (${formatDuration(t.timeSpent)})`);
  if (t.subtasks && t.subtasks.length > 0) {
    meta.push(`${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length}`);
  }

  return (
    <div
      className={`group flex items-start gap-1.5 rounded-md transition-colors ${
        compact ? "px-1.5 py-0.5" : "px-2 py-0.5"
      } ${
        isOneThing
          ? "bg-blue-50/90 dark:bg-blue-950/35"
          : "hover:bg-slate-50 dark:hover:bg-[#1a2d4a]/70"
      }`}
    >
      <span
        className={`w-0.5 self-stretch rounded-full shrink-0 mt-0.5 ${
          st.overdue
            ? "bg-[var(--urgency-chip)]"
            : st.atRisk
              ? "bg-amber-500"
              : "bg-transparent"
        }`}
        aria-hidden
      />

      {st.projectColor ? (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
          style={{ backgroundColor: st.projectColor }}
          aria-hidden
        />
      ) : null}

      <button
        type="button"
        className="flex-1 min-w-0 text-left"
        onClick={() => onStartTask(t.id)}
        title="Focus this task"
      >
        <div className="flex items-start gap-1 min-w-0">
          <span
            className={`font-medium text-slate-800 dark:text-slate-100 ${
              compact ? "text-xs leading-snug line-clamp-2" : "text-sm truncate"
            }`}
          >
            {t.title}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
          {meta.join(" · ")}
          {st.overdue ? " · overdue" : ""}
          {st.atRisk && !st.overdue ? " · won't fit" : ""}
          {isOneThing ? " · One Thing" : ""}
        </p>
      </button>

      <div className="flex items-center shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {showOneThing && onSetOneThing && !isOneThing && (
          <button
            type="button"
            onClick={() => onSetOneThing(t.id)}
            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md"
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
          className="p-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md"
          title="Focus and start timer"
          aria-label={`Focus task: ${t.title}`}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function DayColumn({
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
    <section
      className={`min-w-0 flex flex-col rounded-xl border px-2 py-2 sm:px-2.5 sm:py-2.5 ${
        isToday
          ? "border-blue-300/80 dark:border-blue-600/45 bg-blue-50/50 dark:bg-blue-950/25"
          : "border-slate-200/90 dark:border-[#243350] bg-slate-50/60 dark:bg-[#131d30]/80"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2 px-0.5 mb-1.5">
        <h3
          className={`app-section-label ${
            isToday ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {day.label}
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
          {day.tasks.length === 0 ? "Open" : `${day.tasks.length} · ~${totalTime}m`}
        </span>
      </div>
      {day.tasks.length > 0 ? (
        <div className="space-y-0.5 flex-1">
          {day.tasks.map((st) => (
            <TaskRow
              key={st.task.id}
              st={st}
              onStartTask={onStartTask}
              onSetOneThing={onSetOneThing}
              isOneThing={oneThingTaskId === st.task.id}
              showOneThing={isToday}
              compact
            />
          ))}
        </div>
      ) : (
        <p className="px-1.5 py-3 text-xs text-slate-400 dark:text-slate-500">
          Capacity free
        </p>
      )}
    </section>
  );
}

function StatChip({
  value,
  label,
  tone = "neutral",
}: {
  value: string | number;
  label: string;
  tone?: "neutral" | "urgency" | "warn" | "ok";
}) {
  const valueClass =
    tone === "urgency"
      ? "urgency-text--mild"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "ok"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-slate-800 dark:text-slate-100";

  return (
    <span className="inline-flex items-baseline gap-1 min-w-0">
      <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>{value}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </span>
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
      <div className="flex flex-col gap-3 roomy:flex-row roomy:items-center roomy:justify-between roomy:gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Capacity {settings.dailyGoal}×{workDurationMin}m · pick today&apos;s focus
          </p>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <StatChip value={plan.summary.todayCount} label="today" />
            <StatChip value={plan.summary.daysNeeded} label="days to clear" />
            {plan.summary.overdueCount > 0 && (
              <StatChip value={plan.summary.overdueCount} label="overdue" tone="urgency" />
            )}
            {plan.summary.atRiskCount > 0 && (
              <StatChip value={plan.summary.atRiskCount} label="won't fit" tone="warn" />
            )}
            {plan.summary.overdueCount === 0 && plan.summary.atRiskCount === 0 && (
              <StatChip value="On track" label="" tone="ok" />
            )}
          </div>
        </div>

        {recommended && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border border-slate-200/90 dark:border-[#243350] bg-slate-50/80 dark:bg-[#131d30] px-3 py-2 min-w-0 roomy:max-w-xl roomy:flex-1">
            <div className="min-w-0 flex-1">
              <p className="app-section-label text-slate-500 dark:text-slate-400">
                Start with
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={recommended.task.title}>
                {recommended.task.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {recommended.projectName}
                {recommended.overdue ? " · overdue" : ""}
                {recommendedIsOneThing ? " · your One Thing" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onSetOneThing && !recommendedIsOneThing && (
                <button
                  type="button"
                  onClick={() => onSetOneThing(recommended.task.id)}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-[#243350] text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#1a2d4a] transition-colors"
                >
                  One Thing
                </button>
              )}
              <button
                type="button"
                onClick={commitToday}
                className="btn-primary inline-flex items-center px-3 py-1.5 text-xs"
              >
                Focus
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Day columns — fill width like Cards */}
      {plan.days.length > 0 ? (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 roomy:grid-cols-3 roomy:lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
          {plan.days.map((day) => (
            <DayColumn
              key={day.date}
              day={day}
              onStartTask={onStartTask}
              onSetOneThing={onSetOneThing}
              oneThingTaskId={oneThingTaskId}
              workDurationMin={workDurationMin}
            />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <BusyBeaver alt="" size={72} className="mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-200">All clear</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
            No open tasks to schedule — Beavy’s dam is empty. Add work from Cards or List.
          </p>
        </div>
      )}

      {plan.unscheduled.length > 0 && (
        <div className="border-t border-slate-200/80 dark:border-[#243350]/80 pt-3">
          <button
            type="button"
            onClick={() => setBacklogOpen((o) => !o)}
            className="flex items-center gap-2 w-full text-left px-1"
            aria-expanded={backlogOpen}
          >
            <span className="app-section-label text-slate-500 dark:text-slate-400">
              Beyond window
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {plan.unscheduled.length}
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
            <div className="mt-2 grid grid-cols-1 min-[480px]:grid-cols-2 roomy:grid-cols-3 gap-1 opacity-90">
              {plan.unscheduled.map((st) => (
                <TaskRow key={st.task.id} st={st} onStartTask={onStartTask} compact />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
