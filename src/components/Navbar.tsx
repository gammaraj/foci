"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import UserMenu from "@/components/UserMenu";
import { FociLogoMark, FociWordmark } from "@/components/FociLogoMark";
import {
  FOCI_TAGLINE_FOCUS,
  FOCI_TAGLINE_NAV,
  FOCI_TAGLINE_ON_DARK,
  FOCI_TAGLINE_ON_LIGHT,
  FOCI_WORDMARK_NAV,
} from "@/lib/logo-brand";
interface NavbarProps {
  /** When set (e.g. on /app), shows a settings button in the nav bar. */
  onOpenSettings?: () => void;
  /** Extra actions shown before theme toggle (e.g. invites, notifications on /app). */
  toolbarSlot?: ReactNode;
  /** Optional center content between logo and nav links (kept empty by default — promo belongs outside the task workspace). */
  centerSlot?: ReactNode;
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
      ? "nav-chrome-link-active px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full bg-slate-100 dark:bg-white/10"
      : "nav-chrome-link px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full hover:bg-slate-100 dark:hover:bg-white/5";
  }
  return active
    ? "nav-chrome-link-active text-sm font-semibold transition-colors"
    : "nav-chrome-link text-sm font-medium transition-colors";
}

const chromeBtn = "nav-chrome-btn rounded-lg";
const chromeBtnPad = `${chromeBtn} p-2`;
const chromeBtnSettings = `${chromeBtn} flex items-center gap-1.5 px-2.5 py-2 border border-transparent hover:border-slate-200 dark:hover:border-white/10`;

function NavbarContent({ onOpenSettings, toolbarSlot, centerSlot }: NavbarProps) {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLight = resolvedTheme === "light";
  const logoSurface = isLight ? "light" : "dark";
  const wordmarkTone = isLight ? "light" : "dark";
  const taglineClass = isLight ? FOCI_TAGLINE_ON_LIGHT : FOCI_TAGLINE_ON_DARK;

  const projectsOpen = pathname === "/app" && searchParams.get("projects") === "1";

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
      ]
    : [
        { key: "try", href: "/app", label: "Try Foci", active: pathname === "/app" },
        { key: "stats", href: "/stats", label: "Stats", active: pathname === "/stats" },
        { key: "blog", href: "/blog", label: "Blog", active: pathname.startsWith("/blog") },
        { key: "about", href: "/about", label: "About", active: pathname === "/about" },
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
    <header className="nav-chrome sticky top-0 z-30">
      <nav className="relative app-container pb-2 sm:pb-2.5">
        <div className="relative flex items-center gap-3 min-h-[2.5rem]">
          <Link href={logoHref} className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
            <FociLogoMark
              size={36}
              idPrefix="nav"
              surface={logoSurface}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex-shrink-0"
            />
            <div className="flex flex-col items-start gap-1 min-w-0">
              <FociWordmark className={FOCI_WORDMARK_NAV} tone={wordmarkTone} />
              <p className={`${FOCI_TAGLINE_NAV} ${taglineClass} whitespace-nowrap`}>
                {FOCI_TAGLINE_FOCUS}
              </p>
            </div>
          </Link>

          {centerSlot ? (
            <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center px-3">
              {centerSlot}
            </div>
          ) : (
            <div className="hidden lg:block flex-1 min-w-0" aria-hidden />
          )}

          <div className="hidden sm:flex items-center gap-6 flex-shrink-0 ml-auto">
            {navLinks.map((link) => renderNavLink(link))}
            {(toolbarSlot || onOpenSettings) && (
              <span className="nav-chrome-divider w-px h-5 rounded-full self-center" aria-hidden />
            )}
            <div className="flex items-center gap-0.5">
              {toolbarSlot}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className={chromeBtnSettings}
                  aria-label="Open settings"
                  title="Timer and app settings"
                >
                  <SettingsIcon className="w-[18px] h-[18px]" />
                  <span className="text-sm font-medium">Settings</span>
                </button>
              )}
            </div>
            {user ? (
              <UserMenu />
            ) : (
              <Link
                href="/login"
                className="nav-chrome-login text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Log in
              </Link>
            )}
          </div>

          <div className="flex sm:hidden items-center gap-0.5 ml-auto">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className={`${chromeBtnPad} touch-target-sm`}
                aria-label="Open settings"
                title="Settings"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`${chromeBtnPad} touch-target-sm`}
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
          <div className="sm:hidden mt-3 pb-1 border-t nav-chrome-menu">
            {toolbarSlot && (
              <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b nav-chrome-menu">
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium nav-chrome-link hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left w-full"
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
                  className="nav-chrome-login mx-3 mt-1 text-sm font-medium text-center px-4 py-2 rounded-lg transition-colors"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default function Navbar(props: NavbarProps) {
  return (
    <Suspense
      fallback={
        <header className="nav-chrome sticky top-0 z-30" aria-hidden>
          <nav className="app-container pb-3 h-14" />
        </header>
      }
    >
      <NavbarContent {...props} />
    </Suspense>
  );
}
