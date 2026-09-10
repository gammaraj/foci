import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StorageAdapter } from "@/lib/storage/types";
import type { Task } from "@/lib/types";

vi.mock("@/lib/report-error", () => ({
  reportError: vi.fn(),
}));

const CACHE_TASKS = "foci_cache_tasks";
const PENDING_TASKS = "foci_cache_pending_tasks";
const CACHE_OWNER = "foci_cache_owner";

function makeTask(id: string, extra: Partial<Task> = {}): Task {
  return {
    id,
    title: `Task ${id}`,
    completed: false,
    sessions: 0,
    timeSpent: 0,
    createdAt: 1,
    projectId: "__general__",
    subtasks: [],
    ...extra,
  };
}

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const memory = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: memory, configurable: true });
  Object.defineProperty(globalThis, "window", { value: globalThis, configurable: true });
  Object.defineProperty(globalThis, "navigator", { value: { onLine: true }, configurable: true });
}

function readCachedTasks(): Task[] {
  return JSON.parse(localStorage.getItem(CACHE_TASKS) ?? "[]") as Task[];
}

describe("mergeRemoteTasks reconciliation", () => {
  it("drops local-only tasks that have no pending write (true orphans)", async () => {
    const { mergeRemoteTasks } = await import("@/lib/storage/cached-supabase");
    const orphan = makeTask("orphan");
    const synced = makeTask("synced");

    const merged = mergeRemoteTasks([orphan, synced], [synced], new Set());

    expect(merged.map((t) => t.id)).toEqual(["synced"]);
  });

  it("keeps local-only tasks while their write is still pending", async () => {
    const { mergeRemoteTasks } = await import("@/lib/storage/cached-supabase");
    const offlineTask = makeTask("offline");

    const merged = mergeRemoteTasks([offlineTask], [], new Set(["offline"]));

    expect(merged.map((t) => t.id)).toEqual(["offline"]);
  });

  it("still prefers a newer local completion over the remote snapshot", async () => {
    const { mergeRemoteTasks } = await import("@/lib/storage/cached-supabase");
    const local = makeTask("t1", { completed: true, completedAt: 200 });
    const remote = makeTask("t1", { completed: false, completedAt: 100 });

    const merged = mergeRemoteTasks([local], [remote], new Set());

    expect(merged).toHaveLength(1);
    expect(merged[0]!.completed).toBe(true);
  });
});

describe("CachedSupabaseAdapter pending task sync", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(async () => {
    const { clearPendingStorageSyncs } = await import("@/lib/storage/cached-supabase");
    clearPendingStorageSyncs();
  });

  it("persists a pending marker when a save is queued offline", async () => {
    const { CachedSupabaseAdapter } = await import("@/lib/storage/cached-supabase");
    const saveTask = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const adapter = new CachedSupabaseAdapter({ saveTask } as unknown as StorageAdapter);

    await adapter.saveTask(makeTask("t-new"));

    expect(saveTask).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem(PENDING_TASKS) ?? "[]")).toEqual(["t-new"]);
    expect(readCachedTasks().map((t) => t.id)).toContain("t-new");
  });

  it("clears the pending marker once the server confirms a save", async () => {
    const { CachedSupabaseAdapter } = await import("@/lib/storage/cached-supabase");
    const saveTask = vi.fn().mockResolvedValue(undefined);
    const adapter = new CachedSupabaseAdapter({ saveTask } as unknown as StorageAdapter);

    await adapter.saveTask(makeTask("t-new"));

    expect(localStorage.getItem(PENDING_TASKS)).toBeNull();
  });

  it("re-pushes writes stranded by a previous session after a reload", async () => {
    const { CachedSupabaseAdapter } = await import("@/lib/storage/cached-supabase");
    // Simulate a previous session: task cached, marker persisted, write never confirmed.
    localStorage.setItem(CACHE_TASKS, JSON.stringify([makeTask("t-new")]));
    localStorage.setItem(PENDING_TASKS, JSON.stringify(["t-new"]));

    // Fresh adapter (as after a reload) with a healthy connection.
    const saveTask = vi.fn().mockResolvedValue(undefined);
    const adapter = new CachedSupabaseAdapter({ saveTask } as unknown as StorageAdapter);

    await adapter.flushPersistedPendingTasks();

    expect(saveTask).toHaveBeenCalledOnce();
    expect(saveTask.mock.calls[0]![0]).toMatchObject({ id: "t-new" });
    expect(localStorage.getItem(PENDING_TASKS)).toBeNull();
  });

  it("drops the pending marker when the task was deleted locally", async () => {
    const { CachedSupabaseAdapter } = await import("@/lib/storage/cached-supabase");
    localStorage.setItem(CACHE_TASKS, JSON.stringify([]));
    localStorage.setItem(PENDING_TASKS, JSON.stringify(["gone"]));

    const saveTask = vi.fn().mockResolvedValue(undefined);
    const adapter = new CachedSupabaseAdapter({ saveTask } as unknown as StorageAdapter);

    await adapter.flushPersistedPendingTasks();

    expect(saveTask).not.toHaveBeenCalled();
    expect(localStorage.getItem(PENDING_TASKS)).toBeNull();
  });

  it("clears the pending marker when a task is deleted", async () => {
    const { CachedSupabaseAdapter } = await import("@/lib/storage/cached-supabase");
    localStorage.setItem(CACHE_TASKS, JSON.stringify([makeTask("t-del")]));
    localStorage.setItem(PENDING_TASKS, JSON.stringify(["t-del"]));

    const adapter = new CachedSupabaseAdapter({
      deleteTask: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageAdapter);

    await adapter.deleteTask("t-del");

    expect(localStorage.getItem(PENDING_TASKS)).toBeNull();
  });
});

