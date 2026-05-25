import { describe, it, expect } from "vitest";
import { formatTimerDisplay, getTimerStatusAnnouncement } from "@/lib/timer-utils";

describe("timer-utils", () => {
  it("formatTimerDisplay formats mm:ss", () => {
    expect(formatTimerDisplay(125_000)).toBe("02:05");
    expect(formatTimerDisplay(3_600_000)).toBe("60:00");
  });

  it("getTimerStatusAnnouncement returns labels for key states", () => {
    expect(getTimerStatusAnnouncement("running", false)).toBe("Focus timer started");
    expect(getTimerStatusAnnouncement("paused", false)).toBe("Focus timer paused");
    expect(getTimerStatusAnnouncement("break", true)).toBe("Break time started");
    expect(getTimerStatusAnnouncement("idle", false)).toBe("Focus session reset");
  });
});
