import type { Task, Project, Settings } from "./types";
import { formatDateLocal, getToday } from "./dates";

// ── Types ────────────────────────────────────────────────

export interface ScoredTask {
  task: Task;
  projectName: string;
  projectColor?: string;
  score: number;          // higher = more urgent
  daysUntilDue: number | null;
  atRisk: boolean;        // not enough days to finish before deadline
  overdue: boolean;
}

export interface DayPlan {
  date: string;           // YYYY-MM-DD
  label: string;          // "Today", "Tomorrow", "Wed Mar 25", etc.
  tasks: ScoredTask[];
  sessionSlots: number;   // how many sessions planned this day
}

export interface SmartPlanResult {
  days: DayPlan[];
  unscheduled: ScoredTask[];  // tasks with no due date, shown after scheduled
  summary: {
    totalTasks: number;
    atRiskCount: number;
    overdueCount: number;
    daysNeeded: number;
  };
}

// ── Helpers ──────────────────────────────────────────────

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function diffDays(a: string, b: string): number {
  const msA = new Date(a + "T00:00:00").getTime();
  const msB = new Date(b + "T00:00:00").getTime();
  return Math.round((msA - msB) / 86_400_000);
}

function dayLabel(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  const diff = diffDays(dateStr, today);
  if (diff === 1) return "Tomorrow";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ── Scoring ──────────────────────────────────────────────

function scoreTask(
  task: Task,
  project: Project | undefined,
  today: string,
): ScoredTask {
  const projectName = project?.name ?? "General";
  const projectColor = project?.color;

  // Determine the effective due date (task due date takes priority, then project)
  const effectiveDue = task.dueDate ?? project?.dueDate;
  const daysUntilDue = effectiveDue ? diffDays(effectiveDue, today) : null;
  const overdue = daysUntilDue !== null && daysUntilDue < 0;

  // Score components (higher = more urgent)
  let score = 0;

  // 1. Due date urgency (0-100 pts)
  if (daysUntilDue !== null) {
    if (overdue) {
      score += 100 + Math.abs(daysUntilDue) * 5; // overdue gets highest priority
    } else if (daysUntilDue === 0) {
      score += 95; // due today
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

  // 2. Task already has work invested (5-15 pts) — momentum bonus
  if (task.sessions > 0) {
    score += Math.min(15, 5 + task.sessions * 2);
  }

  // 3. Subtask completion ratio — nearly done tasks get a bump (0-10 pts)
  if (task.subtasks && task.subtasks.length > 0) {
    const done = task.subtasks.filter((s) => s.completed).length;
    const ratio = done / task.subtasks.length;
    if (ratio > 0 && ratio < 1) {
      score += Math.round(ratio * 10);
    }
  }

  // At risk: has a due date but likely won't finish in time
  // (we estimate 1 session per task as minimum)
  const atRisk = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 0;

  return { task, projectName, projectColor, score, daysUntilDue, atRisk, overdue };
}

// ── Plan Generation ──────────────────────────────────────

export function generateSmartPlan(
  tasks: Task[],
  projects: Project[],
  settings: Settings,
  planDays: number = 14,
): SmartPlanResult {
  const today = getToday();
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Filter to incomplete, non-archived, actionable tasks
  const activeTasks = tasks.filter((t) => !t.completed && !t.archivedAt && !t.blocked && !t.someday);

  // Score all tasks
  const scored = activeTasks
    .map((t) => scoreTask(t, projectMap.get(t.projectId), today))
    .sort((a, b) => b.score - a.score);

  const dailyGoal = settings.dailyGoal || 3;

  // Separate: tasks with due dates vs without
  const withDue = scored.filter((s) => s.daysUntilDue !== null);
  const withoutDue = scored.filter((s) => s.daysUntilDue === null);

  // Build day slots
  const dayMap = new Map<string, DayPlan>();
  for (let i = 0; i < planDays; i++) {
    const d = addDays(new Date(), i);
    const dateStr = formatDateLocal(d);
    dayMap.set(dateStr, {
      date: dateStr,
      label: dayLabel(dateStr, today),
      tasks: [],
      sessionSlots: 0,
    });
  }

  // Schedule tasks with due dates — place them as late as possible but before deadline
  // Sort by due date ascending (earliest deadline first)
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

    // Find the latest available day on or before the due date
    let placed = false;
    const dueDiff = diffDays(effectiveDue, today);

    // For overdue tasks, place on today
    if (dueDiff < 0) {
      const todayPlan = dayMap.get(today);
      if (todayPlan) {
        todayPlan.tasks.push(st);
        todayPlan.sessionSlots++;
        scheduled.add(st.task.id);
        placed = true;
      }
    } else {
      // Try to place on the due date or earlier if that day is full
      for (let d = Math.min(dueDiff, planDays - 1); d >= 0; d--) {
        const dateStr = formatDateLocal(addDays(new Date(), d));
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

    // Mark at-risk if couldn't be placed before deadline
    if (!placed) {
      st.atRisk = true;
    }
  }

  // Fill remaining slots with non-due-date tasks (by score)
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

  // Collect unscheduled
  const unscheduled = scored.filter((s) => !scheduled.has(s.task.id));

  // Build result — only include days that have tasks or are today/tomorrow
  const days = Array.from(dayMap.values()).filter(
    (d, i) => d.tasks.length > 0 || i < 2
  );

  const overdueCount = scored.filter((s) => s.overdue).length;
  const atRiskCount = scored.filter((s) => s.atRisk).length;

  // How many work days needed to clear all tasks
  const daysNeeded = Math.ceil(activeTasks.length / dailyGoal);

  return {
    days,
    unscheduled,
    summary: {
      totalTasks: activeTasks.length,
      atRiskCount,
      overdueCount,
      daysNeeded,
    },
  };
}
