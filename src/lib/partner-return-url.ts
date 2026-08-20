/** Allowlisted https origins for inbound partner return_url query params. */
export function safePartnerReturnUrl(
  raw: string | undefined | null,
  allowedOrigins: readonly string[],
): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (!allowedOrigins.includes(url.origin)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
