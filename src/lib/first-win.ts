/** Guest “first win” — completed a focus session or a task without an account. */

export const FIRST_TASK_KEY = "foci_first_task_completed";
export const FIRST_WIN_DISMISS_KEY = "foci_first_win_dismissed";
export const FIRST_WIN_EVENT = "foci-first-win";

export function hasCompletedFocusSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    localStorage.getItem("foci_sessions_completed") ||
      localStorage.getItem("tempo_sessions_completed"),
  );
}

export function hasCompletedFirstTask(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(FIRST_TASK_KEY));
}

export function hasFirstWin(): boolean {
  return hasCompletedFocusSession() || hasCompletedFirstTask();
}

export function markFirstTaskCompleted(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(FIRST_TASK_KEY)) return;
  localStorage.setItem(FIRST_TASK_KEY, "1");
  window.dispatchEvent(new Event(FIRST_WIN_EVENT));
}

export function hasDismissedFirstWin(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    localStorage.getItem(FIRST_WIN_DISMISS_KEY) ||
      sessionStorage.getItem("foci_signup_dismissed"),
  );
}

export function dismissFirstWin(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FIRST_WIN_DISMISS_KEY, "1");
  sessionStorage.setItem("foci_signup_dismissed", "1");
}
