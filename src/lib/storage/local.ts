import {
  Settings,
  DailyGoalData,
  StreakHistory,
  Task,
  Project,
  DEFAULT_SETTINGS,
  DEFAULT_PROJECT,
  TODAY_FILTER_ID,
} from "../types";
import type { StorageAdapter, CollaboratorInfo, CollaborationInvite, SharedProject, CollaboratorRole } from "./types";
import { getToday, getYesterday, formatDateLocal } from "../dates";

const SETTINGS_KEY = "foci_settings";
const DAILY_GOAL_KEY = "foci_daily_goal";
const STREAK_HISTORY_KEY = "foci_streak_history";
const TASKS_KEY = "foci_tasks";
const PROJECTS_KEY = "foci_projects";
const SELECTED_PROJECT_KEY = "foci_selected_project";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** One-time migration from old "lockin_*" / "tempo_*" keys to "foci_*" keys */
function migrateOldKeys(): void {
  if (!isBrowser()) return;
  const prefixes = ["lockin_", "tempo_"];
  const NEW_PREFIX = "foci_";
  const suffixes = ["settings", "daily_goal", "streak_history", "tasks", "projects", "selected_project"];
  for (const oldPrefix of prefixes) {
    for (const suffix of suffixes) {
      const oldKey = oldPrefix + suffix;
      const newKey = NEW_PREFIX + suffix;
      const existing = localStorage.getItem(oldKey);
      if (existing !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, existing);
        localStorage.removeItem(oldKey);
      }
    }
  }
}

// Run migration eagerly on module load
migrateOldKeys();

/** Migrate old toDateString() format ("Wed Mar 12 2026") to ISO ("2026-03-12"). */
function migrateDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return formatDateLocal(parsed);
  return getToday();
}

/**
 * localStorage-backed implementation of StorageAdapter.
 * Methods are async to satisfy the interface, but resolve synchronously.
 */
export class LocalStorageAdapter implements StorageAdapter {
  // ── Settings ──────────────────────────────────────────

  async loadSettings(): Promise<Settings> {
    if (!isBrowser()) return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch { /* quota exceeded — silently fail */ }
  }

  // ── Daily Goal ────────────────────────────────────────

  async loadDailyGoalData(dailyGoal: number): Promise<DailyGoalData> {
    if (!isBrowser()) {
      return {
        date: getToday(),
        sessionCount: 0,
        streak: 0,
        lastStreakUpdate: null,
      };
    }

    try {
      const raw = localStorage.getItem(DAILY_GOAL_KEY);
      if (!raw) {
        const initial: DailyGoalData = {
          date: getToday(),
          sessionCount: 0,
          streak: 0,
          lastStreakUpdate: null,
        };
        localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(initial));
        return initial;
      }

      const saved: DailyGoalData = JSON.parse(raw);
      saved.date = migrateDate(saved.date);
      if (saved.lastStreakUpdate) saved.lastStreakUpdate = migrateDate(saved.lastStreakUpdate);
      const today = getToday();
      const yesterday = getYesterday();

      if (saved.date === today) {
        return saved;
      }

      if (saved.date === yesterday) {
        const wasGoalMet = saved.sessionCount >= dailyGoal;
        const newData: DailyGoalData = {
          date: today,
          sessionCount: 0,
          streak: wasGoalMet ? saved.streak : 0,
          lastStreakUpdate: null,
        };
        localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(newData));
        return newData;
      }

