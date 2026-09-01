import { beforeEach, describe, expect, it, vi } from "vitest";

const captureException = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  captureException,
}));

describe("reportError", () => {
  beforeEach(() => {
    captureException.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("sends Error instances to Sentry with message context", async () => {
    const { reportError } = await import("@/lib/report-error");
    const err = new Error("boom");

    reportError("Failed to load data", err, { userId: "u1" });

    expect(captureException).toHaveBeenCalledOnce();
    expect(captureException).toHaveBeenCalledWith(err, {
      extra: expect.objectContaining({
        message: "Failed to load data",
        userId: "u1",
      }),
    });
  });

  it("wraps non-Error values before sending to Sentry", async () => {
    const { reportError } = await import("@/lib/report-error");

    reportError("Supabase saveTasks error", { code: "23505" });

    expect(captureException).toHaveBeenCalledOnce();
    const [sentError, options] = captureException.mock.calls[0]!;
    expect(sentError).toBeInstanceOf(Error);
    expect((sentError as Error).message).toContain("23505");
    expect(options.extra).toMatchObject({
      message: "Supabase saveTasks error",
      originalError: { code: "23505" },
    });
  });

  it("creates an exception from message-only reports", async () => {
    const { reportError } = await import("@/lib/report-error");

    reportError("keep-alive ping failed", undefined, { attempts: 3 });

    expect(captureException).toHaveBeenCalledOnce();
    const [sentError] = captureException.mock.calls[0]!;
    expect((sentError as Error).message).toBe("keep-alive ping failed");
  });
});
