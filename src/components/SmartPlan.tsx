"use client";

import { useMemo, useState } from "react";
import type { Task, Project, Settings } from "@/lib/types";
import {
  generateSmartPlan,
  projectLoadFromPlan,
  type ScoredTask,
  type DayPlan,
  type ProjectLoad,
} from "@/lib/smartplan";
import {
  addDaysISO,
  enumerateDates,
  getStartOfWeek,
  getToday,
  isWeekend,
  monthDay,
  parseLocalDate,
  relativeDayLabel,
  weekdayShort,
} from "@/lib/dates";
import { formatDuration, resolveProjectColor } from "@/components/task-list/utils";
import { BusyBeaver } from "@/components/BusyBeaver";

function accentOf(st: Pick<ScoredTask, "task" | "projectColor">): string {
  return resolveProjectColor({ id: st.task.projectId, color: st.projectColor });
}

function loadAccent(p: ProjectLoad): string {
  return resolveProjectColor({ id: p.projectId, color: p.color });
}

function filterDay(day: DayPlan, projectId: string | null): DayPlan {
  if (!projectId) return day;
  const tasks = day.tasks.filter((st) => st.task.projectId === projectId);
  return { ...day, tasks, sessionSlots: tasks.length };
}

function dayOrEmpty(date: string, today: string, map: Map<string, DayPlan>): DayPlan {
  return (
    map.get(date) ?? {
      date,
      label: relativeDayLabel(date, today),
      tasks: [],
      sessionSlots: 0,
    }
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.25l2.472 6.342h6.668l-5.4 3.923 2.061 6.342L12 15.934l-5.801 3.923 2.061-6.342-5.4-3.923h6.668L12 2.25z" />
    </svg>
  );
}

