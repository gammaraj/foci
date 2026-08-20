import Link from "next/link";
import type { Metadata } from "next";
import { FociDot } from "@/components/FociDot";
import { absolutePageTitle } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: absolutePageTitle("Page Not Found"),
  description: "The page you're looking for doesn't exist. Head back to Foci to start focusing.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0f1a] px-4 text-center">
      <FociDot mood="lost" size={80} className="mb-5" />
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg max-w-md">
        Dot looked everywhere — this page isn&apos;t in Foci.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/app"
          className="btn-primary px-5 py-2.5 text-sm"
        >
          Try Foci — free
        </Link>
        <Link
          href="/blog"
          className="btn-chip px-5 py-2.5 text-sm"
        >
          Read the Blog
        </Link>
        <Link
          href="/"
          className="btn-ghost px-5 py-2.5 text-sm"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
