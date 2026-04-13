/**
 * CachedSupabaseAdapter — wraps SupabaseStorageAdapter with a localStorage cache
 * so that authenticated users can still load their data when offline.
 *
 * Strategy:
 * - Reads: try Supabase → on success, cache to localStorage → return.
 *          On failure (network error), return cached data from localStorage.
 * - Writes: always update localStorage cache first (so data is never lost),
 *           then attempt Supabase write (fire-and-forget error logging on failure).
 */

import type { StorageAdapter, CollaboratorInfo, CollaborationInvite, SharedProject, CollaboratorRole, AccountCollaboratorInfo, AccountInvite } from "./types";
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
import { formatDateLocal } from "../dates";

// Cache keys — prefixed to avoid collision with guest localStorage keys
const CACHE_PREFIX = "foci_cache_";
const CACHE_KEYS = {
  settings: `${CACHE_PREFIX}settings`,
  dailyGoal: `${CACHE_PREFIX}daily_goal`,
  streakHistory: `${CACHE_PREFIX}streak_history`,
  tasks: `${CACHE_PREFIX}tasks`,
  projects: `${CACHE_PREFIX}projects`,
  selectedProject: `${CACHE_PREFIX}selected_project`,
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function cacheSet(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently fail
  }
}

function cacheGet<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Clear all cache keys (call on logout). */
export function clearOfflineCache(): void {
  if (!isBrowser()) return;
  Object.values(CACHE_KEYS).forEach((k) => localStorage.removeItem(k));
}

export class CachedSupabaseAdapter implements StorageAdapter {
  constructor(private remote: StorageAdapter) {}

  // ── Settings ──────────────────────────────────────────

