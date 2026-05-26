"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import UserMenu from "@/components/UserMenu";

interface NavbarProps {
  /** When set (e.g. on /app), shows a settings button in the nav bar. */
  onOpenSettings?: () => void;
  /** Extra actions shown before theme toggle (e.g. invites, notifications on /app). */
  toolbarSlot?: ReactNode;
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function Navbar({ onOpenSettings, toolbarSlot }: NavbarProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  const themeIcon =
    theme === "light" ? (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ) : theme === "dark" ? (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ) : (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );

  const navLinks = [
    ...(user ? [{ href: "/app", label: "My Tasks" }] : []),
    { href: "/stats", label: "Stats" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <nav className="relative z-10 px-4 sm:px-6 py-3 sm:py-4 max-w-[1280px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-sm" style={{ background: "linear-gradient(135deg, #d97706, #c2410c)", boxShadow: "0 1px 3px rgba(217,119,6,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" className="sm:w-5 sm:h-5">
              <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="18.85 6.28" transform="rotate(-90 16 16)"/>
              <circle cx="16" cy="16" r="7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="11 3.67" transform="rotate(-30 16 16)" opacity="0.6"/>
              <circle cx="16" cy="16" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Foci</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-base font-medium transition-colors ${
                pathname === link.href
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {toolbarSlot}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              aria-label="Open settings"
              title="Timer and app settings"
            >
              <SettingsIcon className="w-[18px] h-[18px]" />
              <span className="hidden md:inline text-sm font-medium">Settings</span>
            </button>
          )}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label={`Theme: ${theme}. Click to change.`}
            title={`Theme: ${theme}`}
          >
            {themeIcon}
          </button>
          {user ? (
            <UserMenu />
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Log in
            </Link>
          )}
        </div>

        {/* Mobile: theme toggle + login/burger */}
        <div className="flex sm:hidden items-center gap-1">
          {toolbarSlot}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors touch-target-sm"
              aria-label="Open settings"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label={`Theme: ${theme}. Click to change.`}
          >
            {themeIcon}
          </button>
          {user ? (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Log in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden mt-3 pb-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col gap-1 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left w-full"
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
            )}
            {user ? (
              <div className="px-3 py-2">
                <UserMenu />
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mx-3 mt-1 text-sm font-medium text-center px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
