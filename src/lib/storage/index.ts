/**
 * Storage barrel — thin wrapper around the active StorageAdapter.
 *
 * Uses SupabaseStorageAdapter when the user is authenticated,
 * falls back to LocalStorageAdapter otherwise.
 */

export type { StorageAdapter, CollaboratorInfo, CollaborationInvite, SharedProject, CollaboratorRole, ProjectListItem, isSharedProject, AccountInvite, AccountCollaboratorInfo } from "./types";
export { isSharedProject as isSharedProjectFn } from "./types";
export { LocalStorageAdapter } from "./local";
export { SupabaseStorageAdapter } from "./supabase";

import { LocalStorageAdapter } from "./local";
import { SupabaseStorageAdapter } from "./supabase";
import { CachedSupabaseAdapter, clearOfflineCache, hasOfflineCache } from "./cached-supabase";
import type { StorageAdapter } from "./types";
import { createClient } from "../supabase/client";
import { DEFAULT_SETTINGS, type DailyGoalData, type Project, type Settings, type StreakHistory, type Task } from "../types";
import type { TaskViewPreferences } from "../task-view-preference";
import type { OneThingPreference } from "../one-thing";
import {
  clearSessionAlarm,
  getTimerAlarmEnabled,
  getTimerAlarmSound,
  hasSessionAlarmOverride,
} from "../timer-alarm";

export { hasOfflineCache };
export {
  hasLocalWorkspaceSnapshot,
  readLocalWorkspaceSnapshot,
  type LocalWorkspaceSnapshot,
} from "./local-snapshot";

// ── Adapter registry ────────────────────────────────────
const localAdapter = new LocalStorageAdapter();
let supabaseAdapter: SupabaseStorageAdapter | null = null;
let currentAdapter: StorageAdapter = localAdapter;

const MIGRATION_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Storage migration timed out")), ms);
    }),
  ]);
}

/**
 * Switch to the Supabase adapter (call after user logs in).
 * Activates the cached adapter immediately so offline loads work, then
 * migrates any existing guest localStorage data in the background when online.
 * Returns a Promise that resolves once the adapter is ready (not after migration).
 */
let activatingPromise: Promise<void> | null = null;
export function activateSupabaseStorage(): Promise<void> {
  if (activatingPromise) return activatingPromise;
  activatingPromise = doActivateSupabase();
  return activatingPromise;
}

async function doActivateSupabase(): Promise<void> {
  try {
    const supabase = createClient();
    supabaseAdapter = new SupabaseStorageAdapter(supabase);
    // Install cache-first adapter before any network so offline paint works.
    currentAdapter = new CachedSupabaseAdapter(supabaseAdapter);

    if (typeof window === "undefined") return;

    const online = typeof navigator === "undefined" || navigator.onLine !== false;
    // Guest → account migration needs the network; skip while offline.
    if (!online) return;

    try {
      await withTimeout(migrateGuestDataIfNeeded(supabaseAdapter), MIGRATION_TIMEOUT_MS);
    } catch {
      // Migration failed or timed out — keep offline cache + guest keys as fallback
    }
  } finally {
    activatingPromise = null;
  }
}

