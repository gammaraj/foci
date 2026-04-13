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
import { CachedSupabaseAdapter, clearOfflineCache } from "./cached-supabase";
import type { StorageAdapter } from "./types";
import { createClient } from "../supabase/client";

// ── Adapter registry ────────────────────────────────────
const localAdapter = new LocalStorageAdapter();
let supabaseAdapter: SupabaseStorageAdapter | null = null;
let currentAdapter: StorageAdapter = localAdapter;

/**
 * Switch to the Supabase adapter (call after user logs in).
 * Migrates any existing local data to Supabase before clearing localStorage.
 * Returns a Promise that resolves when activation + migration is complete.
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
    currentAdapter = new CachedSupabaseAdapter(supabaseAdapter);

    // Migrate local data to Supabase if any exists
    if (typeof window !== "undefined") {
      try {
        const localTasks = localStorage.getItem("foci_tasks") || localStorage.getItem("tempo_tasks");
        const localProjects = localStorage.getItem("foci_projects") || localStorage.getItem("tempo_projects");
        const localSettings = localStorage.getItem("foci_settings") || localStorage.getItem("tempo_settings");
        const localStreak = localStorage.getItem("foci_streak_history") || localStorage.getItem("tempo_streak_history");
        const localGoal = localStorage.getItem("foci_daily_goal") || localStorage.getItem("tempo_daily_goal");

        // Only migrate if there's local data and Supabase has no tasks yet
        if (localTasks) {
          const existingTasks = await supabaseAdapter.loadTasks();
          if (existingTasks.length === 0) {
            const tasks = JSON.parse(localTasks);
            if (Array.isArray(tasks) && tasks.length > 0) {
              await supabaseAdapter.saveTasks(tasks);
            }
            if (localProjects) {
              const projects = JSON.parse(localProjects);
              if (Array.isArray(projects) && projects.length > 0) {
                await supabaseAdapter.saveProjects(projects);
              }
            }
            if (localSettings) {
              await supabaseAdapter.saveSettings(JSON.parse(localSettings));
            }
            if (localStreak) {
              await supabaseAdapter.saveStreakHistory(JSON.parse(localStreak));
            }
            if (localGoal) {
              await supabaseAdapter.saveDailyGoalData(JSON.parse(localGoal));
            }
          }
        }

        // Clear local storage only after successful migration
        const keys = [
          "foci_settings",
          "foci_daily_goal",
          "foci_streak_history",
          "foci_tasks",
          "foci_projects",
          "foci_selected_project",
          "tempo_settings",
          "tempo_daily_goal",
          "tempo_streak_history",
          "tempo_tasks",
          "tempo_projects",
          "tempo_selected_project",
        ];
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {
        // Migration failed — keep local data as fallback
      }
    }
  } finally {
    activatingPromise = null;
  }
}

/**
 * Switch back to localStorage (call after user logs out).
 */
export function activateLocalStorage(): void {
  supabaseAdapter = null;
  currentAdapter = localAdapter;
  clearOfflineCache();
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
export const updateSharedTask = (...args: Parameters<StorageAdapter["updateSharedTask"]>) =>
  currentAdapter.updateSharedTask(...args);
export const leaveProject = (...args: Parameters<StorageAdapter["leaveProject"]>) =>
  currentAdapter.leaveProject(...args);

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
