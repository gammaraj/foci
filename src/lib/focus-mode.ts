const FOCUS_MODE_AUTO_KEY = "foci_focus_mode_auto";
const START_TIMER_ON_FOCUS_KEY = "foci_start_timer_on_focus";

export function getFocusModeAuto(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FOCUS_MODE_AUTO_KEY) === "true";
}

export function setFocusModeAuto(enabled: boolean): void {
  localStorage.setItem(FOCUS_MODE_AUTO_KEY, enabled ? "true" : "false");
}

/** When true (default), clicking Focus on a task also starts the timer. */
export function getStartTimerOnFocus(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(START_TIMER_ON_FOCUS_KEY) !== "false";
}

export function setStartTimerOnFocus(enabled: boolean): void {
  localStorage.setItem(START_TIMER_ON_FOCUS_KEY, enabled ? "true" : "false");
}
