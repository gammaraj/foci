import {
  Settings,
  DailyGoalData,
  StreakHistory,
  Task,
  Project,
  DEFAULT_SETTINGS,
  DEFAULT_PROJECT,
  ALL_PROJECTS_ID,
  TODAY_FILTER_ID,
} from "../types";
import type { StorageAdapter, CollaboratorInfo, CollaborationInvite, SharedProject, CollaboratorRole, AccountCollaboratorInfo, AccountInvite } from "./types";
import {
  DEFAULT_TASK_VIEW_PREFERENCES,
  isDefaultTaskView,
  type TaskViewPreferences,
} from "../task-view-preference";
import { parseOneThingPreference, type OneThingPreference } from "../one-thing";
import { MAX_CUSTOM_QUOTE } from "../quotes";
import { getToday, getYesterday, formatDateLocal, migrateDate } from "../dates";
import {
  getTimerAlarmEnabled,
  getTimerAlarmSound,
  isAlarmSoundId,
  setTimerAlarmEnabled,
  setTimerAlarmSound,
} from "../timer-alarm";

const SETTINGS_KEY = "foci_settings";
const DAILY_GOAL_KEY = "foci_daily_goal";
const STREAK_HISTORY_KEY = "foci_streak_history";
const TASKS_KEY = "foci_tasks";
const PROJECTS_KEY = "foci_projects";
const SELECTED_PROJECT_KEY = "foci_selected_project";
const TASK_VIEW_PREFS_KEY = "foci_task_view_prefs";
const ONE_THING_KEY = "foci_one_thing";
const CUSTOM_QUOTE_KEY = "foci_custom_quote";
const LEGACY_CUSTOM_QUOTE_KEY = "foci-custom-quote";

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
      const parsed = raw ? JSON.parse(raw) : {};
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      return {
        ...merged,
        alarmEnabled: getTimerAlarmEnabled(),
        alarmSound: getTimerAlarmSound(),
      };
    } catch {
      return {
        ...DEFAULT_SETTINGS,
        alarmEnabled: getTimerAlarmEnabled(),
        alarmSound: getTimerAlarmSound(),
      };
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    if (!isBrowser()) return;
    try {
      setTimerAlarmEnabled(settings.alarmEnabled);
      setTimerAlarmSound(isAlarmSoundId(settings.alarmSound) ? settings.alarmSound : DEFAULT_SETTINGS.alarmSound);
      const { alarmEnabled: _enabled, alarmSound: _sound, ...rest } = settings;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
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
    return localStorage.getItem(SELECTED_PROJECT_KEY) || ALL_PROJECTS_ID;
  }

  async saveSelectedProjectId(id: string): Promise<void> {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(SELECTED_PROJECT_KEY, id);
    } catch { /* quota exceeded */ }
  }

  async loadTaskViewPreferences(): Promise<TaskViewPreferences> {
    if (!isBrowser()) return { ...DEFAULT_TASK_VIEW_PREFERENCES };
    try {
      const raw = localStorage.getItem(TASK_VIEW_PREFS_KEY);
      if (!raw) return { ...DEFAULT_TASK_VIEW_PREFERENCES };
      const parsed = JSON.parse(raw) as Partial<TaskViewPreferences>;
      return {
        defaultTaskView: isDefaultTaskView(parsed.defaultTaskView)
          ? parsed.defaultTaskView
          : DEFAULT_TASK_VIEW_PREFERENCES.defaultTaskView,
        lastTaskView: isDefaultTaskView(parsed.lastTaskView) ? parsed.lastTaskView : null,
        taskViewExplicit: parsed.taskViewExplicit === true,
      };
    } catch {
      return { ...DEFAULT_TASK_VIEW_PREFERENCES };
    }
  }

  async saveTaskViewPreferences(prefs: Partial<TaskViewPreferences>): Promise<void> {
    if (!isBrowser()) return;
    try {
      const current = await this.loadTaskViewPreferences();
      localStorage.setItem(TASK_VIEW_PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
    } catch { /* quota exceeded */ }
  }

  async loadOneThing(): Promise<OneThingPreference | null> {
    if (!isBrowser()) return null;
    try {
      const raw = localStorage.getItem(ONE_THING_KEY);
      if (!raw) return null;
      return parseOneThingPreference(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  async saveOneThing(pref: OneThingPreference | null): Promise<void> {
    if (!isBrowser()) return;
    try {
      if (!pref) {
        localStorage.removeItem(ONE_THING_KEY);
        return;
      }
      localStorage.setItem(ONE_THING_KEY, JSON.stringify(pref));
    } catch { /* quota exceeded */ }
  }

  async loadCustomQuote(): Promise<string | null> {
    if (!isBrowser()) return null;
    try {
      const raw =
        localStorage.getItem(CUSTOM_QUOTE_KEY)?.trim() ||
        localStorage.getItem(LEGACY_CUSTOM_QUOTE_KEY)?.trim() ||
        "";
      if (!raw) return null;
      const quote = raw.slice(0, MAX_CUSTOM_QUOTE);
      if (!localStorage.getItem(CUSTOM_QUOTE_KEY) && localStorage.getItem(LEGACY_CUSTOM_QUOTE_KEY)) {
        localStorage.setItem(CUSTOM_QUOTE_KEY, quote);
        localStorage.removeItem(LEGACY_CUSTOM_QUOTE_KEY);
      }
      return quote;
    } catch {
      return null;
    }
  }

  async saveCustomQuote(quote: string | null): Promise<void> {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(LEGACY_CUSTOM_QUOTE_KEY);
      const trimmed = quote?.trim().slice(0, MAX_CUSTOM_QUOTE) ?? "";
      if (!trimmed) {
        localStorage.removeItem(CUSTOM_QUOTE_KEY);
        return;
      }
      localStorage.setItem(CUSTOM_QUOTE_KEY, trimmed);
    } catch { /* quota exceeded */ }
  }

  // ── Collaboration (not available without authentication) ──

  async getProjectCollaborators(_projectId: string): Promise<CollaboratorInfo[]> {
    return [];
  }

  async inviteCollaborator(_projectId: string, _email: string, _role: CollaboratorRole): Promise<void> {
    throw new Error("Sign in to invite collaborators");
  }

  async removeCollaborator(_projectId: string, _collaboratorId: string): Promise<void> {
    throw new Error("Sign in to manage collaborators");
  }

  async updateCollaboratorRole(_projectId: string, _collaboratorId: string, _role: CollaboratorRole): Promise<void> {
    throw new Error("Sign in to manage collaborators");
  }

  async getSentInvites(_projectId: string): Promise<CollaborationInvite[]> {
    return [];
  }

  async cancelInvite(_inviteId: string): Promise<void> {
    throw new Error("Sign in to manage invites");
  }

  async getReceivedInvites(): Promise<CollaborationInvite[]> {
    return [];
  }

  async acceptInvite(_inviteId: string): Promise<void> {
    throw new Error("Sign in to accept invites");
  }

  async declineInvite(_inviteId: string): Promise<void> {
    throw new Error("Sign in to decline invites");
  }

  async getSharedProjects(): Promise<SharedProject[]> {
    return [];
  }

  async loadSharedProjectTasks(_projectId: string, _ownerId: string): Promise<Task[]> {
    return [];
  }

  subscribeSharedProjectTasks(
    _projectId: string,
    _ownerId: string,
    _onChange: () => void,
    _onStatus?: (status: "subscribed" | "fallback") => void,
  ): () => void {
    return () => {};
  }

  async updateSharedTask(_task: Task, _ownerId: string): Promise<void> {
    throw new Error("Sign in to update shared tasks");
  }

  async insertSharedTask(_task: Task, _ownerId: string): Promise<void> {
    throw new Error("Sign in to add tasks to shared projects");
  }

  async leaveProject(_projectId: string, _ownerId: string): Promise<void> {
    throw new Error("Sign in to leave projects");
  }

  async leaveSharedAccount(_ownerId: string): Promise<void> {
    throw new Error("Sign in to leave shared accounts");
  }

  // ── Account-Level Sharing (requires auth) ─────────────────

  async getAccountCollaborators(): Promise<AccountCollaboratorInfo[]> {
    return [];
  }

  async inviteAccountCollaborator(_email: string, _role: CollaboratorRole): Promise<void> {
    throw new Error("Sign in to share your account");
  }

  async removeAccountCollaborator(_collaboratorId: string): Promise<void> {
    throw new Error("Sign in to manage account sharing");
  }

  async updateAccountCollaboratorRole(_collaboratorId: string, _role: CollaboratorRole): Promise<void> {
    throw new Error("Sign in to manage account sharing");
  }

  async getSentAccountInvites(): Promise<AccountInvite[]> {
    return [];
  }

  async cancelAccountInvite(_inviteId: string): Promise<void> {
    throw new Error("Sign in to manage invites");
  }

  async getReceivedAccountInvites(): Promise<AccountInvite[]> {
    return [];
  }

  async acceptAccountInvite(_inviteId: string): Promise<void> {
    throw new Error("Sign in to accept invites");
  }

  async declineAccountInvite(_inviteId: string): Promise<void> {
    throw new Error("Sign in to decline invites");
  }

  async getSharedAccounts(): Promise<{ ownerId: string; ownerEmail: string; ownerName?: string; role: CollaboratorRole }[]> {
    return [];
  }
}
