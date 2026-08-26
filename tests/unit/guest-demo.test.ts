import { describe, it, expect } from "vitest";
import type { Task } from "@/lib/types";
import { DEFAULT_PROJECT, DEFAULT_PROJECT_ID } from "@/lib/types";
import {
  createGuestDemoWorkspace,
  emptyGuestWorkspace,
  extraGuestDemoTasks,
  GUEST_DEMO_GROCERY_ID,
  GUEST_DEMO_PLACES_ID,
  guestDemoMissingExtraProjects,
  guestHasCustomProjects,
  isGuestGeneralDemo,
  isGuestSampleWorkspace,
  isSparseGuestDemo,
  mergeGuestDemoProjects,
  pickGuestDemoExpandedSubtasksTask,
  pickGuestDemoOneThingTask,
  spreadGuestDemoFeatures,
  upgradePlacesToBucketList,
} from "@/lib/guest-demo";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Review project requirements",
    completed: false,
    sessions: 0,
    timeSpent: 0,
    createdAt: 1,
    projectId: DEFAULT_PROJECT_ID,
    ...overrides,
  };
}

describe("guest demo", () => {
  it("detects the original 3-task seed", () => {
    const tasks = [
      makeTask({ id: "a", title: "Review project requirements" }),
      makeTask({ id: "b", title: "Draft design mockups" }),
      makeTask({ id: "c", title: "Write unit tests" }),
    ];
    expect(isSparseGuestDemo(tasks)).toBe(true);
    expect(isGuestGeneralDemo(tasks)).toBe(true);
  });

  it("does not treat edited or completed samples as the old seed", () => {
    const tasks = [
      makeTask({ id: "a", title: "Review project requirements", dueDate: "2026-04-01" }),
      makeTask({ id: "b", title: "Draft design mockups" }),
      makeTask({ id: "c", title: "Write unit tests" }),
    ];
    expect(isSparseGuestDemo(tasks)).toBe(false);
    expect(isGuestGeneralDemo(tasks)).toBe(true);
    expect(
      isSparseGuestDemo([
        makeTask({ id: "a", title: "My real task" }),
        makeTask({ id: "b", title: "Draft design mockups" }),
        makeTask({ id: "c", title: "Write unit tests" }),
      ]),
    ).toBe(false);
    expect(
      isGuestGeneralDemo([
        makeTask({ id: "a", title: "My real task" }),
        makeTask({ id: "b", title: "Draft design mockups" }),
        makeTask({ id: "c", title: "Write unit tests" }),
      ]),
    ).toBe(false);
  });

  it("creates three project cards with done, late, due today, and One Thing", () => {
    const now = new Date("2026-04-10T15:00:00").getTime();
    const { tasks, projects, oneThing, expandedSubtasksTaskId } = createGuestDemoWorkspace(now);
    expect(projects.map((p) => p.name)).toEqual(["General", "Grocery list", "Bucket list"]);
    expect(tasks.filter((t) => t.projectId === DEFAULT_PROJECT_ID).length).toBe(4);
    expect(tasks.filter((t) => t.projectId === GUEST_DEMO_GROCERY_ID).length).toBe(3);
    expect(tasks.filter((t) => t.projectId === GUEST_DEMO_PLACES_ID).map((t) => t.title)).toEqual([
      "Visit Barcelona",
      "Sky dive",
      "See the Northern Lights",
    ]);
    expect(tasks.some((t) => t.completed && t.completedAt)).toBe(true);
    const milk = tasks.find((t) => t.title === "Milk and eggs");
    const snacks = tasks.find((t) => t.title === "Restock snacks");
    const review = tasks.find((t) => t.title === "Review project requirements");
    expect(milk?.dueDate).toBe("2026-04-09");
    expect(milk?.projectId).toBe(GUEST_DEMO_GROCERY_ID);
    expect(snacks?.priority).toBe(1);
    expect(review?.dueDate).toBeUndefined();
    expect(review?.priority).toBeUndefined();
    expect(review?.subtasks?.length ?? 0).toBe(0);
    expect(tasks.some((t) => t.dueDate === "2026-04-10")).toBe(true);
    expect(tasks.some((t) => t.recurrence === "weekly")).toBe(true);
    expect(oneThing.date).toBe("2026-04-10");
    const oneThingTask = tasks.find((t) => t.id === oneThing.taskId);
    expect(oneThingTask?.title).toBe("Draft design mockups");
    expect(oneThingTask?.subtasks?.length ?? 0).toBe(0);
    expect(oneThingTask?.completed).toBe(false);
    const expanded = tasks.find((t) => t.id === expandedSubtasksTaskId);
    expect(expanded?.title).toBe("Visit Barcelona");
    expect(expanded?.projectId).toBe(GUEST_DEMO_PLACES_ID);
    expect(expanded?.subtasks?.length).toBe(2);
    expect(pickGuestDemoOneThingTask(tasks)?.id).toBe(oneThing.taskId);
    expect(pickGuestDemoExpandedSubtasksTask(tasks)?.id).toBe(expandedSubtasksTaskId);
  });

  it("merges extra demo projects onto a General-only workspace", () => {
    const demo = createGuestDemoWorkspace();
    const extra = extraGuestDemoTasks(demo);
    expect(extra.every((t) => t.projectId !== DEFAULT_PROJECT_ID)).toBe(true);
    expect(guestDemoMissingExtraProjects([DEFAULT_PROJECT])).toBe(true);
    expect(guestHasCustomProjects([DEFAULT_PROJECT])).toBe(false);
    const merged = mergeGuestDemoProjects([DEFAULT_PROJECT], demo.projects);
    expect(merged.map((p) => p.id)).toEqual([
      DEFAULT_PROJECT_ID,
      GUEST_DEMO_GROCERY_ID,
      GUEST_DEMO_PLACES_ID,
    ]);
    expect(mergeGuestDemoProjects(merged, demo.projects)).toEqual(merged);
  });

  it("treats the seeded 3-project workspace as samples until a custom project exists", () => {
    const demo = createGuestDemoWorkspace();
    expect(isGuestSampleWorkspace(demo.tasks, demo.projects)).toBe(true);
    expect(
      isGuestSampleWorkspace(demo.tasks, [
        DEFAULT_PROJECT,
        { id: "work", name: "Work", createdAt: 1 },
      ]),
    ).toBe(false);
    expect(emptyGuestWorkspace().projects.map((p) => p.id)).toEqual([DEFAULT_PROJECT_ID]);
    expect(emptyGuestWorkspace().tasks).toEqual([]);
  });

  it("upgrades Places to visit into a Bucket list", () => {
    const now = 1_000_000;
    const projects = [
      DEFAULT_PROJECT,
      { id: GUEST_DEMO_PLACES_ID, name: "Places to visit", createdAt: 1 },
    ];
    const tasks = [
      makeTask({ id: "a", title: "Kyoto in spring", projectId: GUEST_DEMO_PLACES_ID }),
      makeTask({ id: "b", title: "Day hike nearby", projectId: GUEST_DEMO_PLACES_ID }),
      makeTask({ id: "c", title: "Weekend farmers market", projectId: GUEST_DEMO_PLACES_ID }),
    ];
    const upgraded = upgradePlacesToBucketList(tasks, projects, now);
    expect(upgraded?.projects.find((p) => p.id === GUEST_DEMO_PLACES_ID)?.name).toBe("Bucket list");
    expect(upgraded?.tasks.map((t) => t.title)).toEqual([
      "Visit Barcelona",
      "Sky dive",
      "See the Northern Lights",
    ]);
    expect(upgradePlacesToBucketList(upgraded!.tasks, upgraded!.projects, now)).toBeNull();
  });

  it("spreads bundled General features onto Grocery and Bucket", () => {
    const now = new Date("2026-04-10T15:00:00").getTime();
    const bundled = [
      makeTask({
        id: "review",
        title: "Review project requirements",
        dueDate: "2026-04-09",
        priority: 1,
        subtasks: [
          { id: "s1", title: "Skim the brief", completed: true },
          { id: "s2", title: "List open questions", completed: false },
        ],
      }),
      makeTask({ id: "milk", title: "Milk and eggs", projectId: GUEST_DEMO_GROCERY_ID }),
      makeTask({ id: "snacks", title: "Restock snacks", projectId: GUEST_DEMO_GROCERY_ID }),
      makeTask({ id: "bcn", title: "Visit Barcelona", projectId: GUEST_DEMO_PLACES_ID }),
    ];
    const spread = spreadGuestDemoFeatures(bundled, now);
    expect(spread).not.toBeNull();
    expect(spread!.find((t) => t.id === "review")?.dueDate).toBeUndefined();
    expect(spread!.find((t) => t.id === "review")?.subtasks).toBeUndefined();
    expect(spread!.find((t) => t.id === "milk")?.dueDate).toBe("2026-04-09");
    expect(spread!.find((t) => t.id === "snacks")?.priority).toBe(1);
    expect(spread!.find((t) => t.id === "bcn")?.subtasks?.length).toBe(2);
    expect(spreadGuestDemoFeatures(createGuestDemoWorkspace(now).tasks, now)).toBeNull();
  });
});
