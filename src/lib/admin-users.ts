export const ADMIN_ACTIVE_WITHIN_DAYS = 30;
export const ADMIN_RECENT_WITHIN_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export type AdminUserRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  last_sign_in_at: string | null;
  created_at: string | null;
  task_count: number;
  streak: number;
};

export function isActiveAdminUser(lastSignInAt: string | null, now = Date.now()): boolean {
  if (!lastSignInAt) return false;
  const t = Date.parse(lastSignInAt);
  return Number.isFinite(t) && now - t <= ADMIN_ACTIVE_WITHIN_DAYS * DAY_MS;
}

export function isRecentAdminUser(lastSignInAt: string | null, now = Date.now()): boolean {
  if (!lastSignInAt) return false;
  const t = Date.parse(lastSignInAt);
  return Number.isFinite(t) && now - t <= ADMIN_RECENT_WITHIN_DAYS * DAY_MS;
}

export function formatAdminSignIn(iso: string | null, now = Date.now()): string {
  if (!iso) return "Never";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "Never";
  const delta = Math.max(0, now - t);
  if (delta < 60_000) return "Just now";
  const minutes = Math.round(delta / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function summarizeAdminUsers(users: AdminUserRow[], now = Date.now()) {
  return {
    total: users.length,
    last7d: users.filter((u) => isRecentAdminUser(u.last_sign_in_at, now)).length,
    last30d: users.filter((u) => isActiveAdminUser(u.last_sign_in_at, now)).length,
  };
}