async function migrateGuestDataIfNeeded(adapter: SupabaseStorageAdapter): Promise<void> {
  const localTasks = localStorage.getItem("foci_tasks") || localStorage.getItem("tempo_tasks");
  const localProjects = localStorage.getItem("foci_projects") || localStorage.getItem("tempo_projects");
  const localSettings = localStorage.getItem("foci_settings") || localStorage.getItem("tempo_settings");
  const localStreak = localStorage.getItem("foci_streak_history") || localStorage.getItem("tempo_streak_history");
  const localGoal = localStorage.getItem("foci_daily_goal") || localStorage.getItem("tempo_daily_goal");

  // Only migrate if there's local data and Supabase has no tasks yet
  if (localTasks) {
    const existingTasks = await adapter.loadTasks();
    if (existingTasks.length === 0) {
      const tasks = JSON.parse(localTasks) as Task[];
      if (!Array.isArray(tasks) || tasks.length === 0) {
        // Nothing useful to migrate — fall through to clear guest keys
      } else {
        let projects: Project[] = [];
        if (localProjects) {
          const parsed = JSON.parse(localProjects);
          if (Array.isArray(parsed)) projects = parsed;
        }

        let settings: Settings | null = null;
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          settings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            alarmEnabled: hasSessionAlarmOverride()
              ? getTimerAlarmEnabled()
              : parsed.alarmEnabled ?? DEFAULT_SETTINGS.alarmEnabled,
            alarmSound: hasSessionAlarmOverride()
              ? getTimerAlarmSound()
              : parsed.alarmSound ?? DEFAULT_SETTINGS.alarmSound,
          };
        }

        let streakHistory: StreakHistory | null = null;
        if (localStreak) {
          streakHistory = JSON.parse(localStreak);
        }

        let dailyGoal: DailyGoalData | null = null;
        if (localGoal) {
          dailyGoal = JSON.parse(localGoal);
        }

        let taskViewPrefs: Partial<TaskViewPreferences> | null = null;
        const legacyDefaultView = localStorage.getItem("foci_default_task_view");
        const legacyLastView = localStorage.getItem("foci_task_view_mode");
        const legacyExplicit = localStorage.getItem("foci_task_view_explicit") === "1";
        if (legacyDefaultView || legacyLastView || legacyExplicit) {
          const { isDefaultTaskView } = await import("../task-view-preference");
          taskViewPrefs = {
            ...(isDefaultTaskView(legacyDefaultView) ? { defaultTaskView: legacyDefaultView } : {}),
            ...(isDefaultTaskView(legacyLastView) ? { lastTaskView: legacyLastView } : {}),
            ...(legacyExplicit ? { taskViewExplicit: true } : {}),
          };
        }

        let oneThing: OneThingPreference | null = null;
        const localOneThing = localStorage.getItem("foci_one_thing");
        if (localOneThing) {
          try {
            const { parseOneThingPreference } = await import("../one-thing");
            oneThing = parseOneThingPreference(JSON.parse(localOneThing));
          } catch {
            /* ignore bad local one-thing */
          }
        }

        let customQuote: string | null = null;
        const localQuote =
          localStorage.getItem("foci_custom_quote")?.trim() ||
          localStorage.getItem("foci-custom-quote")?.trim() ||
          "";
        if (localQuote) customQuote = localQuote.slice(0, 160);

        // Atomic RPC (or sequential fallback). Throws on failure so guest keys are kept.
        await adapter.migrateGuestWorkspace({
          tasks,
          projects,
          settings,
          streakHistory,
          dailyGoal,
          taskViewPrefs,
          oneThing,
          customQuote,
        });
      }
    }
  }

  if (hasSessionAlarmOverride()) {
    try {
      const existing = await adapter.loadSettings();
      await adapter.saveSettings({
        ...DEFAULT_SETTINGS,
        ...existing,
        alarmEnabled: getTimerAlarmEnabled(),
        alarmSound: getTimerAlarmSound(),
      });
    } catch {
      /* Guest session alarm could not be copied — signed-in defaults still apply. */
    }
    clearSessionAlarm();
  }

  // Clear guest keys only after successful migration path (or when none needed).
  // If localTasks existed but remote already had data, still clear guest keys
  // so we don't keep re-attempting; signed-in data lives in foci_cache_*.
  const keys = [
    "foci_settings",
    "foci_daily_goal",
    "foci_streak_history",
    "foci_tasks",
    "foci_projects",
    "foci_selected_project",
    "foci_task_view_prefs",
    "foci_default_task_view",
    "foci_task_view_mode",
    "foci_task_view_explicit",
    "foci_one_thing",
    "foci_custom_quote",
    "foci-custom-quote",
    "foci_timer_alarm_enabled",
    "foci_timer_alarm_sound",
    "tempo_settings",
    "tempo_daily_goal",
    "tempo_streak_history",
    "tempo_tasks",
    "tempo_projects",
    "tempo_selected_project",
  ];
  keys.forEach((k) => localStorage.removeItem(k));
}

