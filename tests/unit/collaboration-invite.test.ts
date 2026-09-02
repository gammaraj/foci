import { describe, expect, it } from "vitest";
import { buildAccountInviteMessage, buildProjectInviteMessage } from "@/lib/collaboration-invite";

describe("collaboration invite copy", () => {
  it("labels editor vs viewer access on project invites", () => {
    const editor = buildProjectInviteMessage({
      projectName: "Work",
      inviteeEmail: "a@example.com",
      role: "editor",
    });
    const viewer = buildProjectInviteMessage({
      projectName: "Work",
      inviteeEmail: "a@example.com",
      role: "viewer",
    });
    expect(editor).toContain("can edit");
    expect(viewer).toContain("view only");
  });

  it("labels editor vs viewer access on account invites", () => {
    const editor = buildAccountInviteMessage({
      inviteeEmail: "a@example.com",
      role: "editor",
    });
    expect(editor).toContain("can edit");
    expect(editor).toContain("all current and future projects");
  });
});
