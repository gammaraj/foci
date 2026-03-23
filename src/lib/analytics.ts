// Thin wrapper around gtag so callers don't need to guard against undefined.
// All calls are no-ops if GA is not loaded (e.g. blocked by ad-blocker).

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function track(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

// ── Timer ────────────────────────────────────────────────────────────────────

export function trackTimerStart(durationMs: number) {
  track("timer_start", { duration_seconds: Math.round(durationMs / 1000) });
}

export function trackTimerPause(elapsedMs: number) {
  track("timer_pause", { elapsed_seconds: Math.round(elapsedMs / 1000) });
}

export function trackTimerReset() {
  track("timer_reset");
}

export function trackSessionComplete(sessionCount: number, goalMet: boolean) {
  track("session_complete", { session_count: sessionCount, goal_met: goalMet });
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export function trackTaskAdded() {
  track("task_added");
}

export function trackTaskCompleted(timeSpentMs: number) {
  track("task_completed", { time_spent_seconds: Math.round(timeSpentMs / 1000) });
}

export function trackTaskDeleted() {
  track("task_deleted");
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export function trackSignUp(method: "email" | "google") {
  track("sign_up", { method });
}

export function trackLogin(method: "email" | "google") {
  track("login", { method });
}

// ── Ambient sounds ───────────────────────────────────────────────────────────

export function trackSoundPlayed(sound: string) {
  track("ambient_sound_played", { sound });
}

export function trackSoundStopped(sound: string) {
  track("ambient_sound_stopped", { sound });
}
