import { describe, expect, it } from "vitest";
import {
  applyBucketDrop,
  moveBucketTaskInLane,
  nextOrderForNewTask,
  sortBucketTasks,
  sortCardTasks,
  tasksInSwimlane,
} from "@/components/task-list/bucket-order";
import type { Task } from "@/lib/types";

function task(
  id: string,
  projectId: string,
  opts: Partial<Task> = {}
): Task {
  return {
    id,
    title: id,
    projectId,
    completed: false,
    sessions: 0,
    timeSpent: 0,
    createdAt: 1,
    ...opts,
  };
}

describe("applyBucketDrop", () => {
  const tasks = [
    task("a", "p1", { order: 0 }),
    task("b", "p1", { order: 1 }),
    task("c", "p2", { order: 0 }),
  ];

  it("reorders within the same swimlane in one project", () => {
    const result = applyBucketDrop(
      tasks,
      "b",
      { type: "task", projectId: "p1", taskId: "a", swimlaneId: "undated" },
      null
    );
    expect(result).not.toBeNull();
    const ordered = result!
      .filter((t) => t.projectId === "p1")
      .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
      .map((t) => t.id);
    expect(ordered).toEqual(["b", "a"]);
  });

  it("moves a task to another project", () => {
    const result = applyBucketDrop(
      tasks,
      "a",
      { type: "column", projectId: "p2", swimlaneId: "undated" },
      null
    );
    expect(result).not.toBeNull();
    expect(result!.find((t) => t.id === "a")?.projectId).toBe("p2");
  });

  it("moves a task up within its swimlane", () => {
    const result = moveBucketTaskInLane(tasks, "b", "up", null);
    expect(result).not.toBeNull();
    const ordered = result!
      .filter((t) => t.projectId === "p1")
      .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
      .map((t) => t.id);
    expect(ordered).toEqual(["b", "a"]);
  });

  it("rejects cross-swimlane reorder in the same project", () => {
    const dated = [
      task("x", "p1", { dueDate: "2099-01-01", order: 0 }),
      task("y", "p1", { order: 0 }),
    ];
    const result = applyBucketDrop(
      dated,
      "y",
      { type: "task", projectId: "p1", taskId: "x", swimlaneId: "dated" },
      null
    );
    expect(result).toBeNull();
  });

  it("reorders overdue tasks with different due dates", () => {
    const overdue = [
      task("older", "p1", { dueDate: "2020-01-01", order: 0 }),
      task("newer", "p1", { dueDate: "2020-01-05", order: 1 }),
    ];
    const result = applyBucketDrop(
      overdue,
      "newer",
      { type: "task", projectId: "p1", taskId: "older", swimlaneId: "overdue" },
      null
    );
    expect(result).not.toBeNull();
    const laneOrder = tasksInSwimlane(result!, "overdue", null).map((t) => t.id);
    expect(laneOrder).toEqual(["newer", "older"]);
  });

  it("moves a task down within its swimlane", () => {
    const result = applyBucketDrop(
      tasks,
      "a",
      { type: "task", projectId: "p1", taskId: "b", swimlaneId: "undated" },
      null
    );
    expect(result).not.toBeNull();
    const ordered = result!
      .filter((t) => t.projectId === "p1")
      .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
      .map((t) => t.id);
    expect(ordered).toEqual(["b", "a"]);
  });
});

describe("sortBucketTasks", () => {
  it("respects manual order over due dates", () => {
    const tasks = [
      task("a", "p1", { dueDate: "2020-01-01", order: 1 }),
      task("b", "p1", { dueDate: "2020-01-10", order: 0 }),
    ];
    expect(sortBucketTasks(tasks, null).map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("sortCardTasks", () => {
  it("puts unordered new tasks after manually ordered ones", () => {
    const tasks = [
      task("admin", "me", { order: 0, createdAt: 1 }),
      task("gelato", "me", { order: 1, createdAt: 2 }),
      task("test", "me", { createdAt: 99 }),
    ];
    expect(sortCardTasks(tasks, null).map((t) => t.id)).toEqual([
      "admin",
      "gelato",
      "test",
    ]);
  });

  it("pins only when a synced pin id is passed", () => {
    const tasks = [
      task("admin", "me", { order: 0 }),
      task("gelato", "me", { order: 1 }),
      task("test", "me", { order: 2 }),
    ];
    expect(sortCardTasks(tasks, null).slice(0, 2).map((t) => t.id)).toEqual([
      "admin",
      "gelato",
    ]);
    expect(sortCardTasks(tasks, "test").map((t) => t.id)[0]).toBe("test");
  });
});

describe("nextOrderForNewTask", () => {
  it("returns undefined when the project has no manual order", () => {
    expect(nextOrderForNewTask([task("a", "me")], "me")).toBeUndefined();
  });

  it("scopes to the project and places the new task above existing order", () => {
    const tasks = [
      task("a", "me", { order: 2 }),
      task("b", "me", { order: 5 }),
      task("c", "other", { order: 0 }),
    ];
    expect(nextOrderForNewTask(tasks, "me")).toBe(1);
  });

  it("ignores completed and archived tasks", () => {
    const tasks = [
      task("done", "me", { order: 0, completed: true }),
      task("open", "me", { order: 3 }),
      task("archived", "me", { order: -10, archivedAt: 1 }),
    ];
    expect(nextOrderForNewTask(tasks, "me")).toBe(2);
  });
});
