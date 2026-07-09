import { describe, it, expect } from "vitest";
import {
  formatDuration,
  getNextDueDate,
  isDueDateOverdue,
  sortProjectsForDisplay,
  reorderProjects,
  getProjectsDragPreview,
  moveProjectInDisplayOrder,
} from "@/components/task-list/utils";
import type { Project } from "@/lib/types";

describe("task-list utils", () => {
  it("formatDuration shows hours and minutes", () => {
    expect(formatDuration(45 * 60_000)).toBe("45m");
    expect(formatDuration(90 * 60_000)).toBe("1h 30m");
    expect(formatDuration(120 * 60_000)).toBe("2h");
  });

  it("getNextDueDate advances recurrence", () => {
    expect(getNextDueDate("2026-05-19", "daily")).toBe("2026-05-20");
    expect(getNextDueDate("2026-05-19", "weekly")).toBe("2026-05-26");
  });

  it("isDueDateOverdue compares against today", () => {
    expect(isDueDateOverdue("2000-01-01")).toBe(true);
    expect(isDueDateOverdue("2099-12-31")).toBe(false);
  });

  it("sortProjectsForDisplay puts favorites first, then order, then name", () => {
    const projects: Project[] = [
      { id: "b", name: "Beta", createdAt: 1, order: 1 },
      { id: "a", name: "Alpha", createdAt: 2, favorite: true, order: 2 },
      { id: "c", name: "Charlie", createdAt: 3, order: 0 },
    ];
    expect(sortProjectsForDisplay(projects).map((p) => p.id)).toEqual(["a", "c", "b"]);
  });

  it("reorderProjects moves a project and reassigns order", () => {
    const projects: Project[] = [
      { id: "a", name: "A", createdAt: 1, order: 0, favorite: true },
      { id: "b", name: "B", createdAt: 2, order: 1, favorite: true },
      { id: "c", name: "C", createdAt: 3, order: 2 },
    ];
    const updated = reorderProjects(projects, "c", "a");
    expect(updated).not.toBeNull();
    expect(sortProjectsForDisplay(updated!).map((p) => p.id)).toEqual(["c", "a", "b"]);
    expect(updated!.find((p) => p.id === "c")?.favorite).toBe(true);
    expect(updated!.find((p) => p.id === "c")?.order).toBe(0);
  });

  it("getProjectsDragPreview shifts cards before drop", () => {
    const projects: Project[] = [
      { id: "a", name: "A", createdAt: 1, order: 0 },
      { id: "b", name: "B", createdAt: 2, order: 1 },
      { id: "c", name: "C", createdAt: 3, order: 2 },
      { id: "d", name: "D", createdAt: 4, order: 3 },
    ];
    expect(getProjectsDragPreview(projects, "a", "c").map((p) => p.id)).toEqual(["b", "c", "a", "d"]);
    expect(getProjectsDragPreview(projects, null, "c").map((p) => p.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("moveProjectInDisplayOrder shifts a project by one step", () => {
    const projects: Project[] = [
      { id: "a", name: "A", createdAt: 1, order: 0 },
      { id: "b", name: "B", createdAt: 2, order: 1 },
      { id: "c", name: "C", createdAt: 3, order: 2 },
    ];
    const updated = moveProjectInDisplayOrder(projects, "b", "down");
    expect(sortProjectsForDisplay(updated!).map((p) => p.id)).toEqual(["a", "c", "b"]);
  });
});
