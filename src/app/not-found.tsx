import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist. Head back to Foci to start focusing.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0f1a] px-4 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/app"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
        >
          Open Foci App
        </Link>
        <Link
          href="/blog"
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Read the Blog
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 font-medium text-sm hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
