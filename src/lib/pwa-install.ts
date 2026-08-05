/** Shared PWA / Add to Home Screen helpers. */

export const FOCI_APP_INSTALL_URL = "https://usefoci.com/app";
export const PWA_INSTALL_OPEN_EVENT = "foci-open-pwa-install";

const SNOOZE_KEY = "foci_pwa_snooze_until";
const LEGACY_DISMISS_KEY = "foci_pwa_dismissed";
const LEGACY_DISMISS_KEY_TEMPO = "tempo_pwa_dismissed";
/** Soft dismiss — ask again after this many days. */
export const PWA_SNOOZE_DAYS = 14;

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let captureStarted = false;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((cb) => cb());
}

/** Call once from the app shell so Chrome’s install event is never missed. */
export function ensureInstallPromptCapture(): void {
  if (typeof window === "undefined" || captureStarted) return;
  captureStarted = true;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    clearPwaInstallSnooze();
    notify();
  });
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function subscribeInstallPrompt(cb: () => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export function consumeDeferredInstallPrompt(): void {
  deferredPrompt = null;
  notify();
}

export function openPwaInstallGuide(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PWA_INSTALL_OPEN_EVENT));
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

/** iPhone / iPad (including iPadOS desktop UA). */
export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as Mac with touch
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Wide viewport and not iOS — show phone QR as a secondary path. */
export function shouldShowInstallQr(): boolean {
  if (typeof window === "undefined") return false;
  if (isIosDevice()) return false;
  return window.matchMedia("(min-width: 768px)").matches;
}

export function hasCompletedFocusSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    localStorage.getItem("foci_sessions_completed") ||
      localStorage.getItem("tempo_sessions_completed"),
  );
}

function migrateLegacyDismiss(): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(LEGACY_DISMISS_KEY) && !localStorage.getItem(LEGACY_DISMISS_KEY_TEMPO)) {
    return;
  }
  // Permanent “Not now” → one soft snooze window, then we can ask again.
  if (!localStorage.getItem(SNOOZE_KEY)) {
    const until = Date.now() + PWA_SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(until));
  }
  localStorage.removeItem(LEGACY_DISMISS_KEY);
  localStorage.removeItem(LEGACY_DISMISS_KEY_TEMPO);
}

export function isPwaInstallSnoozed(): boolean {
  if (typeof window === "undefined") return false;
  migrateLegacyDismiss();
  const raw = localStorage.getItem(SNOOZE_KEY);
  if (!raw) return false;
  const until = Number(raw);
  if (!Number.isFinite(until)) return false;
  if (Date.now() >= until) {
    localStorage.removeItem(SNOOZE_KEY);
    return false;
  }
  return true;
}

export function snoozePwaInstall(days: number = PWA_SNOOZE_DAYS): void {
  if (typeof window === "undefined") return;
  const until = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(SNOOZE_KEY, String(until));
  localStorage.removeItem(LEGACY_DISMISS_KEY);
  localStorage.removeItem(LEGACY_DISMISS_KEY_TEMPO);
}

export function clearPwaInstallSnooze(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SNOOZE_KEY);
  localStorage.removeItem(LEGACY_DISMISS_KEY);
  localStorage.removeItem(LEGACY_DISMISS_KEY_TEMPO);
}

/** Soft in-app nudge after the user has completed a session. */
export function shouldOfferPwaNudge(): boolean {
  if (isStandaloneDisplay()) return false;
  if (isPwaInstallSnoozed()) return false;
  if (!hasCompletedFocusSession()) return false;
  return true;
}
