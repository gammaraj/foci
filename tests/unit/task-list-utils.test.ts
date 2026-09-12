import { describe, it, expect } from "vitest";
import {
  formatDuration,
  formatDueChip,
  formatDueDate,
  getNextDueDate,
  isDueDateOverdue,
  sortProjectsForDisplay,
  reorderProjects,
  reorderSubtasks,
  getProjectsDragPreview,
  moveProjectInDisplayOrder,
  resolveProjectColor,
  filterTasksByQuery,
  normalizeProjectName,
  findProjectByName,
  mergeTargetCandidates,
} from "@/components/task-list/utils";
import { DEFAULT_PROJECT_ID, type Project, type Subtask, type Task } from "@/lib/types";
import { getToday, getTomorrow } from "@/lib/dates";

describe("task-list utils", () => {
  it("formatDuration shows hours and minutes", () => {
    expect(formatDuration(45 * 60_000)).toBe("45m");
    expect(formatDuration(90 * 60_000)).toBe("1h 30m");
    expect(formatDuration(120 * 60_000)).toBe("2h");
  });

  it("formatDueChip uses sentence case for today/tomorrow", () => {
    expect(formatDueChip(getToday())).toBe("Today");
    expect(formatDueChip(getTomorrow())).toBe("Tomorrow");
    expect(formatDueChip(getToday())).toBe(formatDueDate(getToday()));
    expect(formatDueChip("2020-01-15")).toBe(formatDueDate("2020-01-15"));
  });

  it("getNextDueDate advances recurrence", () => {
    expect(getNextDueDate("2026-05-19", "daily")).toBe("2026-05-20");
    expect(getNextDueDate("2026-05-19", "weekly")).toBe("2026-05-26");
  });

  it("isDueDateOverdue compares against today", () => {
    expect(isDueDateOverdue("2000-01-01")).toBe(true);
    expect(isDueDateOverdue("2099-12-31")).toBe(false);
  });

  it("resolveProjectColor uses saved color or stable fallback", () => {
    expect(resolveProjectColor({ id: "p1", color: "#ff0000" })).toBe("#ff0000");
    const a = resolveProjectColor({ id: "legacy-work" });
    const b = resolveProjectColor({ id: "legacy-work" });
    const c = resolveProjectColor({ id: "legacy-foci" });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
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

  it("reorderSubtasks moves a subtask by id", () => {
    const subtasks: Subtask[] = [
      { id: "a", title: "A", completed: false },
      { id: "b", title: "B", completed: true },
      { id: "c", title: "C", completed: false },
    ];
    expect(reorderSubtasks(subtasks, "c", "a")?.map((s) => s.id)).toEqual(["c", "a", "b"]);
    expect(reorderSubtasks(subtasks, "a", "a")).toBeNull();
    expect(reorderSubtasks(subtasks, "missing", "a")).toBeNull();
  });

  it("filterTasksByQuery matches title or project name", () => {
    const projects: Pick<Project, "id" | "name">[] = [
      { id: "p1", name: "Writing" },
      { id: "p2", name: "Home" },
    ];
    const tasks = [
      { id: "1", title: "Draft essay", projectId: "p1" },
      { id: "2", title: "Buy milk", projectId: "p2" },
    ] as Task[];
    expect(filterTasksByQuery(tasks, "", projects).map((t) => t.id)).toEqual(["1", "2"]);
    expect(filterTasksByQuery(tasks, "essay", projects).map((t) => t.id)).toEqual(["1"]);
    expect(filterTasksByQuery(tasks, "home", projects).map((t) => t.id)).toEqual(["2"]);
    expect(filterTasksByQuery(tasks, "xyz", projects)).toEqual([]);
  });

  it("normalizeProjectName ignores case and extra whitespace", () => {
    expect(normalizeProjectName("  Physics  ")).toBe("physics");
    expect(normalizeProjectName("PHYSICS\n")).toBe("physics");
    expect(normalizeProjectName("a   b")).toBe("a b");
  });

  it("findProjectByName matches duplicates ignoring case and whitespace", () => {
    const projects: Project[] = [
      { id: "d", name: "General", createdAt: 0 },
      { id: "p1", name: "PHYSICS", createdAt: 1 },
      { id: "p2", name: "Archive", createdAt: 2, archived: true },
    ];
    expect(findProjectByName(projects, " physics ")?.id).toBe("p1");
    expect(findProjectByName(projects, "Physics", "p1")).toBeUndefined();
    expect(findProjectByName(projects, "Archive")).toBeUndefined();
    expect(findProjectByName(projects, "   ")).toBeUndefined();
  });

  it("mergeTargetCandidates excludes the source and archived projects", () => {
    const projects: Project[] = [
      { id: DEFAULT_PROJECT_ID, name: "General", createdAt: 0 },
      { id: "p1", name: "PHYSICS", createdAt: 1 },
      { id: "p2", name: "PHYSICS", createdAt: 2 },
      { id: "p3", name: "Old", createdAt: 3, archived: true },
    ];
    const source = projects.find((p) => p.id === "p1")!;
    expect(mergeTargetCandidates(source, projects).map((p) => p.id)).toEqual([
      DEFAULT_PROJECT_ID,
      "p2",
    ]);
    // The default project cannot be merged away, so it has no candidates.
    const general = projects.find((p) => p.id === DEFAULT_PROJECT_ID)!;
    expect(mergeTargetCandidates(general, projects)).toEqual([]);
  });
});
