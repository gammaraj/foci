"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import UserMenu from "@/components/UserMenu";
import { FociLogoMark, FociWordmark, FOCI_LOGO_SHADOW } from "@/components/FociLogoMark";

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

type NavLink = {
  key: string;
  href: string;
  label: string;
  active: boolean;
  onClick?: (e: React.MouseEvent) => void;
};

function navLinkClass(active: boolean, mobile = false) {
  if (mobile) {
    return active
      ? "px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
      : "px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white";
  }
  return active
    ? "text-base font-medium transition-colors text-slate-900 dark:text-white"
    : "text-base font-medium transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
}

function NavbarContent({ onOpenSettings, toolbarSlot }: NavbarProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const projectsOpen = pathname === "/app" && searchParams.get("projects") === "1";

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

  const openProjects = (e: React.MouseEvent) => {
    if (pathname === "/app") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("foci-open-project-menu"));
    }
  };

  const closeProjectsIfOpen = (e: React.MouseEvent) => {
    if (pathname === "/app" && projectsOpen) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("foci-close-project-menu"));
    }
  };

  const navLinks: NavLink[] = user
    ? [
        {
          key: "tasks",
          href: "/app",
          label: "My Tasks",
          active: pathname === "/app" && !projectsOpen,
          onClick: closeProjectsIfOpen,
        },
        { key: "stats", href: "/stats", label: "Stats", active: pathname === "/stats" },
        {
          key: "projects",
          href: "/app?projects=1",
          label: "Projects",
          active: projectsOpen,
          onClick: openProjects,
        },
        { key: "blog", href: "/blog", label: "Blog", active: pathname.startsWith("/blog") },
      ]
    : [
        { key: "try", href: "/app", label: "Try Foci", active: pathname === "/app" },
        { key: "stats", href: "/stats", label: "Stats", active: pathname === "/stats" },
        { key: "blog", href: "/blog", label: "Blog", active: pathname.startsWith("/blog") },
      ];

  const logoHref = user ? "/app" : "/";

  const renderNavLink = (link: NavLink, mobile = false) => (
    <Link
      key={link.key}
      href={link.href}
      onClick={(e) => {
        link.onClick?.(e);
        if (mobile) setMenuOpen(false);
      }}
      className={navLinkClass(link.active, mobile)}
      aria-current={link.active ? "page" : undefined}
    >
      {link.label}
    </Link>
  );

  return (
    <nav className="relative z-10 px-4 sm:px-6 py-3 sm:py-4 max-w-[1280px] mx-auto w-full safe-top">
      <div className="flex items-center justify-between">
        <Link href={logoHref} className="flex items-center gap-2.5">
          <FociLogoMark
            size={36}
            idPrefix="nav"
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${FOCI_LOGO_SHADOW}`}
          />
          <FociWordmark className="text-lg sm:text-xl font-bold" />
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => renderNavLink(link))}
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

        <div className="flex sm:hidden items-center gap-0.5">
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
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors touch-target-sm"
            aria-label={`Theme: ${theme}. Click to change.`}
          >
            {themeIcon}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target-sm"
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
        </div>
      </div>

      {menuOpen && (
        <div className="sm:hidden mt-3 pb-3 border-t border-slate-200 dark:border-slate-700">
          {toolbarSlot && (
            <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
              {toolbarSlot}
            </div>
          )}
          <div className="flex flex-col gap-1 pt-3">
            {navLinks.map((link) => renderNavLink(link, true))}
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

export default function Navbar(props: NavbarProps) {
  return (
    <Suspense fallback={<nav className="relative z-10 px-4 sm:px-6 py-3 sm:py-4 max-w-[1280px] mx-auto w-full safe-top" aria-hidden />}>
      <NavbarContent {...props} />
    </Suspense>
  );
}
