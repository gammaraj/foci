import { describe, expect, it } from "vitest";
import { applyBucketDrop, moveBucketTaskInLane } from "@/components/task-list/bucket-order";
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
});
