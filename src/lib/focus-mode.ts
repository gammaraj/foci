const FOCUS_MODE_AUTO_KEY = "foci_focus_mode_auto";

export function getFocusModeAuto(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FOCUS_MODE_AUTO_KEY) === "true";
}

export function setFocusModeAuto(enabled: boolean): void {
  localStorage.setItem(FOCUS_MODE_AUTO_KEY, enabled ? "true" : "false");
}
