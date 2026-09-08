import { describe, expect, it } from "vitest";
import { isQueueableSyncError, isTransientSyncError } from "@/lib/storage/sync-errors";

describe("isTransientSyncError", () => {
  it("matches AbortError by name even with an empty message", () => {
    const err = new DOMException("", "AbortError");
    expect(isTransientSyncError(err)).toBe(true);
  });

  it("matches Safari and Chromium fetch failures", () => {
    expect(isTransientSyncError(new TypeError("Load failed"))).toBe(true);
    expect(isTransientSyncError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isTransientSyncError(new TypeError("NetworkError when attempting to fetch resource."))).toBe(true);
  });

  it("does not match RLS or validation errors", () => {
    expect(isTransientSyncError(new Error("new row violates row-level security policy"))).toBe(false);
    expect(isTransientSyncError(new Error("duplicate key value violates unique constraint"))).toBe(false);
  });
});

describe("isQueueableSyncError", () => {
  it("includes session-not-ready and JWT failures", () => {
    expect(isQueueableSyncError(new Error("Not authenticated"))).toBe(true);
    expect(isQueueableSyncError(new Error("JWT expired"))).toBe(true);
    expect(isQueueableSyncError(new Error("Invalid JWT"))).toBe(true);
  });

  it("does not queue policy failures", () => {
    expect(isQueueableSyncError(new Error("new row violates row-level security policy"))).toBe(false);
  });
});
