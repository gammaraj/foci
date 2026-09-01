import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  currentOnboardingStep,
  isOneThingSetToday,
  onboardingElapsedSeconds,
  resolveOnboardingChecks,
} from "@/lib/onboarding";

describe("onboarding checklist", () => {
  it("pre-checks You're in so the list already has momentum", () => {
    expect(resolveOnboardingChecks({ oneThingSet: false, hasFirstWin: false })).toEqual({
      ready: true,
      "one-thing": false,
      "first-win": false,
    });
  });

  it("treats a guest One Thing pick as already done", () => {
    const checks = resolveOnboardingChecks({ oneThingSet: true, hasFirstWin: false });
    expect(checks["one-thing"]).toBe(true);
    expect(currentOnboardingStep(checks)).toBe("first-win");
  });

  it("reaches the aha when a task is finished", () => {
    const checks = resolveOnboardingChecks({ oneThingSet: true, hasFirstWin: true });
    expect(currentOnboardingStep(checks)).toBe("done");
  });

  it("isOneThingSetToday requires today's date", () => {
    expect(isOneThingSetToday({ taskId: "t1", date: "2026-09-01" }, "2026-09-01")).toBe(true);
    expect(isOneThingSetToday({ taskId: "t1", date: "2026-08-31" }, "2026-09-01")).toBe(false);
    expect(isOneThingSetToday(null, "2026-09-01")).toBe(false);
  });

  it("measures time-to-value in whole seconds", () => {
    expect(onboardingElapsedSeconds(1_000, 4_400)).toBe(3);
    expect(onboardingElapsedSeconds(0, 5_000)).toBe(0);
    expect(onboardingElapsedSeconds(9_000, 1_000)).toBe(0);
  });
});

describe("onboarding persistence", () => {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  const dispatchEvent = vi.fn();

  beforeEach(() => {
    store.clear();
    dispatchEvent.mockReset();
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("Event", class Event {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    });
    vi.stubGlobal("window", { localStorage, dispatchEvent, gtag: undefined });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records skip vs complete against localStorage", async () => {
    const {
      finishOnboarding,
      isOnboardingDone,
      skipOnboarding,
      ONBOARDING_STORAGE_KEY,
    } = await import("@/lib/onboarding");

    expect(isOnboardingDone()).toBe(false);
    skipOnboarding("first-win", Date.now() - 5_000);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("1");
    expect(isOnboardingDone()).toBe(true);

    store.clear();
    finishOnboarding(Date.now() - 12_000);
    expect(isOnboardingDone()).toBe(true);
    expect(dispatchEvent).toHaveBeenCalled();
  });
});
