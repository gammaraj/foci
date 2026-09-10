import { reportError } from "@/lib/report-error";
/**
 * CachedSupabaseAdapter — wraps SupabaseStorageAdapter with a localStorage cache
 * so that authenticated users can still load their data when offline.
 *
 * Strategy:
 * - Reads (tasks/projects/prefs): cache-first when warm — return localStorage
 *   immediately, refresh Supabase in the background, notify on change.
 *   Cold cache: try Supabase → cache → return; on failure use cache/defaults.
 * - Writes: always update localStorage cache first (so data is never lost),
 *           then attempt Supabase write. If the device is offline or the write
 *           fails with a transient/auth-hydration error (common on iOS when the
 *           keyboard dismisses), keep the local write and retry in the background.
 */

import type { StorageAdapter, CollaboratorInfo, CollaborationInvite, SharedProject, CollaboratorRole, AccountCollaboratorInfo, AccountInvite } from "./types";
import {
  DEFAULT_TASK_VIEW_PREFERENCES,
  type TaskViewPreferences,
} from "../task-view-preference";
import type { OneThingPreference } from "../one-thing";
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
import { formatDateLocal } from "../dates";
import { isQueueableSyncError } from "./sync-errors";

// Cache keys — prefixed to avoid collision with guest localStorage keys
const CACHE_PREFIX = "foci_cache_";
const CACHE_KEYS = {
  settings: `${CACHE_PREFIX}settings`,
  dailyGoal: `${CACHE_PREFIX}daily_goal`,
  streakHistory: `${CACHE_PREFIX}streak_history`,
  tasks: `${CACHE_PREFIX}tasks`,
  projects: `${CACHE_PREFIX}projects`,
  selectedProject: `${CACHE_PREFIX}selected_project`,
  taskViewPrefs: `${CACHE_PREFIX}task_view_prefs`,
  oneThing: `${CACHE_PREFIX}one_thing`,
  customQuote: `${CACHE_PREFIX}custom_quote`,
} as const;

/**
 * Task ids with local changes the server has not confirmed yet. Persisted so a
 * failed/offline write is retried after a reload instead of becoming a
 * device-only orphan that the cache would otherwise keep forever.
 */
const PENDING_TASKS_KEY = `${CACHE_PREFIX}pending_tasks`;
/** Account that owns the current cache — guards against cross-account bleed. */
const CACHE_OWNER_KEY = `${CACHE_PREFIX}owner`;
const PENDING_TASKS_LABEL = "pending tasks";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isLikelyOffline(): boolean {
  return isBrowser() && navigator.onLine === false;
}

type PendingWrite = { label: string; write: () => Promise<void> };

const INITIAL_FLUSH_DELAY_MS = 400;
const MAX_FLUSH_DELAY_MS = 30_000;

let pendingWrites: PendingWrite[] = [];
let flushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushDelayMs = INITIAL_FLUSH_DELAY_MS;
let listenersInstalled = false;

function ensureFlushListeners(): void {
  if (!isBrowser() || listenersInstalled) return;
  if (typeof window.addEventListener !== "function") return;
  listenersInstalled = true;
  window.addEventListener("online", () => {
    flushDelayMs = INITIAL_FLUSH_DELAY_MS;
    void flushPendingStorageSyncs();
  });
  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        flushDelayMs = INITIAL_FLUSH_DELAY_MS;
        void flushPendingStorageSyncs();
      }
    });
  }
}

function enqueuePendingWrite(label: string, write: () => Promise<void>): void {
  pendingWrites.push({ label, write });
  ensureFlushListeners();
  scheduleFlush(INITIAL_FLUSH_DELAY_MS);
}

function scheduleFlush(delayMs: number): void {
  if (flushTimer != null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPendingStorageSyncs();
  }, delayMs);
}

