"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import UserMenu from "@/components/UserMenu";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-5xl mx-auto w-full">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-900 dark:bg-neutral-800">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" className="sm:w-5 sm:h-5">
            <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" fill="none"/>
            <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="81.7" strokeDashoffset="20.4" strokeLinecap="round" transform="rotate(-90 16 16)"/>
            <path d="M18 6L12 17h5l-2 10 8-13h-6l3-8z" fill="white"/>
          </svg>
        </div>
        <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">Tempo</span>
      </Link>
      <div className="flex items-center gap-3 sm:gap-6">
        <Link
          href={user ? "/app" : "/login"}
          className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          My Tasks
        </Link>
        <Link
          href="/blog"
          className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Blog
        </Link>
        {user ? (
          <UserMenu />
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
