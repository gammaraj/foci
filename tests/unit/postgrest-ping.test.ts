import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pingPostgrest } from "@/lib/postgrest-ping";

describe("pingPostgrest", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns ok on first successful response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("[]", { status: 200 })) as unknown as typeof fetch;

    const result = await pingPostgrest(3);

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures then succeeds", async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("nope", { status: 503 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 })) as unknown as typeof fetch;

    const pending = pingPostgrest(3);
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("returns degraded after exhausting retries", async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("down", { status: 503 })) as unknown as typeof fetch;

    const pending = pingPostgrest(3);
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.ok).toBe(false);
    expect(result.error).toBe("http_503");
    expect(result.attempts).toBe(3);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });
});
