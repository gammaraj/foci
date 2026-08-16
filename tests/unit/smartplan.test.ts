import { describe, it, expect } from "vitest";
import { generateSmartPlan } from "@/lib/smartplan";
import type { Task, Project, Settings } from "@/lib/types";
import { DEFAULT_SETTINGS, DEFAULT_PROJECT_ID } from "@/lib/types";
import { getToday } from "@/lib/dates";

const settings: Settings = { ...DEFAULT_SETTINGS, dailyGoal: 2 };
const projects: Project[] = [{ id: DEFAULT_PROJECT_ID, name: "General", createdAt: Date.now() }];

function task(overrides: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return {
    completed: false,
    sessions: 0,
    timeSpent: 0,
    createdAt: Date.now(),
    projectId: DEFAULT_PROJECT_ID,
    subtasks: [],
    ...overrides,
  };
}

describe("generateSmartPlan", () => {
  it("schedules overdue tasks on today", () => {
    const today = getToday();
    const yesterday = new Date(today + "T12:00:00");
    yesterday.setDate(yesterday.getDate() - 1);

    const tasks = [
      task({ id: "1", title: "Overdue", dueDate: `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}` }),
    ];

    const plan = generateSmartPlan(tasks, projects, settings, 7);
    const todayPlan = plan.days.find((d) => d.date === today);
    expect(todayPlan?.tasks.some((s) => s.task.id === "1")).toBe(true);
    expect(plan.summary.overdueCount).toBe(1);
  });

  it("excludes completed and archived tasks", () => {
    const tasks = [
      task({ id: "1", title: "Active" }),
      task({ id: "2", title: "Done", completed: true }),
      task({ id: "3", title: "Archived", archivedAt: Date.now() }),
    ];

    const plan = generateSmartPlan(tasks, projects, settings);
    expect(plan.summary.totalTasks).toBe(1);
  });

  it("sorts higher urgency tasks first within a day", () => {
    const today = getToday();
    const tasks = [
      task({ id: "low", title: "Later", dueDate: today, sessions: 0 }),
      task({ id: "high", title: "Due today", dueDate: today, sessions: 5 }),
    ];

    const plan = generateSmartPlan(tasks, projects, settings);
    const todayPlan = plan.days.find((d) => d.date === today);
    expect(todayPlan?.tasks[0]?.task.id).toBe("high");
  });

  it("recommends today's top planned task as One Thing candidate", () => {
    const today = getToday();
    const tasks = [
      task({ id: "a", title: "A", dueDate: today, sessions: 0 }),
      task({ id: "b", title: "B", dueDate: today, sessions: 3 }),
    ];
    const plan = generateSmartPlan(tasks, projects, settings);
    expect(plan.recommended?.task.id).toBe("b");
    expect(plan.summary.todayCount).toBeGreaterThan(0);
  });

  it("marks due tasks at risk when they cannot fit before the deadline", () => {
    const today = getToday();
    // dailyGoal=2, three tasks all due today → only two session slots before deadline
    const tasks = [
      task({ id: "1", title: "One", dueDate: today }),
      task({ id: "2", title: "Two", dueDate: today }),
      task({ id: "3", title: "Three", dueDate: today }),
    ];
    const plan = generateSmartPlan(tasks, projects, settings, 7);
    expect(plan.summary.atRiskCount).toBe(1);
    expect(plan.unscheduled.some((s) => s.atRisk)).toBe(true);
  });
});
