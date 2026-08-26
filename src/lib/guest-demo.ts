import type { Project, Task } from "./types";
import { DEFAULT_PROJECT, DEFAULT_PROJECT_ID, PROJECT_COLORS } from "./types";
import { formatDateLocal } from "./dates";
import { canBeOneThing, type OneThingPreference } from "./one-thing";

export const GUEST_DEMO_GROCERY_ID = "__demo_grocery__";
/** Stable id — originally Places to visit; now Bucket list. */
export const GUEST_DEMO_BUCKET_ID = "__demo_places__";
/** @deprecated Use GUEST_DEMO_BUCKET_ID */
export const GUEST_DEMO_PLACES_ID = GUEST_DEMO_BUCKET_ID;

const GUEST_DEMO_EXTRA_IDS = new Set([GUEST_DEMO_GROCERY_ID, GUEST_DEMO_BUCKET_ID]);

const LEGACY_GUEST_TITLES = new Set([
  "Review project requirements",
  "Draft design mockups",
  "Write unit tests",
]);

const GUEST_GENERAL_TITLES = new Set([...LEGACY_GUEST_TITLES, "Send kickoff notes"]);

function demoTask(
  projectId: string,
  title: string,
  now: number,
  extra: Partial<Task> = {},
): Task {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    sessions: 0,
    timeSpent: 0,
    createdAt: now,
    projectId,
    ...extra,
  };
}

/** Original 3-task guest seed with no dates, completions, or extras. */
export function isSparseGuestDemo(tasks: Task[]): boolean {
  if (tasks.length !== 3) return false;
  const titles = new Set(tasks.map((t) => t.title));
  if (titles.size !== 3) return false;
  for (const title of LEGACY_GUEST_TITLES) {
    if (!titles.has(title)) return false;
  }
  return tasks.every(
    (t) =>
      !t.completed &&
      t.completedAt == null &&
      !t.dueDate &&
      !t.recurrence &&
      t.priority == null &&
      !(t.subtasks && t.subtasks.length > 0) &&
      (t.projectId || DEFAULT_PROJECT_ID) === DEFAULT_PROJECT_ID,
  );
}

/** General-only demo (old 3-task or the later 4-task seed) — safe to add extra project cards. */
export function isGuestGeneralDemo(tasks: Task[]): boolean {
  if (tasks.length < 3 || tasks.length > 4) return false;
  if (!tasks.every((t) => (t.projectId || DEFAULT_PROJECT_ID) === DEFAULT_PROJECT_ID)) return false;
  return tasks.every((t) => GUEST_GENERAL_TITLES.has(t.title));
}

export function guestHasCustomProjects(projects: Project[]): boolean {
  return projects.some(
    (p) => p.id !== DEFAULT_PROJECT_ID && !GUEST_DEMO_EXTRA_IDS.has(p.id) && !p.archived,
  );
}

export function guestDemoMissingExtraProjects(projects: Project[]): boolean {
  const ids = new Set(projects.map((p) => p.id));
  return !ids.has(GUEST_DEMO_GROCERY_ID) || !ids.has(GUEST_DEMO_BUCKET_ID);
}

