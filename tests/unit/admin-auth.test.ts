import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/admin";
import { safeNextPath } from "@/lib/safe-next-path";

describe("isAdminEmail", () => {
  it("allows the owner email case-insensitively", () => {
    expect(isAdminEmail("gangabathina@gmail.com")).toBe(true);
    expect(isAdminEmail("Gangabathina@Gmail.com")).toBe(true);
  });

  it("rejects others", () => {
    expect(isAdminEmail("other@example.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail("")).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows in-app paths", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/app/cards")).toBe("/app/cards");
  });

  it("blocks open redirects", () => {
    expect(safeNextPath("//evil.com")).toBe("/app");
    expect(safeNextPath("https://evil.com")).toBe("/app");
    expect(safeNextPath("/\\evil")).toBe("/app");
    expect(safeNextPath("/login")).toBe("/app");
    expect(safeNextPath("/auth/callback")).toBe("/app");
  });
});
