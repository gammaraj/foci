import {
  formatAdminSignIn,
  isActiveAdminUser,
  summarizeAdminUsers,
  type AdminUserRow,
} from "@/lib/admin-users";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
        {value.toLocaleString("en-US")}
      </p>
    </div>
  );
}

export function AdminUsersPanel({
  users,
  error,
}: {
  users: AdminUserRow[];
  error: string | null;
}) {
  const summary = summarizeAdminUsers(users);

  return (
    <section aria-labelledby="admin-users-heading" className="space-y-3">
      <div>
        <h2 id="admin-users-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
          Active users
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Signed-in Foci accounts. Active means last sign-in within 30 days.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Couldn’t load users. Apply the <code className="font-mono">admin_list_users</code> migration
          if this is a new environment. {error}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-2">
            <Stat label="Accounts" value={summary.total} />
            <Stat label="Signed in 7d" value={summary.last7d} />
            <Stat label="Active 30d" value={summary.last30d} />
          </div>

          {users.length === 0 ? (
            <p className="text-sm text-slate-400">No accounts yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-slate-200 dark:border-[#243350] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">User</th>
                    <th className="px-3 py-2.5 font-semibold">Last sign-in</th>
                    <th className="px-3 py-2.5 font-semibold">Joined</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Tasks</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const active = isActiveAdminUser(user.last_sign_in_at);
                    return (
                      <tr
                        key={user.user_id}
                        className="border-b border-slate-100 dark:border-[#1a2740] last:border-0"
                      >
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {user.display_name || user.email || "Unknown"}
                          </p>
                          {user.display_name && user.email ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-slate-700 dark:text-slate-300">
                            {formatAdminSignIn(user.last_sign_in_at)}
                          </span>
                          {active ? (
                            <span className="ml-2 inline-flex rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                              Active
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatAdminSignIn(user.created_at)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {user.task_count}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {user.streak}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
