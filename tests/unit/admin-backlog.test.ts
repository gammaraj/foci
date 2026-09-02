import { describe, expect, it } from "vitest";
import {
  BACKLOG_ITEMS,
  PRODUCT_GOALS,
  activeBacklogItems,
  backlogCounts,
  goalCounts,
  isActiveBacklogStatus,
} from "@/lib/admin-backlog";
import { safeNextPath } from "@/lib/safe-next-path";

describe("admin backlog", () => {
  it("has unique ids on goals and items", () => {
    const goalIds = PRODUCT_GOALS.map((g) => g.id);
    const itemIds = BACKLOG_ITEMS.map((i) => i.id);
    expect(new Set(goalIds).size).toBe(goalIds.length);
    expect(new Set(itemIds).size).toBe(itemIds.length);
  });

  it("treats core product goals as achieved", () => {
    const achieved = new Set(
      PRODUCT_GOALS.filter((g) => g.status === "achieved").map((g) => g.id),
    );
    expect(achieved.has("core-workspace")).toBe(true);
    expect(achieved.has("guest-and-sync")).toBe(true);
    expect(achieved.has("ads-policy")).toBe(true);
  });

  it("keeps sharing partial and Pro / growth open", () => {
    expect(PRODUCT_GOALS.find((g) => g.id === "sharing")?.status).toBe("partial");
    expect(PRODUCT_GOALS.find((g) => g.id === "optional-pro")?.status).toBe("open");
    expect(PRODUCT_GOALS.find((g) => g.id === "growth-target")?.status).toBe("open");
  });

  it("tracks the real remaining work", () => {
    const ids = new Set(BACKLOG_ITEMS.map((i) => i.id));
    expect(ids.has("invite-email")).toBe(true);
    expect(ids.has("realtime-shared")).toBe(true);
    expect(ids.has("collab-e2e")).toBe(true);
    expect(ids.has("stripe-pricing")).toBe(true);
    expect(BACKLOG_ITEMS.find((i) => i.id === "invite-email")?.status).toBe("blocked");
    expect(BACKLOG_ITEMS.find((i) => i.id === "realtime-shared")?.status).toBe("done");
    expect(BACKLOG_ITEMS.find((i) => i.id === "editor-create-tasks")?.status).toBe("done");
    expect(BACKLOG_ITEMS.find((i) => i.id === "rls-live-ci")?.status).toBe("done");
    expect(BACKLOG_ITEMS.find((i) => i.id === "collab-doc-hygiene")?.status).toBe("done");
    expect(BACKLOG_ITEMS.find((i) => i.id === "ads-in-app")?.status).toBe("wont");
    expect(BACKLOG_ITEMS.find((i) => i.id === "team-workspaces")?.status).toBe("wont");
  });

  it("counts active items as todo + blocked only", () => {
    const counts = backlogCounts();
    const goals = goalCounts();
    expect(activeBacklogItems().every((i) => isActiveBacklogStatus(i.status))).toBe(true);
    expect(counts.active).toBe(BACKLOG_ITEMS.filter((i) => i.status === "todo" || i.status === "blocked").length);
    expect(goals.total).toBe(PRODUCT_GOALS.length);
    expect(goals.achieved + goals.partial + goals.open).toBe(goals.total);
  });
});

describe("safeNextPath admin backlog", () => {
  it("allows the backlog path after login", () => {
    expect(safeNextPath("/admin/backlog")).toBe("/admin/backlog");
    expect(safeNextPath("/admin/analytics")).toBe("/admin/analytics");
  });
});
