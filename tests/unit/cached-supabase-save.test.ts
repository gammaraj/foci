import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StorageAdapter } from "@/lib/storage/types";
import type { Task } from "@/lib/types";

vi.mock("@/lib/report-error", () => ({
  reportError: vi.fn(),
}));

const task: Task = {
  id: "t-new",
  title: "Buy milk",
  completed: false,
  sessions: 0,
  timeSpent: 0,
  createdAt: 1,
  projectId: "__general__",
  subtasks: [],
};

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
  Object.defineProperty(globalThis, "localStorage", {
    value: memory,
    configurable: true,
  });
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    configurable: true,
  });
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true },
    configurable: true,
  });
}

describe("CachedSupabaseAdapter saveTask", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(async () => {
    const { clearPendingStorageSyncs } = await import("@/lib/storage/cached-supabase");
    clearPendingStorageSyncs();
  });

  it("keeps the local task and does not throw when the remote fetch is aborted", async () => {
    const { CachedSupabaseAdapter } = await import("@/lib/storage/cached-supabase");
    const abort = new DOMException("The user aborted a request", "AbortError");
    const saveTask = vi.fn().mockRejectedValue(abort);
    const adapter = new CachedSupabaseAdapter({ saveTask } as unknown as StorageAdapter);

    await expect(adapter.saveTask(task)).resolves.toBeUndefined();

    const cached = JSON.parse(localStorage.getItem("foci_cache_tasks") ?? "[]") as Task[];
    expect(cached).toEqual(expect.arrayContaining([expect.objectContaining({ id: "t-new", title: "Buy milk" })]));
    expect(saveTask).toHaveBeenCalledOnce();
  });

  it("retries the queued write after a short delay", async () => {
    const { CachedSupabaseAdapter, flushPendingStorageSyncs } = await import(
      "@/lib/storage/cached-supabase"
    );
    const saveTask = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(undefined);
    const adapter = new CachedSupabaseAdapter({ saveTask } as unknown as StorageAdapter);

    await adapter.saveTask(task);
    expect(saveTask).toHaveBeenCalledTimes(1);

    await flushPendingStorageSyncs();

    expect(saveTask).toHaveBeenCalledTimes(2);
  });

  it("still throws for non-transient remote errors", async () => {
    const { CachedSupabaseAdapter } = await import("@/lib/storage/cached-supabase");
    const saveTask = vi
      .fn()
      .mockRejectedValue(new Error("new row violates row-level security policy"));
    const adapter = new CachedSupabaseAdapter({ saveTask } as unknown as StorageAdapter);

    await expect(adapter.saveTask(task)).rejects.toThrow(/row-level security/);
  });
});