/**
 * Switch back to localStorage (guest mode).
 * Only wipe the signed-in offline cache on explicit logout — auth timeouts
 * and offline fallbacks must keep foci_cache_* so tasks still load.
 */
export function activateLocalStorage(options?: { clearCache?: boolean }): void {
  supabaseAdapter = null;
  currentAdapter = localAdapter;
  if (options?.clearCache) {
    clearOfflineCache();
  }
}

/**
 * Returns the currently active adapter.
 */
export function getStorage(): StorageAdapter {
  return currentAdapter;
}

// ── Public API (async, delegates to active adapter) ─────
export const loadSettings = () => currentAdapter.loadSettings();
export const saveSettings = (...args: Parameters<StorageAdapter["saveSettings"]>) =>
  currentAdapter.saveSettings(...args);

export const loadDailyGoalData = (...args: Parameters<StorageAdapter["loadDailyGoalData"]>) =>
  currentAdapter.loadDailyGoalData(...args);
export const saveDailyGoalData = (...args: Parameters<StorageAdapter["saveDailyGoalData"]>) =>
  currentAdapter.saveDailyGoalData(...args);

export const loadStreakHistory = () => currentAdapter.loadStreakHistory();
export const saveStreakHistory = (...args: Parameters<StorageAdapter["saveStreakHistory"]>) =>
  currentAdapter.saveStreakHistory(...args);
export const recordDayCompletion = (...args: Parameters<StorageAdapter["recordDayCompletion"]>) =>
  currentAdapter.recordDayCompletion(...args);

export const loadTasks = () => currentAdapter.loadTasks();
export const saveTasks = (...args: Parameters<StorageAdapter["saveTasks"]>) =>
  currentAdapter.saveTasks(...args);
export const saveTask = (...args: Parameters<StorageAdapter["saveTask"]>) =>
  currentAdapter.saveTask(...args);
export const deleteTask = (...args: Parameters<StorageAdapter["deleteTask"]>) =>
  currentAdapter.deleteTask(...args);
export const deleteTasks = (...args: Parameters<StorageAdapter["deleteTasks"]>) =>
  currentAdapter.deleteTasks(...args);

export const loadProjects = () => currentAdapter.loadProjects();
export const saveProjects = (...args: Parameters<StorageAdapter["saveProjects"]>) =>
  currentAdapter.saveProjects(...args);
export const deleteProject = (...args: Parameters<StorageAdapter["deleteProject"]>) =>
  currentAdapter.deleteProject(...args);
export const loadSelectedProjectId = () => currentAdapter.loadSelectedProjectId();
export const saveSelectedProjectId = (...args: Parameters<StorageAdapter["saveSelectedProjectId"]>) =>
  currentAdapter.saveSelectedProjectId(...args);
export const loadTaskViewPreferences = () => currentAdapter.loadTaskViewPreferences();
export const saveTaskViewPreferences = (...args: Parameters<StorageAdapter["saveTaskViewPreferences"]>) =>
  currentAdapter.saveTaskViewPreferences(...args);
export const loadOneThing = () => currentAdapter.loadOneThing();
export const saveOneThing = (...args: Parameters<StorageAdapter["saveOneThing"]>) =>
  currentAdapter.saveOneThing(...args);
export const loadCustomQuote = () => currentAdapter.loadCustomQuote();
export const saveCustomQuote = (...args: Parameters<StorageAdapter["saveCustomQuote"]>) =>
  currentAdapter.saveCustomQuote(...args);

