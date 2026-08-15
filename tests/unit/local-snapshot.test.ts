import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hasLocalWorkspaceSnapshot,
  readLocalWorkspaceSnapshot,
} from "@/lib/storage/local-snapshot";

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
}

describe("local-snapshot", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(readLocalWorkspaceSnapshot()).toBeNull();
    expect(hasLocalWorkspaceSnapshot()).toBe(false);
  });

  it("reads signed-in offline cache first", () => {
    localStorage.setItem(
      "foci_cache_tasks",
      JSON.stringify([
        {
          id: "t1",
          title: "Cached task",
          completed: false,
          sessions: 0,
          timeSpent: 0,
          createdAt: 1,
          projectId: "__general__",
          subtasks: [],
        },
      ]),
    );
    localStorage.setItem(
      "foci_cache_projects",
      JSON.stringify([{ id: "__general__", name: "General", color: "#3b82f6", order: 0 }]),
    );

    expect(hasLocalWorkspaceSnapshot()).toBe(true);
    const snap = readLocalWorkspaceSnapshot();
    expect(snap?.source).toBe("cache");
    expect(snap?.tasks).toHaveLength(1);
    expect(snap?.tasks[0]?.title).toBe("Cached task");
  });

  it("falls back to guest keys", () => {
    localStorage.setItem(
      "foci_tasks",
      JSON.stringify([
        {
          id: "g1",
          title: "Guest task",
          completed: false,
          sessions: 0,
          timeSpent: 0,
          createdAt: 1,
          subtasks: [],
        },
      ]),
    );

    const snap = readLocalWorkspaceSnapshot();
    expect(snap?.source).toBe("guest");
    expect(snap?.tasks[0]?.title).toBe("Guest task");
    expect(snap?.tasks[0]?.projectId).toBe("__general__");
  });
});
