import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dismissFirstWin,
  FIRST_TASK_KEY,
  FIRST_WIN_DISMISS_KEY,
  FIRST_WIN_EVENT,
  hasCompletedFirstTask,
  hasCompletedFocusSession,
  hasDismissedFirstWin,
  hasFirstWin,
  markFirstTaskCompleted,
} from "@/lib/first-win";

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

describe("first-win", () => {
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
  const dispatchEvent = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    dispatchEvent.mockReset();
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("sessionStorage", sessionStorage);
    vi.stubGlobal("Event", class Event {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    });
    vi.stubGlobal("window", {
      localStorage,
      sessionStorage,
      dispatchEvent,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is false until a session or first task is recorded", () => {
    expect(hasFirstWin()).toBe(false);
    expect(hasCompletedFocusSession()).toBe(false);
    expect(hasCompletedFirstTask()).toBe(false);
  });

  it("counts a completed focus session as a win", () => {
    localStorage.setItem("foci_sessions_completed", "1");
    expect(hasCompletedFocusSession()).toBe(true);
    expect(hasFirstWin()).toBe(true);
  });

  it("records the first completed task once and emits an event", () => {
    markFirstTaskCompleted();
    markFirstTaskCompleted();
    expect(localStorage.getItem(FIRST_TASK_KEY)).toBe("1");
    expect(hasCompletedFirstTask()).toBe(true);
    expect(hasFirstWin()).toBe(true);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0][0]).toEqual(expect.objectContaining({ type: FIRST_WIN_EVENT }));
  });

  it("persists dismiss across the first-win banner", () => {
    dismissFirstWin();
    expect(localStorage.getItem(FIRST_WIN_DISMISS_KEY)).toBe("1");
    expect(hasDismissedFirstWin()).toBe(true);
  });
});