  async loadSettings(): Promise<Settings> {
    try {
      const result = await this.remote.loadSettings();
      cacheSet(CACHE_KEYS.settings, result);
      return result;
    } catch {
      return cacheGet<Settings>(CACHE_KEYS.settings) ?? DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    cacheSet(CACHE_KEYS.settings, settings);
    await this.remote.saveSettings(settings);
  }

  // ── Daily Goal ────────────────────────────────────────

  async loadDailyGoalData(dailyGoal: number): Promise<DailyGoalData> {
    try {
      const result = await this.remote.loadDailyGoalData(dailyGoal);
      cacheSet(CACHE_KEYS.dailyGoal, result);
      return result;
    } catch {
      return (
        cacheGet<DailyGoalData>(CACHE_KEYS.dailyGoal) ?? {
          date: new Date().toISOString().slice(0, 10),
          sessionCount: 0,
          streak: 0,
          lastStreakUpdate: null,
        }
      );
    }
  }

  async saveDailyGoalData(data: DailyGoalData): Promise<void> {
    cacheSet(CACHE_KEYS.dailyGoal, data);
    await this.remote.saveDailyGoalData(data);
  }

  // ── Streak History ────────────────────────────────────

  async loadStreakHistory(): Promise<StreakHistory> {
    try {
      const result = await this.remote.loadStreakHistory();
      cacheSet(CACHE_KEYS.streakHistory, result);
      return result;
    } catch {
      return cacheGet<StreakHistory>(CACHE_KEYS.streakHistory) ?? { days: {} };
    }
  }

  async saveStreakHistory(history: StreakHistory): Promise<void> {
    cacheSet(CACHE_KEYS.streakHistory, history);
    await this.remote.saveStreakHistory(history);
  }

  async recordDayCompletion(
    date: Date,
    sessionCount: number,
    goalMet: boolean,
  ): Promise<void> {
    // Update cache optimistically
    const cached = cacheGet<StreakHistory>(CACHE_KEYS.streakHistory) ?? { days: {} };
    const dateKey = formatDateLocal(date);
    cached.days[dateKey] = { sessionCount, goalMet, timestamp: Date.now() };
    cacheSet(CACHE_KEYS.streakHistory, cached);

    await this.remote.recordDayCompletion(date, sessionCount, goalMet);
  }

  // ── Tasks ─────────────────────────────────────────────

  async loadTasks(): Promise<Task[]> {
    try {
      const result = await this.remote.loadTasks();
      cacheSet(CACHE_KEYS.tasks, result);
      return result;
    } catch {
      return cacheGet<Task[]>(CACHE_KEYS.tasks) ?? [];
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    cacheSet(CACHE_KEYS.tasks, tasks);
    await this.remote.saveTasks(tasks);
  }

  async saveTask(task: Task): Promise<void> {
    // Update cache by merging into the cached task list
    const cached = cacheGet<Task[]>(CACHE_KEYS.tasks) ?? [];
    const idx = cached.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      cached[idx] = task;
    } else {
      cached.push(task);
    }
    cacheSet(CACHE_KEYS.tasks, cached);

    await this.remote.saveTask(task);
  }

  async deleteTask(id: string): Promise<void> {
    const cached = cacheGet<Task[]>(CACHE_KEYS.tasks) ?? [];
    cacheSet(CACHE_KEYS.tasks, cached.filter((t) => t.id !== id));

    await this.remote.deleteTask(id);
  }

  async deleteTasks(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const cached = cacheGet<Task[]>(CACHE_KEYS.tasks) ?? [];
    cacheSet(CACHE_KEYS.tasks, cached.filter((t) => !idSet.has(t.id)));

    await this.remote.deleteTasks(ids);
  }

  // ── Projects ──────────────────────────────────────────

  async loadProjects(): Promise<Project[]> {
    try {
      const result = await this.remote.loadProjects();
      cacheSet(CACHE_KEYS.projects, result);
      return result;
    } catch {
      const cached = cacheGet<Project[]>(CACHE_KEYS.projects);
      if (cached && cached.length > 0) return cached;
      return [DEFAULT_PROJECT];
    }
  }

  async saveProjects(projects: Project[]): Promise<void> {
    cacheSet(CACHE_KEYS.projects, projects);
    await this.remote.saveProjects(projects);
  }

  async deleteProject(id: string): Promise<void> {
    const cached = cacheGet<Project[]>(CACHE_KEYS.projects) ?? [];
    cacheSet(CACHE_KEYS.projects, cached.filter((p) => p.id !== id));

    await this.remote.deleteProject(id);
  }

  async loadSelectedProjectId(): Promise<string> {
    try {
      const result = await this.remote.loadSelectedProjectId();
      cacheSet(CACHE_KEYS.selectedProject, result);
      return result;
    } catch {
      return cacheGet<string>(CACHE_KEYS.selectedProject) ?? TODAY_FILTER_ID;
    }
  }

  async saveSelectedProjectId(id: string): Promise<void> {
    cacheSet(CACHE_KEYS.selectedProject, id);
    await this.remote.saveSelectedProjectId(id);
  }

  // ── Collaboration (delegate to remote, no caching) ────────

  async getProjectCollaborators(projectId: string): Promise<CollaboratorInfo[]> {
    return this.remote.getProjectCollaborators(projectId);
  }

  async inviteCollaborator(projectId: string, email: string, role: CollaboratorRole): Promise<void> {
    return this.remote.inviteCollaborator(projectId, email, role);
  }

  async removeCollaborator(projectId: string, collaboratorId: string): Promise<void> {
    return this.remote.removeCollaborator(projectId, collaboratorId);
  }

  async updateCollaboratorRole(projectId: string, collaboratorId: string, role: CollaboratorRole): Promise<void> {
    return this.remote.updateCollaboratorRole(projectId, collaboratorId, role);
  }

  async getSentInvites(projectId: string): Promise<CollaborationInvite[]> {
    return this.remote.getSentInvites(projectId);
  }

  async cancelInvite(inviteId: string): Promise<void> {
    return this.remote.cancelInvite(inviteId);
  }

  async getReceivedInvites(): Promise<CollaborationInvite[]> {
    return this.remote.getReceivedInvites();
  }

  async acceptInvite(inviteId: string): Promise<void> {
    return this.remote.acceptInvite(inviteId);
  }

  async declineInvite(inviteId: string): Promise<void> {
    return this.remote.declineInvite(inviteId);
  }

  async getSharedProjects(): Promise<SharedProject[]> {
    return this.remote.getSharedProjects();
  }

  async loadSharedProjectTasks(projectId: string, ownerId: string): Promise<Task[]> {
    return this.remote.loadSharedProjectTasks(projectId, ownerId);
  }

  async updateSharedTask(task: Task, ownerId: string): Promise<void> {
    return this.remote.updateSharedTask(task, ownerId);
  }

  async leaveProject(projectId: string, ownerId: string): Promise<void> {
    return this.remote.leaveProject(projectId, ownerId);
  }

  // ── Account-Level Sharing ─────────────────────────────────

  async getAccountCollaborators(): Promise<AccountCollaboratorInfo[]> {
    return this.remote.getAccountCollaborators();
  }

  async inviteAccountCollaborator(email: string, role: CollaboratorRole): Promise<void> {
    return this.remote.inviteAccountCollaborator(email, role);
  }

  async removeAccountCollaborator(collaboratorId: string): Promise<void> {
    return this.remote.removeAccountCollaborator(collaboratorId);
  }

  async updateAccountCollaboratorRole(collaboratorId: string, role: CollaboratorRole): Promise<void> {
    return this.remote.updateAccountCollaboratorRole(collaboratorId, role);
  }

  async getSentAccountInvites(): Promise<AccountInvite[]> {
    return this.remote.getSentAccountInvites();
  }

  async cancelAccountInvite(inviteId: string): Promise<void> {
    return this.remote.cancelAccountInvite(inviteId);
  }

  async getReceivedAccountInvites(): Promise<AccountInvite[]> {
    return this.remote.getReceivedAccountInvites();
  }

  async acceptAccountInvite(inviteId: string): Promise<void> {
    return this.remote.acceptAccountInvite(inviteId);
  }

  async declineAccountInvite(inviteId: string): Promise<void> {
    return this.remote.declineAccountInvite(inviteId);
  }

  async getSharedAccounts(): Promise<{ ownerId: string; ownerEmail: string; ownerName?: string; role: CollaboratorRole }[]> {
    return this.remote.getSharedAccounts();
  }
}
