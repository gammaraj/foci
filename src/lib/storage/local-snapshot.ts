/**
 * Synchronous localStorage snapshot for instant PWA / slow-network paint.
 * Prefer signed-in offline cache (foci_cache_*), then guest keys.
 */

import type { OneThingPreference } from "../one-thing";
import { parseOneThingPreference } from "../one-thing";
import type { TaskViewPreferences } from "../task-view-preference";
import {
  DEFAULT_TASK_VIEW_PREFERENCES,
  isDefaultTaskView,
} from "../task-view-preference";
import { DEFAULT_PROJECT, type Project, type Task } from "../types";

const CACHE_TASKS = "foci_cache_tasks";
const CACHE_PROJECTS = "foci_cache_projects";
const CACHE_VIEW_PREFS = "foci_cache_task_view_prefs";
const CACHE_ONE_THING = "foci_cache_one_thing";

export type LocalWorkspaceSnapshot = {
  tasks: Task[];
  projects: Project[];
  taskViewPrefs: TaskViewPreferences;
  oneThing: OneThingPreference | null;
  source: "cache" | "guest";
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeProjects(projects: Project[] | null | undefined): Project[] {
  if (Array.isArray(projects) && projects.length > 0) return projects;
  return [DEFAULT_PROJECT];
}

function normalizeTasks(tasks: Task[] | null | undefined): Task[] {
  if (!Array.isArray(tasks)) return [];
  return tasks.map((t) => ({
    ...t,
    projectId: t.projectId || DEFAULT_PROJECT.id,
  }));
}

function readViewPrefs(key: string): TaskViewPreferences {
  const raw = readJson<Partial<TaskViewPreferences>>(key);
  if (!raw) return { ...DEFAULT_TASK_VIEW_PREFERENCES };
  return {
    defaultTaskView: isDefaultTaskView(raw.defaultTaskView)
      ? raw.defaultTaskView
      : DEFAULT_TASK_VIEW_PREFERENCES.defaultTaskView,
    lastTaskView: isDefaultTaskView(raw.lastTaskView) ? raw.lastTaskView : null,
    taskViewExplicit: raw.taskViewExplicit === true,
  };
}

function readOneThing(key: string): OneThingPreference | null {
  try {
    const raw = readJson<unknown>(key);
    return parseOneThingPreference(raw);
  } catch {
    return null;
  }
}

/** True when localStorage has anything we can paint before auth/network. */
export function hasLocalWorkspaceSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(
      localStorage.getItem(CACHE_TASKS) ||
        localStorage.getItem(CACHE_PROJECTS) ||
        localStorage.getItem("foci_tasks") ||
        localStorage.getItem("tempo_tasks") ||
        localStorage.getItem("foci_projects") ||
        localStorage.getItem("tempo_projects"),
    );
  } catch {
    return false;
  }
}

/**
 * Sync read of the last known tasks/projects. Safe during useState initializers.
 * Returns null when nothing is cached (first visit).
 */
export function readLocalWorkspaceSnapshot(): LocalWorkspaceSnapshot | null {
  if (typeof window === "undefined") return null;

  try {
    const cachedTasks = readJson<Task[]>(CACHE_TASKS);
    const cachedProjects = readJson<Project[]>(CACHE_PROJECTS);
    if (cachedTasks !== null || cachedProjects !== null) {
      return {
        tasks: normalizeTasks(cachedTasks),
        projects: normalizeProjects(cachedProjects),
        taskViewPrefs: readViewPrefs(CACHE_VIEW_PREFS),
        oneThing: readOneThing(CACHE_ONE_THING),
        source: "cache",
      };
    }

    const guestTasks =
      readJson<Task[]>("foci_tasks") ?? readJson<Task[]>("tempo_tasks");
    const guestProjects =
      readJson<Project[]>("foci_projects") ?? readJson<Project[]>("tempo_projects");
    if (guestTasks !== null || guestProjects !== null) {
      return {
        tasks: normalizeTasks(guestTasks),
        projects: normalizeProjects(guestProjects),
        taskViewPrefs: readViewPrefs("foci_task_view_prefs"),
        oneThing: readOneThing("foci_one_thing"),
        source: "guest",
      };
    }
  } catch {
    return null;
  }

  return null;
}
