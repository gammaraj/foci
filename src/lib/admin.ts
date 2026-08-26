/** Owner / operator allowlist for /admin (client + server safe — emails only).
 *  Keep in sync with public.admin_list_users() in supabase/migrations. */
export const ADMIN_EMAILS = ["gangabathina@gmail.com"] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
}
