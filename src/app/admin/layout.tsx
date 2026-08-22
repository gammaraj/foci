import AppNavbar from "@/components/AppNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg,#e3ebf7)] dark:bg-[#070b16] text-slate-800 dark:text-slate-100">
      <AppNavbar />
      {children}
    </div>
  );
}