/** Guest workspace that surfaces done tally, late, One Thing, and 3 project cards. */
export function createGuestDemoWorkspace(now: number = Date.now()): {
  tasks: Task[];
  projects: Project[];
  oneThing: OneThingPreference;
  /** Leaf One Thing; subtasked sample starts expanded so visitors see the UI. */
  expandedSubtasksTaskId: string;
} {
  const today = formatDateLocal(new Date(now));
  const yesterday = formatDateLocal(new Date(now - 86_400_000));
  const mockupsId = crypto.randomUUID();

  const grocery: Project = {
    id: GUEST_DEMO_GROCERY_ID,
    name: "Grocery list",
    color: PROJECT_COLORS[1],
    createdAt: now - 2_000,
    order: 1,
  };
  const bucket: Project = {
    id: GUEST_DEMO_BUCKET_ID,
    name: "Bucket list",
    color: PROJECT_COLORS[2],
    createdAt: now - 1_000,
    order: 2,
  };

  const barcelonaId = crypto.randomUUID();

  const tasks: Task[] = [
    demoTask(DEFAULT_PROJECT_ID, "Review project requirements", now - 86_400_000),
    demoTask(DEFAULT_PROJECT_ID, "Draft design mockups", now - 3_600_000, {
      id: mockupsId,
      dueDate: today,
    }),
    demoTask(DEFAULT_PROJECT_ID, "Write unit tests", now, { recurrence: "weekly" }),
    demoTask(DEFAULT_PROJECT_ID, "Send kickoff notes", now - 4 * 3_600_000, {
      completed: true,
      completedAt: now - 2 * 3_600_000,
      sessions: 1,
      timeSpent: 25 * 60_000,
    }),
    demoTask(GUEST_DEMO_GROCERY_ID, "Milk and eggs", now - 1_800_000, { dueDate: yesterday }),
    demoTask(GUEST_DEMO_GROCERY_ID, "Coffee beans", now - 1_200_000),
    demoTask(GUEST_DEMO_GROCERY_ID, "Restock snacks", now - 600_000, { priority: 1 }),
    demoTask(GUEST_DEMO_BUCKET_ID, "Visit Barcelona", now - 900_000, {
      id: barcelonaId,
      subtasks: [
        { id: crypto.randomUUID(), title: "Pick a travel month", completed: true },
        { id: crypto.randomUUID(), title: "Shortlist neighborhoods", completed: false },
      ],
    }),
    demoTask(GUEST_DEMO_BUCKET_ID, "Sky dive", now - 500_000),
    demoTask(GUEST_DEMO_BUCKET_ID, "See the Northern Lights", now - 200_000),
  ];

  return {
    tasks,
    projects: [{ ...DEFAULT_PROJECT, order: 0 }, grocery, bucket],
    oneThing: { taskId: mockupsId, date: today },
    expandedSubtasksTaskId: barcelonaId,
  };
}

/** Prefer a dated General task with no subtasks as the guest One Thing. */
export function pickGuestDemoOneThingTask(tasks: Task[]): Task | null {
  const openLeaf = tasks.filter((t) => canBeOneThing(t) && !(t.subtasks && t.subtasks.length > 0));
  return (
    openLeaf.find((t) => t.title === "Draft design mockups") ??
    openLeaf.find((t) => t.projectId === DEFAULT_PROJECT_ID) ??
    openLeaf[0] ??
    null
  );
}

/** Sample task that should start expanded so visitors see subtasks. */
export function pickGuestDemoExpandedSubtasksTask(tasks: Task[]): Task | null {
  const titled = tasks.find((t) => t.title === "Visit Barcelona" && (t.subtasks?.length ?? 0) > 0);
  if (titled && !titled.completed && !titled.archivedAt) return titled;
  return (
    tasks.find((t) => !t.completed && !t.archivedAt && (t.subtasks?.length ?? 0) > 0) ?? null
  );
}

const DEMO_REVIEW_SUB_TITLES = new Set(["Skim the brief", "List open questions"]);

function hasDemoReviewSubtasks(task: Task): boolean {
  const subs = task.subtasks ?? [];
  return subs.length > 0 && subs.every((s) => DEMO_REVIEW_SUB_TITLES.has(s.title));
}

/**
 * Move overdue / HIGH / expanded subtasks off General onto Grocery and Bucket.
 * Returns null when the sample already has that spread.
 */
export function spreadGuestDemoFeatures(tasks: Task[], now: number = Date.now()): Task[] | null {
  const review = tasks.find((t) => t.title === "Review project requirements");
  const milk = tasks.find((t) => t.title === "Milk and eggs");
  const snacks = tasks.find((t) => t.title === "Restock snacks");
  const barcelona = tasks.find((t) => t.title === "Visit Barcelona");
  if (!review && !milk && !snacks && !barcelona) return null;

  const yesterday = formatDateLocal(new Date(now - 86_400_000));
  const reviewBundled =
    !!review &&
    (hasDemoReviewSubtasks(review) || !!review.dueDate || review.priority != null);
  const milkNeedsDue = !!milk && !milk.dueDate;
  const snacksNeedPriority = !!snacks && snacks.priority == null;
  const barcelonaNeedsSubs = !!barcelona && !(barcelona.subtasks && barcelona.subtasks.length > 0);

  if (!reviewBundled && !milkNeedsDue && !snacksNeedPriority && !barcelonaNeedsSubs) return null;

  return tasks.map((t) => {
    if (reviewBundled && t.id === review!.id) {
      return { ...t, dueDate: undefined, priority: undefined, subtasks: undefined };
    }
    if (milkNeedsDue && t.id === milk!.id) {
      return { ...t, dueDate: yesterday };
    }
    if (snacksNeedPriority && t.id === snacks!.id) {
      return { ...t, priority: 1 };
    }
    if (barcelonaNeedsSubs && t.id === barcelona!.id) {
      return {
        ...t,
        subtasks: [
          { id: crypto.randomUUID(), title: "Pick a travel month", completed: true },
          { id: crypto.randomUUID(), title: "Shortlist neighborhoods", completed: false },
        ],
      };
    }
    return t;
  });
}

