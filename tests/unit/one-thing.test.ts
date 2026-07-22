import { describe, expect, it } from "vitest";
import {
  canBeOneThing,
  parseOneThingPreference,
  resolveOneThing,
} from "@/lib/one-thing";
import type { Task } from "@/lib/types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Ship feature",
    completed: false,
    sessions: 0,
    timeSpent: 0,
    createdAt: 1,
    projectId: "p1",
    ...overrides,
  };
}

describe("one-thing", () => {
  it("parses valid preference", () => {
    expect(parseOneThingPreference({ taskId: "abc", date: "2026-07-21" })).toEqual({
      taskId: "abc",
      date: "2026-07-21",
    });
    expect(parseOneThingPreference({ taskId: "abc", date: "bad" })).toBeNull();
    expect(parseOneThingPreference(null)).toBeNull();
  });

  it("only allows actionable open tasks", () => {
    expect(canBeOneThing(makeTask())).toBe(true);
    expect(canBeOneThing(makeTask({ completed: true }))).toBe(false);
    expect(canBeOneThing(makeTask({ blocked: true }))).toBe(false);
    expect(canBeOneThing(makeTask({ someday: true }))).toBe(false);
    expect(canBeOneThing(makeTask({ archivedAt: 1 }))).toBe(false);
  });

  it("resolves active, done, and unset states", () => {
    const today = "2026-07-21";
    const open = makeTask({ id: "t1" });
    const done = makeTask({ id: "t2", completed: true });

    expect(resolveOneThing({ taskId: "t1", date: today }, [open], today).status).toBe("active");
    expect(resolveOneThing({ taskId: "t2", date: today }, [done], today).status).toBe("done");
    expect(resolveOneThing({ taskId: "t1", date: "2026-07-20" }, [open], today).status).toBe("unset");
    expect(resolveOneThing({ taskId: "missing", date: today }, [open], today).status).toBe("unset");
    expect(
      resolveOneThing({ taskId: "t1", date: today }, [makeTask({ id: "t1", archivedAt: 9 })], today)
        .status,
    ).toBe("unset");
  });
});
