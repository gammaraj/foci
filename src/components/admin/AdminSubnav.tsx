"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeBacklogItems } from "@/lib/admin-backlog";
import { ADMIN_SHELL } from "@/components/admin/admin-shell";

const LINKS = [
  { href: "/admin", label: "Dashboard", match: "exact" as const },
  { href: "/admin/backlog", label: "Backlog", match: "prefix" as const },
];

export default function AdminSubnav({ email }: { email: string }) {
  const pathname = usePathname();
  const openCount = activeBacklogItems().length;

  return (
    <div className="border-b border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-[#0c1220]/50">
      <div className={`${ADMIN_SHELL} py-4 flex flex-wrap items-end justify-between gap-3`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Operator
          </p>
          <nav aria-label="Admin sections" className="mt-2 flex flex-wrap gap-1">
            {LINKS.map((link) => {
              const active =
                link.match === "exact" ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                  }`}
                >
                  {link.label}
                  {link.href === "/admin/backlog" && openCount > 0 ? (
                    <span
                      className={`tabular-nums text-[11px] ${
                        active ? "text-white/80 dark:text-slate-600" : "text-slate-400"
                      }`}
                    >
                      {openCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{email}</p>
      </div>
    </div>
  );
}