export function extraGuestDemoTasks(demo: { tasks: Task[] }): Task[] {
  return demo.tasks.filter((t) => t.projectId !== DEFAULT_PROJECT_ID);
}

const OLD_PLACES_TITLES = new Set([
  "Kyoto in spring",
  "Day hike nearby",
  "Weekend farmers market",
]);

const BUCKET_LIST_TITLES = ["Visit Barcelona", "Sky dive", "See the Northern Lights"];

/** Rename the old Places to visit sample and swap its stock tasks for a bucket list. */
export function upgradePlacesToBucketList(
  tasks: Task[],
  projects: Project[],
  now: number = Date.now(),
): { tasks: Task[]; projects: Project[] } | null {
  const places = projects.find(
    (p) => p.id === GUEST_DEMO_BUCKET_ID || p.name === "Places to visit",
  );
  if (!places) return null;

  const hasOldTasks = tasks.some((t) => t.projectId === places.id && OLD_PLACES_TITLES.has(t.title));
  const alreadyNamed = places.name === "Bucket list";
  if (alreadyNamed && !hasOldTasks) return null;

  const projectsNext = projects.map((p) =>
    p.id === places.id ? { ...p, name: "Bucket list" } : p,
  );

  let tasksNext = tasks;
  if (hasOldTasks) {
    const kept = tasks.filter((t) => !(t.projectId === places.id && OLD_PLACES_TITLES.has(t.title)));
    const remainingOnProject = kept.filter((t) => t.projectId === places.id);
    const extras =
      remainingOnProject.length === 0
        ? BUCKET_LIST_TITLES.map((title, i) =>
            demoTask(places.id, title, now - (3 - i) * 100_000),
          )
        : [];
    tasksNext = [...kept, ...extras];
  }

  return { tasks: tasksNext, projects: projectsNext };
}

export function mergeGuestDemoProjects(existing: Project[], demoProjects: Project[]): Project[] {
  const ids = new Set(existing.map((p) => p.id));
  const extras = demoProjects.filter((p) => p.id !== DEFAULT_PROJECT_ID && !ids.has(p.id));
  if (extras.length === 0) return existing;
  const withGeneral = existing.some((p) => p.id === DEFAULT_PROJECT_ID)
    ? existing
    : [DEFAULT_PROJECT, ...existing];
  return [...withGeneral, ...extras];
}

export const GUEST_DEMO_CLEARED_KEY = "foci_guest_demo_cleared";
export const GUEST_SAMPLE_BANNER_DISMISSED_KEY = "foci_guest_sample_banner_dismissed";
export const CLEAR_GUEST_DEMO_EVENT = "foci-clear-guest-demo";

export function hasClearedGuestDemo(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(GUEST_DEMO_CLEARED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGuestDemoCleared(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_DEMO_CLEARED_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasDismissedGuestSampleBanner(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(GUEST_SAMPLE_BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGuestSampleBannerDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_SAMPLE_BANNER_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** True when the workspace is still the seeded demo (not a guest's own projects). */
export function isGuestSampleWorkspace(tasks: Task[], projects: Project[]): boolean {
  if (hasClearedGuestDemo()) return false;
  if (guestHasCustomProjects(projects)) return false;
  if (projects.some((p) => GUEST_DEMO_EXTRA_IDS.has(p.id))) return true;
  return isGuestGeneralDemo(tasks) || isSparseGuestDemo(tasks);
}

export function emptyGuestWorkspace(): { tasks: Task[]; projects: Project[] } {
  return { tasks: [], projects: [{ ...DEFAULT_PROJECT, order: 0 }] };
}
