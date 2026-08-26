import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ALARM_SOUNDS,
  DEFAULT_ALARM_SOUND,
  getTimerAlarmEnabled,
  getTimerAlarmSound,
  isAlarmSoundId,
  setTimerAlarmEnabled,
  setTimerAlarmSound,
} from "@/lib/timer-alarm";

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

describe("timer-alarm prefs", () => {
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("sessionStorage", sessionStorage);
    vi.stubGlobal("window", { localStorage, sessionStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to enabled digital", () => {
    expect(getTimerAlarmEnabled()).toBe(true);
    expect(getTimerAlarmSound()).toBe("digital");
    expect(DEFAULT_ALARM_SOUND).toBe("digital");
  });

  it("persists enabled and sound in session storage", () => {
    setTimerAlarmEnabled(false);
    setTimerAlarmSound("soft");
    expect(getTimerAlarmEnabled()).toBe(false);
    expect(getTimerAlarmSound()).toBe("soft");
    expect(sessionStorage.getItem("foci_timer_alarm_sound")).toBe("soft");
    expect(localStorage.getItem("foci_timer_alarm_sound")).toBeNull();
  });

  it("rejects unknown sound ids", () => {
    expect(isAlarmSoundId("chime")).toBe(true);
    expect(isAlarmSoundId("digital")).toBe(true);
    expect(isAlarmSoundId("trombone")).toBe(false);
    expect(ALARM_SOUNDS.map((s) => s.id)).toContain("bell");
  });
});
