export const ONBOARDING_STORAGE_KEY = "foci_onboarding_done";
export const ONBOARDING_LEGACY_STORAGE_KEY = "tempo_onboarding_done";
export const ONBOARDING_START_EVENT = "foci-start-onboarding";

export function startOnboardingTour(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  localStorage.removeItem(ONBOARDING_LEGACY_STORAGE_KEY);
  window.dispatchEvent(new Event(ONBOARDING_START_EVENT));
}