      const newData: DailyGoalData = {
        date: today,
        sessionCount: 0,
        streak: 0,
        lastStreakUpdate: null,
      };
      localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(newData));
      return newData;
    } catch {
      return {
        date: getToday(),
        sessionCount: 0,
        streak: 0,
        lastStreakUpdate: null,
      };
    }
  }

  async saveDailyGoalData(data: DailyGoalData): Promise<void> {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(data));
    } catch { /* quota exceeded */ }
  }

  // ── Streak History ────────────────────────────────────

  async loadStreakHistory(): Promise<StreakHistory> {
    if (!isBrowser()) return { days: {} };
    try {
      const raw = localStorage.getItem(STREAK_HISTORY_KEY);
      if (!raw) return { days: {} };
      return JSON.parse(raw);
    } catch {
      return { days: {} };
    }
  }

  async saveStreakHistory(history: StreakHistory): Promise<void> {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(STREAK_HISTORY_KEY, JSON.stringify(history));
    } catch { /* quota exceeded */ }
  }

  async recordDayCompletion(
    date: Date,
    sessionCount: number,
    goalMet: boolean,
  ): Promise<void> {
    const history = await this.loadStreakHistory();
    const dateKey = formatDateLocal(date);
    history.days[dateKey] = {
      sessionCount,
      goalMet,
      timestamp: Date.now(),
    };
    await this.saveStreakHistory(history);
  }

  // ── Tasks ─────────────────────────────────────────────

  async loadTasks(): Promise<Task[]> {
    if (!isBrowser()) return [];
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch { /* quota exceeded */ }
  }

  async saveTask(task: Task): Promise<void> {
    if (!isBrowser()) return;
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      const tasks: Task[] = raw ? JSON.parse(raw) : [];
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) tasks[idx] = task;
      else tasks.push(task);
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch { /* quota exceeded */ }
  }

  async deleteTask(id: string): Promise<void> {
    if (!isBrowser()) return;
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (!raw) return;
      const tasks: Task[] = JSON.parse(raw);
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks.filter((t) => t.id !== id)));
    } catch { /* ignore */ }
  }

  async deleteTasks(ids: string[]): Promise<void> {
    if (!isBrowser()) return;
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (!raw) return;
      const idSet = new Set(ids);
      const tasks: Task[] = JSON.parse(raw);
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks.filter((t) => !idSet.has(t.id))));
    } catch { /* ignore */ }
  }

  // ── Projects ──────────────────────────────────────────

  async loadProjects(): Promise<Project[]> {
    if (!isBrowser()) return [DEFAULT_PROJECT];
    try {
      const raw = localStorage.getItem(PROJECTS_KEY);
      if (!raw) return [DEFAULT_PROJECT];
      const projects: Project[] = JSON.parse(raw);
      if (!projects.find((p) => p.id === DEFAULT_PROJECT.id)) {
        return [DEFAULT_PROJECT, ...projects];
      }
      return projects;
    } catch {
      return [DEFAULT_PROJECT];
    }
  }

  async saveProjects(projects: Project[]): Promise<void> {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch { /* quota exceeded */ }
  }

  async deleteProject(id: string): Promise<void> {
    if (!isBrowser()) return;
    try {
      const raw = localStorage.getItem(PROJECTS_KEY);
      if (!raw) return;
      const projects: Project[] = JSON.parse(raw);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.filter((p) => p.id !== id)));
    } catch { /* ignore */ }
  }

  async loadSelectedProjectId(): Promise<string> {
    if (!isBrowser()) return DEFAULT_PROJECT.id;
    return localStorage.getItem(SELECTED_PROJECT_KEY) || TODAY_FILTER_ID;
  }

  async saveSelectedProjectId(id: string): Promise<void> {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(SELECTED_PROJECT_KEY, id);
    } catch { /* quota exceeded */ }
  }

  // ── Collaboration (not available without authentication) ──

  async getProjectCollaborators(): Promise<CollaboratorInfo[]> {
    return [];
  }

  async inviteCollaborator(): Promise<void> {
    throw new Error("Sign in to invite collaborators");
  }

  async removeCollaborator(): Promise<void> {
    throw new Error("Sign in to manage collaborators");
  }

  async updateCollaboratorRole(): Promise<void> {
    throw new Error("Sign in to manage collaborators");
  }

  async getSentInvites(): Promise<CollaborationInvite[]> {
    return [];
  }

  async cancelInvite(): Promise<void> {
    throw new Error("Sign in to manage invites");
  }

  async getReceivedInvites(): Promise<CollaborationInvite[]> {
    return [];
  }

  async acceptInvite(): Promise<void> {
    throw new Error("Sign in to accept invites");
  }

  async declineInvite(): Promise<void> {
    throw new Error("Sign in to decline invites");
  }

  async getSharedProjects(): Promise<SharedProject[]> {
    return [];
  }

  async loadSharedProjectTasks(): Promise<Task[]> {
    return [];
  }

  async updateSharedTask(): Promise<void> {
    throw new Error("Sign in to update shared tasks");
  }

  async leaveProject(): Promise<void> {
    throw new Error("Sign in to leave projects");
  }
}