// ── Collaboration API ───────────────────────────────────
export const getProjectCollaborators = (...args: Parameters<StorageAdapter["getProjectCollaborators"]>) =>
  currentAdapter.getProjectCollaborators(...args);
export const inviteCollaborator = (...args: Parameters<StorageAdapter["inviteCollaborator"]>) =>
  currentAdapter.inviteCollaborator(...args);
export const removeCollaborator = (...args: Parameters<StorageAdapter["removeCollaborator"]>) =>
  currentAdapter.removeCollaborator(...args);
export const updateCollaboratorRole = (...args: Parameters<StorageAdapter["updateCollaboratorRole"]>) =>
  currentAdapter.updateCollaboratorRole(...args);
export const getSentInvites = (...args: Parameters<StorageAdapter["getSentInvites"]>) =>
  currentAdapter.getSentInvites(...args);
export const cancelInvite = (...args: Parameters<StorageAdapter["cancelInvite"]>) =>
  currentAdapter.cancelInvite(...args);
export const getReceivedInvites = () => currentAdapter.getReceivedInvites();
export const acceptInvite = (...args: Parameters<StorageAdapter["acceptInvite"]>) =>
  currentAdapter.acceptInvite(...args);
export const declineInvite = (...args: Parameters<StorageAdapter["declineInvite"]>) =>
  currentAdapter.declineInvite(...args);
export const getSharedProjects = () => currentAdapter.getSharedProjects();
export const loadSharedProjectTasks = (...args: Parameters<StorageAdapter["loadSharedProjectTasks"]>) =>
  currentAdapter.loadSharedProjectTasks(...args);
export const subscribeSharedProjectTasks = (
  ...args: Parameters<StorageAdapter["subscribeSharedProjectTasks"]>
) => currentAdapter.subscribeSharedProjectTasks(...args);
export const updateSharedTask = (...args: Parameters<StorageAdapter["updateSharedTask"]>) =>
  currentAdapter.updateSharedTask(...args);
export const insertSharedTask = (...args: Parameters<StorageAdapter["insertSharedTask"]>) =>
  currentAdapter.insertSharedTask(...args);
export const leaveProject = (...args: Parameters<StorageAdapter["leaveProject"]>) =>
  currentAdapter.leaveProject(...args);
export const leaveSharedAccount = (...args: Parameters<StorageAdapter["leaveSharedAccount"]>) =>
  currentAdapter.leaveSharedAccount(...args);

// ── Account-Level Sharing API ─────────────────────────────
export const getAccountCollaborators = () => currentAdapter.getAccountCollaborators();
export const inviteAccountCollaborator = (...args: Parameters<StorageAdapter["inviteAccountCollaborator"]>) =>
  currentAdapter.inviteAccountCollaborator(...args);
export const removeAccountCollaborator = (...args: Parameters<StorageAdapter["removeAccountCollaborator"]>) =>
  currentAdapter.removeAccountCollaborator(...args);
export const updateAccountCollaboratorRole = (...args: Parameters<StorageAdapter["updateAccountCollaboratorRole"]>) =>
  currentAdapter.updateAccountCollaboratorRole(...args);
export const getSentAccountInvites = () => currentAdapter.getSentAccountInvites();
export const cancelAccountInvite = (...args: Parameters<StorageAdapter["cancelAccountInvite"]>) =>
  currentAdapter.cancelAccountInvite(...args);
export const getReceivedAccountInvites = () => currentAdapter.getReceivedAccountInvites();
export const acceptAccountInvite = (...args: Parameters<StorageAdapter["acceptAccountInvite"]>) =>
  currentAdapter.acceptAccountInvite(...args);
export const declineAccountInvite = (...args: Parameters<StorageAdapter["declineAccountInvite"]>) =>
  currentAdapter.declineAccountInvite(...args);
export const getSharedAccounts = () => currentAdapter.getSharedAccounts();