function CapacityTrack({
  tasks,
  dailyGoal,
}: {
  tasks: ScoredTask[];
  dailyGoal: number;
}) {
  const slots = Math.max(dailyGoal, 1);
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: slots }, (_, i) => {
        const st = tasks[i];
        return (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full min-w-[0.35rem] ${st ? "" : "bg-slate-200 dark:bg-[#243350]"}`}
            style={st ? { backgroundColor: accentOf(st) } : undefined}
            title={st ? st.task.title : "Open slot"}
          />
        );
      })}
      {tasks.length > dailyGoal
        ? Array.from({ length: tasks.length - dailyGoal }, (_, i) => {
            const st = tasks[dailyGoal + i];
            return (
              <span
                key={`over-${i}`}
                className="h-1.5 w-1.5 rounded-full shrink-0 opacity-80"
                style={{ backgroundColor: st ? accentOf(st) : "var(--urgency-chip)" }}
                title={st ? `${st.task.title} (over capacity)` : "Over capacity"}
              />
            );
          })
        : null}
    </div>
  );
}

function TaskChip({
  st,
  onStartTask,
  onSetOneThing,
  isOneThing,
  showOneThing,
  variant,
}: {
  st: ScoredTask;
  onStartTask: (id: string) => void;
  onSetOneThing?: (id: string) => void;
  isOneThing?: boolean;
  showOneThing?: boolean;
  variant: "hero" | "slot" | "compact";
}) {
  const t = st.task;
  const color = accentOf(st);
  const isHero = variant === "hero";
  const compact = variant === "compact";
  const metaBits: string[] = [];
  if (!compact) metaBits.push(st.projectName);
  if (!compact && !isHero && t.sessions > 0) {
    metaBits.push(`${t.sessions}s (${formatDuration(t.timeSpent)})`);
  }
  if (t.subtasks && t.subtasks.length > 0) {
    metaBits.push(`${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length}`);
  }

  return (
    <div
      className={`group flex items-start gap-2 rounded-lg transition-colors ${
        isHero ? "px-3 py-2.5" : compact ? "px-1.5 py-1" : "px-2 py-1.5"
      } ${
        isOneThing
          ? "bg-blue-50/90 dark:bg-blue-950/35"
          : st.overdue && isHero
            ? "bg-[var(--urgency-soft-bg)] dark:bg-rose-950/25"
            : isHero
              ? "bg-white/80 dark:bg-[#1a2d4a]/50"
              : "hover:bg-slate-50 dark:hover:bg-[#1a2d4a]/70"
      }`}
      style={{
        boxShadow: `inset 3px 0 0 ${color}`,
      }}
    >
      <button
        type="button"
        className="flex-1 min-w-0 text-left"
        onClick={() => onStartTask(t.id)}
        title="Focus this task"
      >
        <div className="flex items-start gap-1.5 min-w-0">
          <span
            className={`font-medium text-slate-800 dark:text-slate-100 ${
              isHero ? "text-sm sm:text-base leading-snug" : compact ? "text-xs leading-snug line-clamp-2" : "text-sm leading-snug"
            }`}
          >
            {t.title}
          </span>
          {isOneThing && !compact ? (
            <span className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-300" title="Today’s One Thing">
              <StarIcon className="w-3 h-3" />
            </span>
          ) : null}
        </div>
        <p
          className={`truncate mt-0.5 ${
            compact ? "text-[11px] text-slate-500 dark:text-slate-400" : "text-xs text-slate-500 dark:text-slate-400"
          }`}
        >
          {compact ? st.projectName : metaBits.join(" · ")}
          {st.overdue ? (
            <span className="urgency-text--mild"> · overdue</span>
          ) : st.atRisk ? (
            <span className="text-amber-600 dark:text-amber-400"> · won&apos;t fit</span>
          ) : null}
        </p>
      </button>

      <div
        className={`flex items-center shrink-0 ${
          isHero ? "opacity-100" : "opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
        } transition-opacity`}
      >
        {showOneThing && onSetOneThing && !isOneThing && (
          <button
            type="button"
            onClick={() => onSetOneThing(t.id)}
            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md"
            title="Set as Today’s One Thing"
            aria-label={`Set ${t.title} as One Thing`}
          >
            <StarIcon className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onStartTask(t.id)}
          className={`rounded-md ${
            isHero
              ? "btn-primary p-1.5"
              : "p-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
          title="Focus and start timer"
          aria-label={`Focus task: ${t.title}`}
        >
          <PlayIcon className={isHero ? "w-3.5 h-3.5" : "w-3.5 h-3.5"} />
        </button>
      </div>
    </div>
  );
}

function OpenSlot() {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 dark:border-[#243350] px-2 py-2 text-xs text-slate-400 dark:text-slate-500">
      Open slot
    </div>
  );
}

function GroupedTaskChips({
  items,
  onStartTask,
}: {
  items: ScoredTask[];
  onStartTask: (id: string) => void;
}) {
  const groups: ScoredTask[][] = [];
  const index = new Map<string, number>();
  for (const st of items) {
    const id = st.task.projectId;
    const at = index.get(id);
    if (at === undefined) {
      index.set(id, groups.length);
      groups.push([st]);
    } else {
      groups[at].push(st);
    }
  }
  return (
    <div className="space-y-2.5">
      {groups.map((group) => (
        <div key={group[0].task.projectId}>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-1 mb-1">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: accentOf(group[0]) }}
              aria-hidden
            />
            {group[0].projectName}
            <span className="tabular-nums text-slate-400 font-medium">{group.length}</span>
          </p>
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 roomy:grid-cols-3 gap-1">
            {group.map((st) => (
              <TaskChip key={st.task.id} st={st} onStartTask={onStartTask} variant="compact" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WeekDayCard({
  day,
  dailyGoal,
  onStartTask,
  oneThingTaskId,
  workDurationMin,
}: {
  day: DayPlan;
  dailyGoal: number;
  onStartTask: (id: string) => void;
  oneThingTaskId?: string | null;
  workDurationMin: number;
}) {
  const weekend = isWeekend(day.date);
  const over = day.tasks.length > dailyGoal;
  const totalTime = day.tasks.length * workDurationMin;

  return (
    <section
      className={`min-w-0 flex flex-col rounded-xl border px-2 py-2 ${
        weekend
          ? "border-slate-200/70 dark:border-[#243350]/70 bg-slate-50/40 dark:bg-[#0d1526]/60"
          : "border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90"
      }`}
    >
      <div className="flex items-start justify-between gap-1 px-0.5 mb-1.5">
        <div className="min-w-0">
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${
              weekend ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {weekdayShort(day.date)}
          </p>
          <p className="text-lg font-semibold tabular-nums tracking-tight text-slate-800 dark:text-slate-100 leading-none">
            {monthDay(day.date)}
          </p>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums pt-0.5">
          {day.tasks.length === 0 ? "Open" : over ? `${day.tasks.length} · +${day.tasks.length - dailyGoal}` : `${day.tasks.length} · ~${totalTime}m`}
        </span>
      </div>
      <div className="mb-1.5">
        <CapacityTrack tasks={day.tasks} dailyGoal={dailyGoal} />
      </div>
      {day.tasks.length > 0 ? (
        <div className="space-y-0.5 flex-1">
          {day.tasks.map((st) => (
            <TaskChip
              key={st.task.id}
              st={st}
              onStartTask={onStartTask}
              isOneThing={oneThingTaskId === st.task.id}
              variant="compact"
            />
          ))}
        </div>
      ) : (
        <p className="px-0.5 py-2 text-[11px] text-slate-400 dark:text-slate-500">Capacity free</p>
      )}
    </section>
  );
}

function ProjectMix({
  loads,
  totalScheduled,
  selectedId,
  onSelect,
}: {
  loads: ProjectLoad[];
  totalScheduled: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const inPlay = loads.filter((p) => p.scheduled > 0);
  return (
    <section className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30] px-3 py-2.5 min-w-0 h-full">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="app-section-label text-slate-500 dark:text-slate-400">Across projects</h3>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
          {loads.length} {loads.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {totalScheduled > 0 ? (
        <div
          className="flex h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-[#1a2d4a] mb-2.5"
          title="Sessions scheduled this window"
        >
          {inPlay.map((p) => (
            <span
              key={p.projectId}
              className="h-full min-w-[3px]"
              style={{
                width: `${(p.scheduled / totalScheduled) * 100}%`,
                backgroundColor: loadAccent(p),
              }}
              title={`${p.name}: ${p.scheduled} session${p.scheduled === 1 ? "" : "s"}`}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={selectedId === null}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border transition-colors ${
            selectedId === null
              ? "border-blue-500 bg-white text-blue-700 dark:border-blue-400 dark:bg-[#1a2744] dark:text-blue-100"
              : "border-slate-200 bg-white text-slate-600 dark:border-[#243350] dark:bg-[#0f172a] dark:text-slate-300"
          }`}
        >
          All
        </button>
        {loads.map((p) => {
          const active = selectedId === p.projectId;
          const starved = p.scheduled === 0 && p.unscheduled > 0;
          return (
            <button
              type="button"
              key={p.projectId}
              onClick={() => onSelect(active ? null : p.projectId)}
              aria-pressed={active}
              title={
                starved
                  ? `${p.name} has no sessions in this window`
                  : `${p.name}: ${p.scheduled} scheduled`
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border transition-colors max-w-full ${
                active
                  ? "border-blue-500 bg-white text-blue-700 dark:border-blue-400 dark:bg-[#1a2744] dark:text-blue-100"
                  : "border-slate-200 bg-white text-slate-600 dark:border-[#243350] dark:bg-[#0f172a] dark:text-slate-300"
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: loadAccent(p) }}
                aria-hidden
              />
              <span className="truncate">{p.name}</span>
              <span className="tabular-nums text-slate-500 dark:text-slate-400">{p.scheduled}</span>
              {p.unscheduled > 0 ? (
                <span className={`tabular-nums ${starved ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
                  +{p.unscheduled}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
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
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [laterOpen, setLaterOpen] = useState(false);

  const workDurationMin = Math.round(settings.workDuration / 60_000);
  const dailyGoal = Math.max(1, settings.dailyGoal || 3);
  const loads = useMemo(() => projectLoadFromPlan(plan), [plan]);
  const totalScheduled = loads.reduce((n, p) => n + p.scheduled, 0);

  const today = getToday();
  const dayMap = useMemo(() => new Map(plan.days.map((d) => [d.date, d])), [plan.days]);

  const weekStart = getStartOfWeek(parseLocalDate(today));
  const weekEnd = addDaysISO(weekStart, 6);
  const nextWeekStart = addDaysISO(weekStart, 7);
  const nextWeekEnd = addDaysISO(weekStart, 13);
  const tomorrow = addDaysISO(today, 1);

  const todayDay = filterDay(dayOrEmpty(today, today, dayMap), projectFilter);
  const restOfWeek = enumerateDates(tomorrow, weekEnd).map((date) =>
    filterDay(dayOrEmpty(date, today, dayMap), projectFilter),
  );
  const nextWeek = enumerateDates(nextWeekStart, nextWeekEnd).map((date) =>
    filterDay(dayOrEmpty(date, today, dayMap), projectFilter),
  );
  const nextWeekHasWork = nextWeek.some((d) => d.tasks.length > 0);
  const laterDays = plan.days
    .filter((d) => d.date > nextWeekEnd)
    .map((d) => filterDay(d, projectFilter))
    .filter((d) => d.tasks.length > 0);

  const atRisk = plan.unscheduled.filter((st) => st.atRisk && (!projectFilter || st.task.projectId === projectFilter));
  const laterWork = plan.unscheduled.filter((st) => !st.atRisk && (!projectFilter || st.task.projectId === projectFilter));

  const recommended = projectFilter
    ? (todayDay.tasks[0] ??
        restOfWeek.find((d) => d.tasks.length > 0)?.tasks[0] ??
        nextWeek.find((d) => d.tasks.length > 0)?.tasks[0] ??
        plan.unscheduled.find((st) => st.task.projectId === projectFilter) ??
        null)
    : plan.recommended;

  const recommendedIsOneThing = !!recommended && oneThingTaskId === recommended.task.id;
  const oneThingToday = todayDay.tasks.find((st) => st.task.id === oneThingTaskId) ?? null;
  const hero = oneThingToday ?? recommended;
  const slotTasks = todayDay.tasks;
  const inCapacity = slotTasks.slice(0, dailyGoal);
  const overflow = slotTasks.slice(dailyGoal);
  const openSlots = Math.max(0, dailyGoal - slotTasks.length);
  const overBy = Math.max(0, slotTasks.length - dailyGoal);

  const commitToday = () => {
    if (!hero) return;
    onSetOneThing?.(hero.task.id);
    onStartTask(hero.task.id);
  };

  const filteredName = projectFilter ? loads.find((p) => p.projectId === projectFilter)?.name : null;

  return (
    <div className="p-3 sm:p-4 space-y-4 overflow-hidden min-w-0">
      {plan.summary.totalTasks === 0 ? (
        <div className="py-10 text-center">
          <BusyBeaver alt="" size={72} className="mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-200">All clear</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
            No open tasks to schedule — Beavy’s dam is empty. Add work from Cards or List.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,19rem)] lg:items-stretch">
            <section className="rounded-2xl border border-blue-300/70 dark:border-blue-600/40 bg-blue-50/40 dark:bg-blue-950/20 px-3 py-3 sm:px-4 sm:py-3.5 min-w-0 flex flex-col">
              <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
                <div className="flex items-end gap-2.5 min-w-0">
                  <p className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white leading-none">
                    {monthDay(today)}
                  </p>
                  <div className="min-w-0 pb-0.5">
                    <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-200 leading-none">Today</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {weekdayShort(today)}
                      {filteredName ? ` · ${filteredName}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
                  <span className="tabular-nums">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{slotTasks.length}</span>
                    <span className="text-slate-500 dark:text-slate-400"> / {dailyGoal} slots</span>
                  </span>
                  {overBy > 0 ? (
                    <span className="urgency-text--mild font-medium tabular-nums">{overBy} over</span>
                  ) : openSlots > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                      {openSlots} open
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">Full</span>
                  )}
                  {plan.summary.overdueCount > 0 && !projectFilter ? (
                    <span className="urgency-text--mild tabular-nums">{plan.summary.overdueCount} overdue</span>
                  ) : null}
                  {plan.summary.atRiskCount > 0 && !projectFilter ? (
                    <span className="text-amber-600 dark:text-amber-400 tabular-nums">
                      {plan.summary.atRiskCount} won&apos;t fit
                    </span>
                  ) : null}
                  <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
                    {dailyGoal}×{workDurationMin}m
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <CapacityTrack tasks={slotTasks} dailyGoal={dailyGoal} />
              </div>

              {hero ? (
                <div className="mb-2">
                  <div className="flex items-center justify-between gap-2 px-0.5 mb-1">
                    <p className="app-section-label text-slate-500 dark:text-slate-400">
                      {recommendedIsOneThing || hero.task.id === oneThingTaskId ? "One Thing" : "Start with"}
                    </p>
                    {onSetOneThing && hero.task.id !== oneThingTaskId ? (
                      <button
                        type="button"
                        onClick={() => onSetOneThing(hero.task.id)}
                        className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:underline"
                      >
                        Set as One Thing
                      </button>
                    ) : null}
                  </div>
                  <TaskChip
                    st={hero}
                    onStartTask={commitToday}
                    onSetOneThing={onSetOneThing}
                    isOneThing={hero.task.id === oneThingTaskId}
                    showOneThing={false}
                    variant="hero"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 px-0.5">
                  {filteredName ? `No ${filteredName} work packed today.` : "No tasks packed today — capacity is free."}
                </p>
              )}

              <div className="space-y-1 flex-1">
                {inCapacity
                  .filter((st) => st.task.id !== hero?.task.id)
                  .map((st) => (
                    <TaskChip
                      key={st.task.id}
                      st={st}
                      onStartTask={onStartTask}
                      onSetOneThing={onSetOneThing}
                      isOneThing={oneThingTaskId === st.task.id}
                      showOneThing
                      variant="slot"
                    />
                  ))}
                {overflow.length > 0 ? (
                  <>
                    <p className="px-0.5 pt-1 text-[11px] font-semibold urgency-text--mild">
                      Over capacity
                    </p>
                    {overflow
                      .filter((st) => st.task.id !== hero?.task.id)
                      .map((st) => (
                        <TaskChip
                          key={st.task.id}
                          st={st}
                          onStartTask={onStartTask}
                          onSetOneThing={onSetOneThing}
                          isOneThing={oneThingTaskId === st.task.id}
                          showOneThing
                          variant="slot"
                        />
                      ))}
                  </>
                ) : null}
                {Array.from({ length: openSlots }, (_, i) => (
                  <OpenSlot key={`open-${i}`} />
                ))}
              </div>
            </section>

            <ProjectMix
              loads={loads}
              totalScheduled={totalScheduled}
              selectedId={projectFilter}
              onSelect={setProjectFilter}
            />
          </div>

          {restOfWeek.length > 0 ? (
            <section>
              <div className="flex items-baseline justify-between gap-2 px-0.5 mb-2">
                <h3 className="app-section-label text-slate-500 dark:text-slate-400">Rest of this week</h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {dailyGoal} sessions/day
                </span>
              </div>
              <div
                className={
                  restOfWeek.length <= 2
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
                    : restOfWeek.length === 3
                      ? "grid grid-cols-2 sm:grid-cols-3 gap-2"
                      : "grid grid-cols-2 sm:grid-cols-4 gap-2 lg:grid-cols-[repeat(var(--plan-days),minmax(0,1fr))]"
                }
                style={{ ["--plan-days" as string]: String(restOfWeek.length) }}
              >
                {restOfWeek.map((day) => (
                  <WeekDayCard
                    key={day.date}
                    day={day}
                    dailyGoal={dailyGoal}
                    onStartTask={onStartTask}
                    oneThingTaskId={oneThingTaskId}
                    workDurationMin={workDurationMin}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {nextWeekHasWork ? (
            <section>
              <h3 className="app-section-label text-slate-500 dark:text-slate-400 px-0.5 mb-2">Next week</h3>
              <div className="grid grid-cols-2 min-[480px]:grid-cols-4 lg:grid-cols-7 gap-2 opacity-95">
                {nextWeek.map((day) => (
                  <WeekDayCard
                    key={day.date}
                    day={day}
                    dailyGoal={dailyGoal}
                    onStartTask={onStartTask}
                    oneThingTaskId={oneThingTaskId}
                    workDurationMin={workDurationMin}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {laterDays.length > 0 ? (
            <section>
              <h3 className="app-section-label text-slate-500 dark:text-slate-400 px-0.5 mb-2">Later</h3>
              <div className="grid grid-cols-2 min-[480px]:grid-cols-3 roomy:grid-cols-4 gap-2">
                {laterDays.map((day) => (
                  <WeekDayCard
                    key={day.date}
                    day={day}
                    dailyGoal={dailyGoal}
                    onStartTask={onStartTask}
                    oneThingTaskId={oneThingTaskId}
                    workDurationMin={workDurationMin}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {atRisk.length > 0 ? (
            <section className="rounded-xl border border-[var(--urgency-border)] dark:border-rose-800/60 bg-[var(--urgency-soft-bg)] dark:bg-rose-950/20 px-3 py-2.5">
              <h3 className="app-section-label urgency-text--mild mb-1.5">
                Won&apos;t fit before the deadline · {atRisk.length}
              </h3>
              <GroupedTaskChips items={atRisk} onStartTask={onStartTask} />
            </section>
          ) : null}

          {laterWork.length > 0 ? (
            <div className="border-t border-slate-200/80 dark:border-[#243350]/80 pt-3">
              <button
                type="button"
                onClick={() => setLaterOpen((o) => !o)}
                className="flex items-center gap-2 w-full text-left px-1"
                aria-expanded={laterOpen}
              >
                <span className="app-section-label text-slate-500 dark:text-slate-400">Beyond this window</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{laterWork.length}</span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 ml-auto transition-transform ${laterOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {laterOpen ? (
                <div className="mt-2">
                  <GroupedTaskChips items={laterWork} onStartTask={onStartTask} />
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
