import type { Task, Project, Settings } from "./types";
import { addDaysISO, diffCalendarDays, getToday, relativeDayLabel } from "./dates";

// ── Types ────────────────────────────────────────────────

export interface ScoredTask {
  task: Task;
  projectName: string;
  projectColor?: string;
  score: number; // higher = more urgent
  daysUntilDue: number | null;
  atRisk: boolean; // cannot fit before deadline at current capacity
  overdue: boolean;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  label: string; // "Today", "Tomorrow", "Wed Mar 25", etc.
  tasks: ScoredTask[];
  sessionSlots: number; // how many sessions planned this day
}

export interface SmartPlanResult {
  days: DayPlan[];
  unscheduled: ScoredTask[];
  /** Best task to make Today’s One Thing (today’s first planned, else top overdue). */
  recommended: ScoredTask | null;
  summary: {
    totalTasks: number;
    atRiskCount: number;
    overdueCount: number;
    daysNeeded: number;
    todayCount: number;
  };
}

export interface ProjectLoad {
  projectId: string;
  name: string;
  color?: string;
  scheduled: number;
  unscheduled: number;
  overdue: number;
}

/** How the plan distributes sessions across projects (plus work that did not fit). */
export function projectLoadFromPlan(plan: SmartPlanResult): ProjectLoad[] {
  const map = new Map<string, ProjectLoad>();
  const bump = (st: ScoredTask, field: "scheduled" | "unscheduled") => {
    const id = st.task.projectId;
    const cur = map.get(id) ?? {
      projectId: id,
      name: st.projectName,
      color: st.projectColor,
      scheduled: 0,
      unscheduled: 0,
      overdue: 0,
    };
    cur[field] += 1;
    if (st.overdue) cur.overdue += 1;
    map.set(id, cur);
  };
  for (const day of plan.days) {
    for (const st of day.tasks) bump(st, "scheduled");
  }
  for (const st of plan.unscheduled) bump(st, "unscheduled");
  return [...map.values()].sort((a, b) => {
    const aTotal = a.scheduled + a.unscheduled;
    const bTotal = b.scheduled + b.unscheduled;
    if (aTotal !== bTotal) return bTotal - aTotal;
    if (a.scheduled !== b.scheduled) return b.scheduled - a.scheduled;
    return a.name.localeCompare(b.name);
  });
}

// ── Scoring ──────────────────────────────────────────────

function scoreTask(
  task: Task,
  project: Project | undefined,
  today: string,
): ScoredTask {
  const projectName = project?.name ?? "General";
  const projectColor = project?.color;

  const effectiveDue = task.dueDate ?? project?.dueDate;
  const daysUntilDue = effectiveDue ? diffCalendarDays(effectiveDue, today) : null;
  const overdue = daysUntilDue !== null && daysUntilDue < 0;

  let score = 0;

  if (daysUntilDue !== null) {
    if (overdue) {
      score += 100 + Math.abs(daysUntilDue) * 5;
    } else if (daysUntilDue === 0) {
      score += 95;
    } else if (daysUntilDue <= 1) {
      score += 85;
    } else if (daysUntilDue <= 3) {
      score += 70;
    } else if (daysUntilDue <= 7) {
      score += 50;
    } else {
      score += Math.max(10, 40 - daysUntilDue);
    }
  }

  if (task.sessions > 0) {
    score += Math.min(15, 5 + task.sessions * 2);
  }

  if (task.subtasks && task.subtasks.length > 0) {
    const done = task.subtasks.filter((s) => s.completed).length;
    const ratio = done / task.subtasks.length;
    if (ratio > 0 && ratio < 1) {
      score += Math.round(ratio * 10);
    }
  }

  // atRisk is set during scheduling when a due task cannot fit before its deadline
  return { task, projectName, projectColor, score, daysUntilDue, atRisk: false, overdue };
}

// ── Plan Generation ──────────────────────────────────────

/**
 * Build a day-by-day focus schedule from open tasks and daily session capacity.
 * Overdue work lands today; dated work packs toward deadlines; undated fills leftover slots.
 */
export function generateSmartPlan(
  tasks: Task[],
  projects: Project[],
  settings: Settings,
  planDays: number = 14,
): SmartPlanResult {
  const today = getToday();
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const activeTasks = tasks.filter((t) => !t.completed && !t.archivedAt && !t.blocked && !t.someday);

  const scored = activeTasks
    .map((t) => scoreTask(t, projectMap.get(t.projectId), today))
    .sort((a, b) => b.score - a.score);

  const dailyGoal = Math.max(1, settings.dailyGoal || 3);

  const withDue = scored.filter((s) => s.daysUntilDue !== null);
  const withoutDue = scored.filter((s) => s.daysUntilDue === null);

  const dayMap = new Map<string, DayPlan>();
  for (let i = 0; i < planDays; i++) {
    const dateStr = addDaysISO(today, i);
    dayMap.set(dateStr, {
      date: dateStr,
      label: relativeDayLabel(dateStr, today),
      tasks: [],
      sessionSlots: 0,
    });
  }

  const dueTasksSorted = [...withDue].sort((a, b) => {
    const aDue = a.task.dueDate ?? "";
    const bDue = b.task.dueDate ?? "";
    if (aDue !== bDue) return aDue.localeCompare(bDue);
    return b.score - a.score;
  });

  const scheduled = new Set<string>();

  for (const st of dueTasksSorted) {
    const effectiveDue = st.task.dueDate ?? projectMap.get(st.task.projectId)?.dueDate;
    if (!effectiveDue) continue;

    let placed = false;
    const dueDiff = diffCalendarDays(effectiveDue, today);

    if (dueDiff < 0) {
      const todayPlan = dayMap.get(today);
      if (todayPlan) {
        todayPlan.tasks.push(st);
        todayPlan.sessionSlots++;
        scheduled.add(st.task.id);
        placed = true;
      }
    } else {
      for (let d = Math.min(dueDiff, planDays - 1); d >= 0; d--) {
        const dateStr = addDaysISO(today, d);
        const day = dayMap.get(dateStr);
        if (day && day.sessionSlots < dailyGoal) {
          day.tasks.push(st);
          day.sessionSlots++;
          scheduled.add(st.task.id);
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      st.atRisk = true;
    }
  }

  for (const st of withoutDue) {
    for (const [, day] of dayMap) {
      if (day.sessionSlots < dailyGoal) {
        day.tasks.push(st);
        day.sessionSlots++;
        scheduled.add(st.task.id);
        break;
      }
    }
  }

  // Highest urgency first within each day
  for (const day of dayMap.values()) {
    day.tasks.sort((a, b) => b.score - a.score);
  }

  const unscheduled = scored.filter((s) => !scheduled.has(s.task.id));

  const days = Array.from(dayMap.values()).filter((d, i) => d.tasks.length > 0 || i < 2);

  const todayPlan = dayMap.get(today);
  const recommended =
    todayPlan?.tasks[0] ??
    scored.find((s) => s.overdue) ??
    scored[0] ??
    null;

  const overdueCount = scored.filter((s) => s.overdue).length;
  const atRiskCount = scored.filter((s) => s.atRisk).length;
  const daysNeeded = Math.ceil(activeTasks.length / dailyGoal);

  return {
    days,
    unscheduled,
    recommended,
    summary: {
      totalTasks: activeTasks.length,
      atRiskCount,
      overdueCount,
      daysNeeded,
      todayCount: todayPlan?.tasks.length ?? 0,
    },
  };
}
