import { describe, it, expect } from "vitest";
import { clampWorkMinutes, clampWorkSeconds, formatTimerDisplay, formatTimerTabTitle, getTimerStatusAnnouncement, getTimerTabLabel, isTimerTabTitle, nudgeWorkSeconds, parseDurationInput, parseQueryDurationMinutes } from "@/lib/timer-utils";

describe("timer-utils", () => {
  it("formatTimerDisplay formats mm:ss", () => {
    expect(formatTimerDisplay(125_000)).toBe("02:05");
    expect(formatTimerDisplay(3_600_000)).toBe("60:00");
  });

  it("clampWorkMinutes stays within 0–120", () => {
    expect(clampWorkMinutes(0)).toBe(0);
    expect(clampWorkMinutes(30.4)).toBe(30);
    expect(clampWorkMinutes(200)).toBe(120);
    expect(clampWorkMinutes(Number.NaN)).toBe(30);
  });

  it("clampWorkSeconds allows sub-minute sessions", () => {
    expect(clampWorkSeconds(0)).toBe(1);
    expect(clampWorkSeconds(30)).toBe(30);
    expect(clampWorkSeconds(120 * 60 + 10)).toBe(120 * 60);
  });

  it("parseDurationInput accepts minutes, mm:ss, and seconds suffix", () => {
    expect(parseDurationInput("25")).toBe(25 * 60);
    expect(parseDurationInput("0:30")).toBe(30);
    expect(parseDurationInput("00:45")).toBe(45);
    expect(parseDurationInput("30s")).toBe(30);
    expect(parseDurationInput("1:05")).toBe(65);
    expect(parseDurationInput("")).toBeNull();
  });

  it("nudgeWorkSeconds uses 15s steps at or below one minute", () => {
    expect(nudgeWorkSeconds(30, -1)).toBe(15);
    expect(nudgeWorkSeconds(45, 1)).toBe(60);
    expect(nudgeWorkSeconds(60, 1)).toBe(6 * 60);
    expect(nudgeWorkSeconds(5 * 60, -1)).toBe(60);
  });

  it("getTimerStatusAnnouncement returns labels for key states", () => {
    expect(getTimerStatusAnnouncement("running", false)).toBe("Focus timer started");
    expect(getTimerStatusAnnouncement("paused", false)).toBe("Focus timer paused");
    expect(getTimerStatusAnnouncement("break", true)).toBe("Break time started");
    expect(getTimerStatusAnnouncement("idle", false)).toBe("Focus session reset");
  });

  it("formats a countdown-first tab title while the timer is on", () => {
    expect(getTimerTabLabel("running")).toBe("Focus");
    expect(getTimerTabLabel("paused")).toBe("Paused");
    expect(getTimerTabLabel("break")).toBe("Break");
    expect(getTimerTabLabel("idle")).toBeNull();
    expect(formatTimerTabTitle("29:58", "Focus")).toBe("29:58 · Focus");
    expect(isTimerTabTitle("29:58 · Focus")).toBe(true);
    expect(isTimerTabTitle("Foci App — Free Pomodoro Timer, Tasks & Sounds")).toBe(false);
  });

  it("parseQueryDurationMinutes accepts 1–180 minute deep-link values", () => {
    expect(parseQueryDurationMinutes("25")).toBe(25);
    expect(parseQueryDurationMinutes("180")).toBe(180);
    expect(parseQueryDurationMinutes("0")).toBeNull();
    expect(parseQueryDurationMinutes("181")).toBeNull();
    expect(parseQueryDurationMinutes("")).toBeNull();
    expect(parseQueryDurationMinutes(undefined)).toBeNull();
  });
});
