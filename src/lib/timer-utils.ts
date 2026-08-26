export const MIN_WORK_SECONDS = 1;
export const MAX_WORK_SECONDS = 120 * 60;
export const MIN_WORK_MINUTES = 0;
export const MAX_WORK_MINUTES = 120;
export const WORK_MINUTE_STEP = 5;
export const WORK_SECOND_STEP = 15;

/** Clamp a work-session length to 1 second–120 minutes. */
export function clampWorkSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return 30 * 60;
  return Math.min(MAX_WORK_SECONDS, Math.max(MIN_WORK_SECONDS, Math.round(seconds)));
}

/** Clamp a whole-minute preset. 0 minutes is allowed when seconds are set separately. */
export function clampWorkMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return 30;
  return Math.min(MAX_WORK_MINUTES, Math.max(MIN_WORK_MINUTES, Math.round(minutes)));
}

/** Step duration: 15s below/at 1 minute, 5 minutes above. */
export function nudgeWorkSeconds(currentSeconds: number, direction: 1 | -1): number {
  const current = clampWorkSeconds(currentSeconds);
  if (direction < 0) {
    if (current <= 60) return clampWorkSeconds(current - WORK_SECOND_STEP);
    const next = current - WORK_MINUTE_STEP * 60;
    return next < 60 ? 60 : next;
  }
  if (current < 60) return clampWorkSeconds(current + WORK_SECOND_STEP);
  return clampWorkSeconds(current + WORK_MINUTE_STEP * 60);
}

/**
 * Parse a duration typed by the user.
 * `25` → 25 minutes, `0:45` / `00:45` / `45s` → 45 seconds.
 */
export function parseDurationInput(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  const secSuffix = trimmed.match(/^(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?$/);
  if (secSuffix) return clampWorkSeconds(Number(secSuffix[1]));

  if (trimmed.includes(":")) {
    const [minPart, secPart] = trimmed.split(":");
    const minutes = Number(minPart || 0);
    const seconds = Number(secPart || 0);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
    if (seconds < 0 || seconds >= 60) return null;
    return clampWorkSeconds(minutes * 60 + seconds);
  }

  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return clampWorkSeconds(n * 60);
}

export function formatWorkDurationAria(totalSeconds: number): string {
  const seconds = clampWorkSeconds(totalSeconds);
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (rest === 0) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  return `${minutes} min ${rest} sec`;
}

/** Format milliseconds as MM:SS for timer display. */
export function formatTimerDisplay(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/** Derive a human-readable timer status label from timer state. */
export function getTimerStatusAnnouncement(
  status: "idle" | "running" | "paused" | "break",
  isBreakMode: boolean,
): string | null {
  if (status === "running" && !isBreakMode) return "Focus timer started";
  if (status === "paused") return "Focus timer paused";
  if (status === "break") return "Break time started";
  if (status === "idle" && isBreakMode) return "Break finished";
  if (status === "idle") return "Focus session reset";
  return null;
}

export type TimerTabLabel = "Focus" | "Paused" | "Break";

/** Short tab label while a session is active. Time goes first so truncated tabs still show the countdown. */
export function getTimerTabLabel(status: string): TimerTabLabel | null {
  if (status === "running") return "Focus";
  if (status === "paused") return "Paused";
  if (status === "break") return "Break";
  return null;
}

export function formatTimerTabTitle(displayTime: string, label: TimerTabLabel): string {
  return `${displayTime} · ${label}`;
}

const TIMER_TAB_TITLE_RE = /^\d{1,3}:\d{2} · (Focus|Paused|Break)$/;

export function isTimerTabTitle(title: string): boolean {
  return TIMER_TAB_TITLE_RE.test(title);
}

/** Parse a query-string duration in minutes (partner deep links). */
export function parseQueryDurationMinutes(duration?: string | null): number | null {
  if (!duration) return null;
  const minutes = parseInt(duration, 10);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) return null;
  return minutes;
}
