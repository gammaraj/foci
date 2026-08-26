import { describe, expect, it } from "vitest";
import {
  formatAdminSignIn,
  isActiveAdminUser,
  isRecentAdminUser,
  summarizeAdminUsers,
  type AdminUserRow,
} from "@/lib/admin-users";

const now = Date.parse("2026-08-25T20:00:00.000Z");

function user(partial: Partial<AdminUserRow>): AdminUserRow {
  return {
    user_id: "u1",
    email: "a@example.com",
    display_name: null,
    last_sign_in_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    task_count: 0,
    streak: 0,
    ...partial,
  };
}

describe("admin users", () => {
  it("treats a sign-in within 30 days as active", () => {
    expect(isActiveAdminUser("2026-08-20T00:00:00.000Z", now)).toBe(true);
    expect(isActiveAdminUser("2026-07-01T00:00:00.000Z", now)).toBe(false);
    expect(isActiveAdminUser(null, now)).toBe(false);
  });

  it("treats a sign-in within 7 days as recent", () => {
    expect(isRecentAdminUser("2026-08-22T00:00:00.000Z", now)).toBe(true);
    expect(isRecentAdminUser("2026-08-01T00:00:00.000Z", now)).toBe(false);
  });

  it("formats relative sign-in times", () => {
    expect(formatAdminSignIn(null, now)).toBe("Never");
    expect(formatAdminSignIn("2026-08-25T19:59:30.000Z", now)).toBe("Just now");
    expect(formatAdminSignIn("2026-08-25T18:00:00.000Z", now)).toBe("2h ago");
    expect(formatAdminSignIn("2026-08-23T20:00:00.000Z", now)).toBe("2d ago");
  });

  it("summarizes account and activity counts", () => {
    const summary = summarizeAdminUsers(
      [
        user({ user_id: "a", last_sign_in_at: "2026-08-24T00:00:00.000Z" }),
        user({ user_id: "b", last_sign_in_at: "2026-08-10T00:00:00.000Z" }),
        user({ user_id: "c", last_sign_in_at: "2026-01-01T00:00:00.000Z" }),
        user({ user_id: "d", last_sign_in_at: null }),
      ],
      now,
    );
    expect(summary).toEqual({ total: 4, last7d: 1, last30d: 2 });
  });
});
