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

  it("sends a wrapper named after the Foci message so AbortError is not dropped", async () => {
    const { reportError } = await import("@/lib/report-error");
    const err = new Error("boom");

    reportError("Failed to load data", err, { userId: "u1" });

    expect(captureException).toHaveBeenCalledOnce();
    const [sentError, options] = captureException.mock.calls[0]!;
    expect(sentError).toBeInstanceOf(Error);
    expect((sentError as Error).message).toBe("Failed to load data");
    expect((sentError as Error).cause).toBe(err);
    expect(options.extra).toMatchObject({
      message: "Failed to load data",
      userId: "u1",
      originalErrorName: "Error",
      originalErrorMessage: "boom",
    });
  });

  it("wraps AbortError so Sentry issue title is the Foci message", async () => {
    const { reportError } = await import("@/lib/report-error");
    const err = new DOMException("The user aborted a request", "AbortError");

    reportError("Failed to save tasks", err);

    const [sentError, options] = captureException.mock.calls[0]!;
    expect((sentError as Error).message).toBe("Failed to save tasks");
    expect((sentError as Error).cause).toBe(err);
    expect(options.extra).toMatchObject({
      originalErrorName: "AbortError",
      originalErrorMessage: "The user aborted a request",
    });
  });

  it("wraps non-Error values before sending to Sentry", async () => {
    const { reportError } = await import("@/lib/report-error");

    reportError("Supabase saveTasks error", { code: "23505" });

    expect(captureException).toHaveBeenCalledOnce();
    const [sentError, options] = captureException.mock.calls[0]!;
    expect(sentError).toBeInstanceOf(Error);
    expect((sentError as Error).message).toBe("Supabase saveTasks error");
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
