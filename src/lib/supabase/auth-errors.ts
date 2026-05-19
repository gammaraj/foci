/** Transient navigator.locks conflicts from Supabase auth (multi-tab, fast navigation). */
export function isAuthLockError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  if (name !== "AbortError") return false;
  return (
    /lock/i.test(message) ||
    message.includes("Lock broken") ||
    message === "The lock request is aborted"
  );
}
