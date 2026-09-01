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

// ── Onboarding (aha = first completed task) ──────────────────────────────────

export function trackOnboardingStarted() {
  track("onboarding_started");
}

export function trackOnboardingStepViewed(step: string) {
  track("onboarding_step_viewed", { step });
}

export function trackOnboardingStepCompleted(step: string, elapsedSeconds: number) {
  track("onboarding_step_completed", { step, elapsed_seconds: elapsedSeconds });
}

export function trackOnboardingSkipped(step: string, elapsedSeconds: number) {
  track("onboarding_skipped", { step, elapsed_seconds: elapsedSeconds });
}

export function trackOnboardingCompleted(elapsedSeconds: number) {
  track("onboarding_completed", { elapsed_seconds: elapsedSeconds });
}

// ── Sharing / collaboration (monetization signals) ───────────────────────────

export function trackShareModalOpened(scope: "project" | "account") {
  track("share_modal_opened", { scope });
}

export function trackInviteSent(params: {
  scope: "project" | "account";
  role: string;
}) {
  track("invite_sent", { scope: params.scope, role: params.role });
}

export function trackCollaboratorAdded(params: {
  scope: "project" | "account";
}) {
  track("collaborator_added", { scope: params.scope });
}

export function trackSharedProjectOpened(params?: { source?: string }) {
  track("shared_project_opened", { source: params?.source ?? "app" });
}

// ── Stats / Pro interest ─────────────────────────────────────────────────────

export function trackStatsViewed(params?: { range_days?: number }) {
  track("stats_viewed", {
    range_days: params?.range_days ?? 7,
  });
}

/** Soft Pro interest — call when /pricing (or equivalent) mounts. */
export function trackPricingViewed() {
  track("pricing_viewed");
}

/** Soft Pro interest — call from upgrade CTAs once they exist. */
export function trackUpgradeClicked(params?: { source?: string }) {
  track("upgrade_clicked", { source: params?.source ?? "unknown" });
}

// ── Ambient sounds ───────────────────────────────────────────────────────────

export function trackSoundPlayed(sound: string) {
  track("ambient_sound_played", { sound });
}

export function trackSoundStopped(sound: string) {
  track("ambient_sound_stopped", { sound });
}

// ── CertStud integration ─────────────────────────────────────────────────────

export function trackCertStudDeepLinkApplied(params: {
  ref?: string;
  certId?: string;
  certCode?: string;
  topic?: string;
  durationMinutes?: number;
}) {
  track("certstud_deep_link_applied", {
    ref: params.ref ?? "",
    cert_id: params.certId ?? "",
    cert_code: params.certCode ?? "",
    topic: params.topic ?? "",
    duration_minutes: params.durationMinutes ?? 0,
  });
}

export function trackCertStudReturnClick(params: {
  ref?: string;
  certId?: string;
  certCode?: string;
  destination: string;
}) {
  track("certstud_return_click", {
    ref: params.ref ?? "",
    cert_id: params.certId ?? "",
    cert_code: params.certCode ?? "",
    destination: params.destination,
  });
}

// ── BoostLogik integration ───────────────────────────────────────────────────

export function trackBoostLogikDeepLinkApplied(params: {
  ref?: string;
  projectId?: string;
  projectName?: string;
  task?: string;
  durationMinutes?: number;
}) {
  track("boostlogik_deep_link_applied", {
    ref: params.ref ?? "",
    project_id: params.projectId ?? "",
    project_name: params.projectName ?? "",
    task: params.task ?? "",
    duration_minutes: params.durationMinutes ?? 0,
  });
}

export function trackBoostLogikReturnClick(params: {
  ref?: string;
  projectId?: string;
  projectName?: string;
  destination: string;
}) {
  track("boostlogik_return_click", {
    ref: params.ref ?? "",
    project_id: params.projectId ?? "",
    project_name: params.projectName ?? "",
    destination: params.destination,
  });
}
