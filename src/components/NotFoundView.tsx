import Link from "next/link";
import { BusyBeaver } from "@/components/BusyBeaver";

/** Shared 404 body. `embedded` sits under workspace chrome without a second full-viewport center. */
export function NotFoundView({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      className={
        embedded
          ? "flex flex-col items-center px-4 pt-10 pb-16 sm:pt-14 text-center"
          : "flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0f1a] px-4 text-center"
      }
    >
      <BusyBeaver alt="Busy the Beaver looking lost" size={embedded ? 112 : 140} className="mb-5" priority />
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg max-w-md">
        Busy looked everywhere — this page isn&apos;t in Foci.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/app" className="btn-primary px-5 py-2.5 text-sm">
          {embedded ? "Back to Tasks" : "Try Foci — free"}
        </Link>
        <Link href="/blog" className="btn-chip px-5 py-2.5 text-sm">
          Read the Blog
        </Link>
        <Link href="/" className="btn-ghost px-5 py-2.5 text-sm">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
