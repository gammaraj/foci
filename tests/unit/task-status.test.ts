import { describe, expect, it } from "vitest";
import { getBucketSwimlaneId } from "@/components/task-list/bucket-order";
import { getTaskListSection, isActionableOverdue } from "@/lib/task-status";
import type { Task } from "@/lib/types";

function task(partial: Partial<Task> & Pick<Task, "id">): Task {
  return {
    title: partial.id,
    completed: false,
    sessions: 0,
    timeSpent: 0,
    createdAt: 1,
    projectId: "p1",
    ...partial,
  };
}

describe("task-status", () => {
  it("treats blocked dated tasks as blocked, not overdue", () => {
    const t = task({ id: "a", dueDate: "2020-01-01", blocked: true });
    expect(getTaskListSection(t)).toBe("blocked");
    expect(getBucketSwimlaneId(t)).toBe("blocked");
    expect(isActionableOverdue(t)).toBe(false);
  });

  it("routes someday tasks to someday swimlane", () => {
    const t = task({ id: "b", someday: true });
    expect(getTaskListSection(t)).toBe("someday");
    expect(getBucketSwimlaneId(t)).toBe("someday");
  });

  it("counts only actionable tasks as overdue", () => {
    const overdue = task({ id: "c", dueDate: "2020-01-01" });
    expect(isActionableOverdue(overdue)).toBe(true);
  });
});
