import type { Metadata } from "next";
import AppNavbar from "@/components/AppNavbar";
import AdminSubnav from "@/components/admin/AdminSubnav";
import { requireAdmin } from "@/lib/admin-guard";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg,#e3ebf7)] dark:bg-[#070b16] text-slate-800 dark:text-slate-100">
      <AppNavbar />
      <AdminSubnav email={user.email ?? ""} />
      {children}
    </div>
  );
}