describe("CachedSupabaseAdapter account scoping", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(async () => {
    const { clearPendingStorageSyncs } = await import("@/lib/storage/cached-supabase");
    clearPendingStorageSyncs();
  });

  it("clears a cache left behind by a different account", async () => {
    const { CachedSupabaseAdapter } = await import("@/lib/storage/cached-supabase");
    localStorage.setItem(CACHE_TASKS, JSON.stringify([makeTask("other-user-task")]));
    localStorage.setItem(CACHE_OWNER, JSON.stringify("user-b"));

    const adapter = new CachedSupabaseAdapter({
      getUserIdForCache: async () => "user-a",
    } as unknown as StorageAdapter);

    await adapter.ensureAccountScope();

    expect(localStorage.getItem(CACHE_TASKS)).toBeNull();
    expect(JSON.parse(localStorage.getItem(CACHE_OWNER)!)).toBe("user-a");
  });

  it("keeps the cache when the owner matches", async () => {
    const { CachedSupabaseAdapter } = await import("@/lib/storage/cached-supabase");
    localStorage.setItem(CACHE_TASKS, JSON.stringify([makeTask("mine")]));
    localStorage.setItem(CACHE_OWNER, JSON.stringify("user-a"));

    const adapter = new CachedSupabaseAdapter({
      getUserIdForCache: async () => "user-a",
    } as unknown as StorageAdapter);

    await adapter.ensureAccountScope();

    expect(readCachedTasks().map((t) => t.id)).toEqual(["mine"]);
  });
});

describe("CachedSupabaseAdapter background refresh", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(async () => {
    const { clearPendingStorageSyncs } = await import("@/lib/storage/cached-supabase");
    clearPendingStorageSyncs();
  });

  it("drops a cached orphan after a successful remote refresh", async () => {
    const { CachedSupabaseAdapter } = await import("@/lib/storage/cached-supabase");
    localStorage.setItem(CACHE_TASKS, JSON.stringify([makeTask("orphan")]));

    const adapter = new CachedSupabaseAdapter({
      loadTasks: vi.fn().mockResolvedValue([]),
      saveTask: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageAdapter);

    // Cache-first paint returns the orphan immediately.
    const painted = await adapter.loadTasks();
    expect(painted.map((t) => t.id)).toEqual(["orphan"]);

    // The background refresh then reconciles it away.
    await vi.waitFor(() => {
      expect(readCachedTasks()).toEqual([]);
    });
  });
});
