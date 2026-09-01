import { getToday } from "@/lib/dates";
import type { OneThingPreference } from "@/lib/one-thing";
import {
  trackOnboardingCompleted,
  trackOnboardingSkipped,
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed,
} from "@/lib/analytics";

export const ONBOARDING_STORAGE_KEY = "foci_onboarding_done";
export const ONBOARDING_LEGACY_STORAGE_KEY = "tempo_onboarding_done";
export const ONBOARDING_START_EVENT = "foci-start-onboarding";
export const ONBOARDING_CHANGED_EVENT = "foci-onboarding-changed";
export const ONBOARDING_STARTED_AT_KEY = "foci_onboarding_started_at";
export const ONE_THING_CHANGED_EVENT = "foci-one-thing-changed";

/** Core aha: finish a task. One Thing is the shortest path there. */
export const ONBOARDING_STEPS = ["ready", "one-thing", "first-win"] as const;
export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_CHECKLIST: {
  id: OnboardingStepId;
  label: string;
  hint: string;
  target: string;
}[] = [
  {
    id: "ready",
    label: "You're in",
    hint: "Sample tasks are ready — no account needed.",
    target: "#tasks-section",
  },
  {
    id: "one-thing",
    label: "Set Today's One Thing",
    hint: "Open a task, then tap Set as Today's One Thing.",
    target: "[data-tour='one-thing']",
  },
  {
    id: "first-win",
    label: "Finish a task",
    hint: "Tap Done on your One Thing — that's the win.",
    target: "[data-tour='one-thing-done']",
  },
];

export type OnboardingChecks = Record<OnboardingStepId, boolean>;

export function resolveOnboardingChecks(input: {
  oneThingSet: boolean;
  hasFirstWin: boolean;
}): OnboardingChecks {
  return {
    ready: true,
    "one-thing": input.oneThingSet,
    "first-win": input.hasFirstWin,
  };
}

export function isOneThingSetToday(
  pref: OneThingPreference | null | undefined,
  today: string = getToday(),
): boolean {
  return Boolean(pref?.taskId && pref.date === today);
}

export function currentOnboardingStep(checks: OnboardingChecks): OnboardingStepId | "done" {
  for (const id of ONBOARDING_STEPS) {
    if (!checks[id]) return id;
  }
  return "done";
}

export function onboardingElapsedSeconds(startedAt: number, now = Date.now()): number {
  if (!startedAt || startedAt > now) return 0;
  return Math.max(0, Math.round((now - startedAt) / 1000));
}

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    localStorage.getItem(ONBOARDING_STORAGE_KEY) ||
      localStorage.getItem(ONBOARDING_LEGACY_STORAGE_KEY),
  );
}

export function markOnboardingStarted(): number {
  const existing = Number(localStorage.getItem(ONBOARDING_STARTED_AT_KEY) || 0);
  if (existing > 0) return existing;
  const now = Date.now();
  localStorage.setItem(ONBOARDING_STARTED_AT_KEY, String(now));
  trackOnboardingStarted();
  return now;
}

export function markOnboardingStepViewed(step: OnboardingStepId | "done"): void {
  if (step === "done") return;
  trackOnboardingStepViewed(step);
}

export function markOnboardingStepCompleted(step: OnboardingStepId, startedAt: number): void {
  trackOnboardingStepCompleted(step, onboardingElapsedSeconds(startedAt));
}

export function finishOnboarding(startedAt: number): void {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
  trackOnboardingCompleted(onboardingElapsedSeconds(startedAt));
  window.dispatchEvent(new Event(ONBOARDING_CHANGED_EVENT));
}

export function skipOnboarding(step: OnboardingStepId | "done", startedAt: number): void {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
  trackOnboardingSkipped(step === "done" ? "done" : step, onboardingElapsedSeconds(startedAt));
  window.dispatchEvent(new Event(ONBOARDING_CHANGED_EVENT));
}

export function startOnboardingTour(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  localStorage.removeItem(ONBOARDING_LEGACY_STORAGE_KEY);
  localStorage.setItem(ONBOARDING_STARTED_AT_KEY, String(Date.now()));
  window.dispatchEvent(new Event(ONBOARDING_START_EVENT));
  window.dispatchEvent(new Event(ONBOARDING_CHANGED_EVENT));
}

export function notifyOneThingChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ONE_THING_CHANGED_EVENT));
}
