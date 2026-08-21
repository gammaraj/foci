import { describe, it, expect } from "vitest";
import {
  buildAppHref,
  isExactTasksAppPath,
  isTasksAppPath,
  parseTaskViewFromPath,
  taskViewFromSegment,
  taskViewSegment,
} from "@/lib/task-view-url";

describe("task-view-url", () => {
  it("maps path segments to modes", () => {
    expect(taskViewFromSegment("cards")).toBe("card");
    expect(taskViewFromSegment("buckets")).toBe("bucket");
    expect(taskViewFromSegment("plan")).toBe("plan");
    expect(taskViewFromSegment("nope")).toBeNull();
  });

  it("maps modes to path segments", () => {
    expect(taskViewSegment("card")).toBe("cards");
    expect(taskViewSegment("bucket")).toBe("buckets");
  });

  it("parses layout from pathname", () => {
    expect(parseTaskViewFromPath("/app")).toBeNull();
    expect(parseTaskViewFromPath("/app/cards")).toBe("card");
    expect(parseTaskViewFromPath("/app/plan")).toBe("plan");
    expect(parseTaskViewFromPath("/app/plan/extra")).toBe("plan");
    expect(parseTaskViewFromPath("/stats")).toBeNull();
  });

  it("builds hrefs with query params", () => {
    expect(buildAppHref("plan", "")).toBe("/app/plan");
    expect(buildAppHref("card", "projects=1")).toBe("/app/cards?projects=1");
    expect(
      buildAppHref("list", "", (p) => {
        p.set("project", "abc");
        p.set("from", "card");
      }),
    ).toBe("/app/list?project=abc&from=card");
    expect(buildAppHref(null, "projects=1")).toBe("/app?projects=1");
  });

  it("detects tasks app paths", () => {
    expect(isTasksAppPath("/app")).toBe(true);
    expect(isTasksAppPath("/app/cards")).toBe(true);
    expect(isTasksAppPath("/app/cards/1")).toBe(true);
    expect(isTasksAppPath("/stats")).toBe(false);
  });

  it("detects exact tasks app paths (no junk segments)", () => {
    expect(isExactTasksAppPath("/app")).toBe(true);
    expect(isExactTasksAppPath("/app/cards")).toBe(true);
    expect(isExactTasksAppPath("/app/plan")).toBe(true);
    expect(isExactTasksAppPath("/app/cards/1")).toBe(false);
    expect(isExactTasksAppPath("/app/nope")).toBe(false);
    expect(isExactTasksAppPath("/stats")).toBe(false);
  });
});
