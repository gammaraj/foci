/**
 * Safe in-app redirect targets after login (open-redirect protection).
 * Allows absolute paths on this origin only — no protocol-relative or external URLs.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/app"): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  // Block auth loops
  if (trimmed === "/login" || trimmed.startsWith("/login?")) return fallback;
  if (trimmed.startsWith("/auth/")) return fallback;
  return trimmed;
}