/** Retry queued writes (auth ready, back online, or tab visible). */
export async function flushPendingStorageSyncs(): Promise<void> {
  if (flushing || pendingWrites.length === 0) return;
  if (isLikelyOffline()) {
    scheduleFlush(Math.min(flushDelayMs * 2, MAX_FLUSH_DELAY_MS));
    return;
  }
  flushing = true;
  const queue = pendingWrites;
  pendingWrites = [];
  try {
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]!;
      try {
        await item.write();
      } catch (err) {
        if (isLikelyOffline() || isQueueableSyncError(err)) {
          pendingWrites.push(...queue.slice(i));
          flushDelayMs = Math.min(flushDelayMs * 2, MAX_FLUSH_DELAY_MS);
          scheduleFlush(flushDelayMs);
          break;
        }
        reportError(`Pending ${item.label} sync failed`, err);
      }
    }
    if (pendingWrites.length === 0) {
      flushDelayMs = INITIAL_FLUSH_DELAY_MS;
    }
  } finally {
    flushing = false;
  }
}

export function clearPendingStorageSyncs(): void {
  pendingWrites = [];
  flushDelayMs = INITIAL_FLUSH_DELAY_MS;
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

async function syncOrKeepLocal(
  label: string,
  write: () => Promise<void>,
  localOk = true,
): Promise<boolean> {
  try {
    await write();
    return true;
  } catch (err) {
    if (localOk && (isLikelyOffline() || isQueueableSyncError(err))) {
      reportError(`Offline: ${label} saved locally, sync pending`, err, { offline: true });
      enqueuePendingWrite(label, write);
      return false;
    }
    throw err;
  }
}

function cacheSet(key: string, value: unknown): boolean {
  if (!isBrowser()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
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

function cacheHas(key: string): boolean {
  if (!isBrowser()) return false;
  try {
    return localStorage.getItem(key) != null;
  } catch {
    return false;
  }
}

/** Task ids whose latest local write the server has not confirmed yet. */
function readPendingTaskIds(): Set<string> {
  const raw = cacheGet<string[]>(PENDING_TASKS_KEY);
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((id): id is string => typeof id === "string" && id.length > 0));
}

function writePendingTaskIds(ids: Set<string>): void {
  if (!isBrowser()) return;
  if (ids.size === 0) {
    try {
      localStorage.removeItem(PENDING_TASKS_KEY);
    } catch {
      /* ignore quota / private mode */
    }
    return;
  }
  cacheSet(PENDING_TASKS_KEY, Array.from(ids));
}

function markPendingTaskIds(ids: Iterable<string>): void {
  const pending = readPendingTaskIds();
  let changed = false;
  for (const id of ids) {
    if (id && !pending.has(id)) {
      pending.add(id);
      changed = true;
    }
  }
  if (changed) writePendingTaskIds(pending);
}

function clearPendingTaskIds(ids: Iterable<string>): void {
  const pending = readPendingTaskIds();
  let changed = false;
  for (const id of ids) {
    if (pending.delete(id)) changed = true;
  }
  if (changed) writePendingTaskIds(pending);
}

const REMOTE_LOAD_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Storage request timed out")), ms);
    }),
  ]);
}

function notifyTasksUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("tempo-tasks-updated"));
}

/**
 * Merge a remote snapshot into the local cache without clobbering optimistic writes.
 * Keeps local-only tasks only while they still have a pending (unconfirmed) write;
 * any other local-only task is a true orphan and is dropped so the device converges
 * on the server instead of hoarding rows that will never sync.
 *
 * @internal exported for tests
 */
