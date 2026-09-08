/** Transient network / auth-hydration failures that should retry instead of failing the UI. */

function errorName(error: unknown): string {
  if (error && typeof error === "object" && "name" in error) {
    return String(error.name);
  }
  return "";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? "");
}

export function isTransientSyncError(error: unknown): boolean {
  const name = errorName(error);
  if (name === "AbortError" || name === "TimeoutError" || name === "NetworkError") {
    return true;
  }

  const m = errorMessage(error).toLowerCase();
  return (
    m.includes("connection timeout") ||
    m.includes("upstream connect error") ||
    m.includes("disconnect/reset") ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("load failed") ||
    m.includes("timed out") ||
    m.includes("timeout") ||
    m.includes("fetch failed") ||
    m.includes("abort") ||
    m.includes("503") ||
    m.includes("502") ||
    m.includes("504")
  );
}

/**
 * Errors where the local cache already has the write, so we should not toast
 * "changes may be lost". Includes session-not-ready on mobile cache-first paint.
 */
export function isQueueableSyncError(error: unknown): boolean {
  if (isTransientSyncError(error)) return true;
  const m = errorMessage(error).toLowerCase();
  return (
    m.includes("not authenticated") ||
    m.includes("jwt") ||
    m.includes("invalid claim") ||
    m.includes("401") ||
    m.includes("unauthorized")
  );
}
