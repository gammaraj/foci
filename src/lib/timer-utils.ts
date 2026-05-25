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