export function mergeRemoteTasks(
  local: Task[] | null | undefined,
  remote: Task[],
  pendingIds: ReadonlySet<string> = new Set(),
): Task[] {
  if (!local || local.length === 0) return remote;
  const localById = new Map(local.map((t) => [t.id, t]));
  const remoteIds = new Set(remote.map((t) => t.id));

  const merged = remote.map((remoteTask) => {
    const localTask = localById.get(remoteTask.id);
    if (!localTask) return remoteTask;

    if (localTask.completed !== remoteTask.completed) {
      const localAt = localTask.completedAt ?? 0;
      const remoteAt = remoteTask.completedAt ?? 0;
      // Local complete with a timestamp at least as new as remote → keep local.
      if (localTask.completed && localAt >= remoteAt) return localTask;
      // Local un-complete while remote still shows an older completion → keep local.
      if (!localTask.completed && localAt >= remoteAt) return localTask;
    }

    // Prefer local title/order/subtasks if the rest matches completion — remote wins otherwise.
    return remoteTask;
  });

  for (const localTask of local) {
    if (remoteIds.has(localTask.id)) continue;
    if (pendingIds.has(localTask.id)) merged.push(localTask);
  }
  return merged;
}

/** Clear all cache keys (call on logout). */
export function clearOfflineCache(): void {
  clearPendingStorageSyncs();
  if (!isBrowser()) return;
  Object.values(CACHE_KEYS).forEach((k) => localStorage.removeItem(k));
  try {
    localStorage.removeItem(PENDING_TASKS_KEY);
    localStorage.removeItem(CACHE_OWNER_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

/** True when a previous session left tasks (or projects) in the offline cache. */
export function hasOfflineCache(): boolean {
  return cacheHas(CACHE_KEYS.tasks) || cacheHas(CACHE_KEYS.projects);
}

export class CachedSupabaseAdapter implements StorageAdapter {
  constructor(private remote: StorageAdapter) {}

  private refreshingTasks = false;
  private refreshingProjects = false;
  private refreshingTaskViewPrefs = false;
  private refreshingOneThing = false;
  private refreshingCustomQuote = false;
  /** In-flight task writes — background refresh must not clobber these. */
  private pendingTaskWrites = 0;
  /** Guards the one-shot retry of writes stranded by a previous session. */
  private pendingFlushStarted = false;

  /**
   * Drop cached account data when a different user takes over the browser.
   * Cache keys are shared across accounts, so without this a stale snapshot
   * from a previous session could leak into a new one.
   */
  async ensureAccountScope(): Promise<void> {
    const remote = this.remote as StorageAdapter & { getUserIdForCache?: () => Promise<string> };
    if (typeof remote.getUserIdForCache !== "function") return;
    let userId: string;
    try {
      userId = await remote.getUserIdForCache();
    } catch {
      // No session yet (cold start) — scope is validated on the next activation.
      return;
    }
    const owner = cacheGet<string>(CACHE_OWNER_KEY);
    if (owner && owner !== userId) {
      this.clearLocalCache();
    }
    if (owner !== userId) cacheSet(CACHE_OWNER_KEY, userId);
  }

  private clearLocalCache(): void {
    if (!isBrowser()) return;
    Object.values(CACHE_KEYS).forEach((k) => localStorage.removeItem(k));
    try {
      localStorage.removeItem(PENDING_TASKS_KEY);
    } catch {
      /* ignore quota / private mode */
    }
  }

  /**
   * Re-push task writes persisted as pending but never confirmed (e.g. the tab
   * was closed while offline). Clears the marker only once the server confirms,
   * so a write is never silently lost.
   */
  async flushPersistedPendingTasks(): Promise<void> {
    const pending = readPendingTaskIds();
    if (pending.size === 0) return;
    const cached = cacheGet<Task[]>(CACHE_KEYS.tasks) ?? [];
    const byId = new Map(cached.map((t) => [t.id, t]));
    for (const id of Array.from(pending)) {
      const task = byId.get(id);
      if (!task) {
        // Task was deleted locally — drop the stale marker.
        clearPendingTaskIds([id]);
        continue;
      }
      try {
        await this.remote.saveTask(task);
        clearPendingTaskIds([id]);
      } catch (err) {
        if (isLikelyOffline() || isQueueableSyncError(err)) {
          enqueuePendingWrite(PENDING_TASKS_LABEL, async () => {
            await this.remote.saveTask(task);
            clearPendingTaskIds([id]);
          });
          break;
        }
        reportError("Persisted pending task sync failed", err);
        break;
      }
    }
  }

  // ── Settings ──────────────────────────────────────────

  async loadSettings(): Promise<Settings> {
    if (cacheHas(CACHE_KEYS.settings)) {
      const cached = cacheGet<Settings>(CACHE_KEYS.settings) ?? DEFAULT_SETTINGS;
      void withTimeout(this.remote.loadSettings(), REMOTE_LOAD_TIMEOUT_MS)
        .then((result) => cacheSet(CACHE_KEYS.settings, result))
        .catch((err) => reportError("Background cache refresh failed", err, { backgroundRefresh: true }));
      return cached;
    }

    try {
      const result = await withTimeout(this.remote.loadSettings(), REMOTE_LOAD_TIMEOUT_MS);
      cacheSet(CACHE_KEYS.settings, result);
      return result;
    } catch (err) {
      reportError("Remote load failed", err, { usingCache: true });
      return cacheGet<Settings>(CACHE_KEYS.settings) ?? DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    const localOk = cacheSet(CACHE_KEYS.settings, settings);
    await syncOrKeepLocal("settings", () => this.remote.saveSettings(settings), localOk);
  }

  // ── Daily Goal ────────────────────────────────────────

  async loadDailyGoalData(dailyGoal: number): Promise<DailyGoalData> {
    const fallback = (): DailyGoalData =>
      cacheGet<DailyGoalData>(CACHE_KEYS.dailyGoal) ?? {
        date: new Date().toISOString().slice(0, 10),
        sessionCount: 0,
        streak: 0,
        lastStreakUpdate: null,
      };

    if (cacheHas(CACHE_KEYS.dailyGoal)) {
      const cached = fallback();
      void withTimeout(this.remote.loadDailyGoalData(dailyGoal), REMOTE_LOAD_TIMEOUT_MS)
        .then((result) => cacheSet(CACHE_KEYS.dailyGoal, result))
        .catch((err) => reportError("Background cache refresh failed", err, { backgroundRefresh: true }));
      return cached;
    }

    try {
      const result = await withTimeout(
        this.remote.loadDailyGoalData(dailyGoal),
        REMOTE_LOAD_TIMEOUT_MS,
      );
      cacheSet(CACHE_KEYS.dailyGoal, result);
      return result;
    } catch (err) {
      reportError("Remote load failed", err, { usingCache: true });
      return fallback();
    }
  }

  async saveDailyGoalData(data: DailyGoalData): Promise<void> {
    const localOk = cacheSet(CACHE_KEYS.dailyGoal, data);
    await syncOrKeepLocal("daily goal", () => this.remote.saveDailyGoalData(data), localOk);
  }

  // ── Streak History ────────────────────────────────────

  async loadStreakHistory(): Promise<StreakHistory> {
    if (cacheHas(CACHE_KEYS.streakHistory)) {
      const cached = cacheGet<StreakHistory>(CACHE_KEYS.streakHistory) ?? { days: {} };
      void withTimeout(this.remote.loadStreakHistory(), REMOTE_LOAD_TIMEOUT_MS)
        .then((result) => cacheSet(CACHE_KEYS.streakHistory, result))
        .catch((err) => reportError("Background cache refresh failed", err, { backgroundRefresh: true }));
      return cached;
    }

    try {
      const result = await withTimeout(this.remote.loadStreakHistory(), REMOTE_LOAD_TIMEOUT_MS);
      cacheSet(CACHE_KEYS.streakHistory, result);
      return result;
    } catch (err) {
      reportError("Remote load failed", err, { usingCache: true });
      return cacheGet<StreakHistory>(CACHE_KEYS.streakHistory) ?? { days: {} };
    }
  }

  async saveStreakHistory(history: StreakHistory): Promise<void> {
    const localOk = cacheSet(CACHE_KEYS.streakHistory, history);
    await syncOrKeepLocal("streak history", () => this.remote.saveStreakHistory(history), localOk);
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
    const localOk = cacheSet(CACHE_KEYS.streakHistory, cached);

    await syncOrKeepLocal(
      "day completion",
      () => this.remote.recordDayCompletion(date, sessionCount, goalMet),
      localOk,
    );
  }

  // ── Tasks ─────────────────────────────────────────────

  async loadTasks(): Promise<Task[]> {
    // Retry writes stranded by a previous session (e.g. closed while offline).
    if (!this.pendingFlushStarted && !isLikelyOffline()) {
      this.pendingFlushStarted = true;
      void this.flushPersistedPendingTasks();
    }

    // Cache-first: paint immediately for returning users, refresh in background.
    if (cacheHas(CACHE_KEYS.tasks)) {
      const cached = cacheGet<Task[]>(CACHE_KEYS.tasks) ?? [];
      if (!this.refreshingTasks) {
        this.refreshingTasks = true;
        void withTimeout(this.remote.loadTasks(), REMOTE_LOAD_TIMEOUT_MS)
          .then((result) => {
            // Don't apply a stale snapshot over optimistic completes / quick-adds.
            if (this.pendingTaskWrites > 0) return;
            const prev = cacheGet<Task[]>(CACHE_KEYS.tasks);
            const merged = mergeRemoteTasks(prev, result, readPendingTaskIds());
            cacheSet(CACHE_KEYS.tasks, merged);
            if (JSON.stringify(prev) !== JSON.stringify(merged)) {
              notifyTasksUpdated();
            }
          })
          .catch((err) => reportError("Background cache refresh failed", err, { backgroundRefresh: true }))
          .finally(() => {
            this.refreshingTasks = false;
          });
      }
      return cached;
    }

    try {
      const result = await withTimeout(this.remote.loadTasks(), REMOTE_LOAD_TIMEOUT_MS);
      cacheSet(CACHE_KEYS.tasks, result);
      return result;
    } catch (err) {
      reportError("Remote load failed", err, { usingCache: true });
      return cacheGet<Task[]>(CACHE_KEYS.tasks) ?? [];
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    const localOk = cacheSet(CACHE_KEYS.tasks, tasks);
    const ids = tasks.map((t) => t.id);
    // Mark before the write so an interrupted sync is retried after a reload.
    markPendingTaskIds(ids);
    this.pendingTaskWrites += 1;
    try {
      const synced = await syncOrKeepLocal("tasks", () => this.remote.saveTasks(tasks), localOk);
      if (synced) clearPendingTaskIds(ids);
    } finally {
      this.pendingTaskWrites = Math.max(0, this.pendingTaskWrites - 1);
    }
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
    const localOk = cacheSet(CACHE_KEYS.tasks, cached);
    // Mark before the write so an interrupted sync is retried after a reload.
    markPendingTaskIds([task.id]);

    this.pendingTaskWrites += 1;
    try {
      const synced = await syncOrKeepLocal("task", () => this.remote.saveTask(task), localOk);
      if (synced) clearPendingTaskIds([task.id]);
    } finally {
      this.pendingTaskWrites = Math.max(0, this.pendingTaskWrites - 1);
    }
  }

  async deleteTask(id: string): Promise<void> {
    const cached = cacheGet<Task[]>(CACHE_KEYS.tasks) ?? [];
    const localOk = cacheSet(CACHE_KEYS.tasks, cached.filter((t) => t.id !== id));
    clearPendingTaskIds([id]);

    await syncOrKeepLocal("task delete", () => this.remote.deleteTask(id), localOk);
  }

  async deleteTasks(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const cached = cacheGet<Task[]>(CACHE_KEYS.tasks) ?? [];
    const localOk = cacheSet(CACHE_KEYS.tasks, cached.filter((t) => !idSet.has(t.id)));
    clearPendingTaskIds(ids);

    await syncOrKeepLocal("task deletes", () => this.remote.deleteTasks(ids), localOk);
  }

  // ── Projects ──────────────────────────────────────────

  async loadProjects(): Promise<Project[]> {
    if (cacheHas(CACHE_KEYS.projects)) {
      const cached = cacheGet<Project[]>(CACHE_KEYS.projects);
      const painted = cached && cached.length > 0 ? cached : [DEFAULT_PROJECT];
      if (!this.refreshingProjects) {
        this.refreshingProjects = true;
        void withTimeout(this.remote.loadProjects(), REMOTE_LOAD_TIMEOUT_MS)
          .then((result) => {
            const prev = cacheGet<Project[]>(CACHE_KEYS.projects);
            cacheSet(CACHE_KEYS.projects, result);
            if (JSON.stringify(prev) !== JSON.stringify(result)) {
              notifyTasksUpdated();
            }
          })
          .catch((err) => reportError("Background cache refresh failed", err, { backgroundRefresh: true }))
          .finally(() => {
            this.refreshingProjects = false;
          });
      }
      return painted;
    }

    try {
      const result = await withTimeout(this.remote.loadProjects(), REMOTE_LOAD_TIMEOUT_MS);
      cacheSet(CACHE_KEYS.projects, result);
      return result;
    } catch {
      const cached = cacheGet<Project[]>(CACHE_KEYS.projects);
      if (cached && cached.length > 0) return cached;
      return [DEFAULT_PROJECT];
    }
  }

  async saveProjects(projects: Project[]): Promise<void> {
    const localOk = cacheSet(CACHE_KEYS.projects, projects);
    await syncOrKeepLocal("projects", () => this.remote.saveProjects(projects), localOk);
  }

  async deleteProject(id: string): Promise<void> {
    const cached = cacheGet<Project[]>(CACHE_KEYS.projects) ?? [];
    const localOk = cacheSet(CACHE_KEYS.projects, cached.filter((p) => p.id !== id));

    await syncOrKeepLocal("project delete", () => this.remote.deleteProject(id), localOk);
  }

  async loadSelectedProjectId(): Promise<string> {
    if (cacheHas(CACHE_KEYS.selectedProject)) {
      return cacheGet<string>(CACHE_KEYS.selectedProject) ?? ALL_PROJECTS_ID;
    }
    try {
      const result = await this.remote.loadSelectedProjectId();
      cacheSet(CACHE_KEYS.selectedProject, result);
      return result;
    } catch (err) {
      reportError("Remote load failed", err, { usingCache: true });
      return cacheGet<string>(CACHE_KEYS.selectedProject) ?? ALL_PROJECTS_ID;
    }
  }

  async saveSelectedProjectId(id: string): Promise<void> {
    const localOk = cacheSet(CACHE_KEYS.selectedProject, id);
    await syncOrKeepLocal("selected project", () => this.remote.saveSelectedProjectId(id), localOk);
  }

  async loadTaskViewPreferences(): Promise<TaskViewPreferences> {
    if (cacheHas(CACHE_KEYS.taskViewPrefs)) {
      const cached =
        cacheGet<TaskViewPreferences>(CACHE_KEYS.taskViewPrefs) ?? {
          ...DEFAULT_TASK_VIEW_PREFERENCES,
        };
      if (!this.refreshingTaskViewPrefs) {
        this.refreshingTaskViewPrefs = true;
        void this.remote
          .loadTaskViewPreferences()
          .then((result) => cacheSet(CACHE_KEYS.taskViewPrefs, result))
          .catch((err) => reportError("Background cache refresh failed", err, { backgroundRefresh: true }))
          .finally(() => {
            this.refreshingTaskViewPrefs = false;
          });
      }
      return cached;
    }

    try {
      const result = await this.remote.loadTaskViewPreferences();
      cacheSet(CACHE_KEYS.taskViewPrefs, result);
      return result;
    } catch (err) {
      reportError("Remote load failed", err, { usingCache: true });
      return cacheGet<TaskViewPreferences>(CACHE_KEYS.taskViewPrefs) ?? { ...DEFAULT_TASK_VIEW_PREFERENCES };
    }
  }

  async saveTaskViewPreferences(prefs: Partial<TaskViewPreferences>): Promise<void> {
    const current = cacheGet<TaskViewPreferences>(CACHE_KEYS.taskViewPrefs) ?? { ...DEFAULT_TASK_VIEW_PREFERENCES };
    const merged = { ...current, ...prefs };
    const localOk = cacheSet(CACHE_KEYS.taskViewPrefs, merged);
    await syncOrKeepLocal("task view prefs", () => this.remote.saveTaskViewPreferences(prefs), localOk);
  }

  async loadOneThing(): Promise<OneThingPreference | null> {
    if (cacheHas(CACHE_KEYS.oneThing)) {
      const cached = cacheGet<OneThingPreference | null>(CACHE_KEYS.oneThing) ?? null;
      if (!this.refreshingOneThing) {
        this.refreshingOneThing = true;
        void this.remote
          .loadOneThing()
          .then((result) => cacheSet(CACHE_KEYS.oneThing, result))
          .catch((err) => reportError("Background cache refresh failed", err, { backgroundRefresh: true }))
          .finally(() => {
            this.refreshingOneThing = false;
          });
      }
      return cached;
    }

    try {
      const result = await this.remote.loadOneThing();
      cacheSet(CACHE_KEYS.oneThing, result);
      return result;
    } catch (err) {
      reportError("Remote load failed", err, { usingCache: true });
      return cacheGet<OneThingPreference | null>(CACHE_KEYS.oneThing) ?? null;
    }
  }

  async saveOneThing(pref: OneThingPreference | null): Promise<void> {
    const localOk = cacheSet(CACHE_KEYS.oneThing, pref);
    await syncOrKeepLocal("one thing", () => this.remote.saveOneThing(pref), localOk);
  }

  async loadCustomQuote(): Promise<string | null> {
    if (cacheHas(CACHE_KEYS.customQuote)) {
      const cached = cacheGet<string | null>(CACHE_KEYS.customQuote) ?? null;
      if (!this.refreshingCustomQuote) {
        this.refreshingCustomQuote = true;
        void this.remote
          .loadCustomQuote()
          .then((result) => cacheSet(CACHE_KEYS.customQuote, result))
          .catch((err) => reportError("Background cache refresh failed", err, { backgroundRefresh: true }))
          .finally(() => {
            this.refreshingCustomQuote = false;
          });
      }
      return cached;
    }

    try {
      const result = await this.remote.loadCustomQuote();
      cacheSet(CACHE_KEYS.customQuote, result);
      return result;
    } catch (err) {
      reportError("Remote load failed", err, { usingCache: true });
      return cacheGet<string | null>(CACHE_KEYS.customQuote) ?? null;
    }
  }

  async saveCustomQuote(quote: string | null): Promise<void> {
    const localOk = cacheSet(CACHE_KEYS.customQuote, quote);
    await syncOrKeepLocal("custom quote", () => this.remote.saveCustomQuote(quote), localOk);
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

  subscribeSharedProjectTasks(
    projectId: string,
    ownerId: string,
    onChange: () => void,
    onStatus?: (status: "subscribed" | "fallback") => void,
  ): () => void {
    return this.remote.subscribeSharedProjectTasks(projectId, ownerId, onChange, onStatus);
  }

  async updateSharedTask(task: Task, ownerId: string): Promise<void> {
    return this.remote.updateSharedTask(task, ownerId);
  }

  async insertSharedTask(task: Task, ownerId: string): Promise<void> {
    return this.remote.insertSharedTask(task, ownerId);
  }

  async leaveProject(projectId: string, ownerId: string): Promise<void> {
    return this.remote.leaveProject(projectId, ownerId);
  }

  async leaveSharedAccount(ownerId: string): Promise<void> {
    return this.remote.leaveSharedAccount(ownerId);
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
