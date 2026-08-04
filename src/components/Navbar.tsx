"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
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
  /** Extra actions shown before theme toggle (e.g. collaboration invites on /app). */
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
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
};

function navLinkClass(active: boolean, mobile = false) {
  if (mobile) {
    return active
      ? "nav-chrome-link-active px-3 py-2.5 rounded-lg text-base transition-colors text-left w-full"
      : "nav-chrome-link px-3 py-2.5 rounded-lg text-base transition-colors text-left w-full";
  }
  return active
    ? "nav-chrome-link-active text-[0.9375rem] transition-colors"
    : "nav-chrome-link text-[0.9375rem] transition-colors";
}

const chromeBtn = "nav-chrome-btn rounded-lg";
const chromeBtnPad = `${chromeBtn} p-2`;
const chromeBtnSettings = `${chromeBtn} flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.9375rem]`;

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
          label: "Tasks",
          active: pathname === "/app" && !projectsOpen,
          onClick: closeProjectsIfOpen,
        },
        { key: "stats", href: "/stats", label: "Stats", active: pathname === "/stats" },
        {
          key: "projects",
          href: "/app?projects=1",
          label: "Projects",
          title: "Manage projects — pin, rename, share, import",
          active: projectsOpen,
          onClick: openProjects,
        },
      ]
    : [
        { key: "features", href: "/#features", label: "Features", active: false },
        { key: "blog", href: "/blog", label: "Blog", active: pathname.startsWith("/blog") },
        { key: "about", href: "/about", label: "About", active: pathname === "/about" },
      ];

  const logoHref = user ? "/app" : "/";

  const goHomeCards = (e: React.MouseEvent) => {
    if (!user) return;
    if (pathname === "/app") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("foci-go-home-cards"));
      setMenuOpen(false);
      return;
    }
    // Navigating to /app from another page — ask TaskList to land on cards.
    try {
      sessionStorage.setItem("foci-go-home-cards", "1");
    } catch {
      /* ignore */
    }
  };

  const renderNavLink = (link: NavLink, mobile = false) => (
    <Link
      key={link.key}
      href={link.href}
      title={link.title}
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
      <nav className="relative app-container pb-2.5 sm:pb-3">
        <div className="relative flex items-center gap-2.5 sm:gap-4 min-h-[2.75rem]">
          <Link
            href={logoHref}
            onClick={goHomeCards}
            className="group flex items-center gap-2.5 min-w-0 flex-shrink-0"
            title={user ? "Cards view" : "Foci home"}
            aria-label={user ? "Foci — go to Cards view" : "Foci home"}
          >
            <FociLogoMark
              size={36}
              idPrefix="nav"
              surface={logoSurface}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-[0.65rem] flex-shrink-0 transition-transform duration-200 group-hover:scale-[1.03]"
            />
            <div className="flex flex-col items-start gap-0.5 min-w-0">
              <FociWordmark className={FOCI_WORDMARK_NAV} tone={wordmarkTone} />
              {/* Logged-in: brand rhythm. Logged-out: omit so the hero owns the value prop. */}
              {user ? (
                <p className={`${FOCI_TAGLINE_NAV} ${taglineClass} whitespace-nowrap`}>
                  {FOCI_TAGLINE_FOCUS}
                </p>
              ) : null}
            </div>
          </Link>

          {centerSlot ? (
            <div className="hidden sm:flex flex-1 min-w-0 items-center justify-center px-1 sm:px-2">
              {centerSlot}
            </div>
          ) : (
            <div className="hidden sm:block flex-1 min-w-0" aria-hidden />
          )}

          <div className="hidden sm:flex items-center gap-1 flex-shrink-0 ml-auto">
            <div className="flex items-center gap-0.5">
              {navLinks.map((link) => renderNavLink(link))}
            </div>
            <span className="nav-chrome-divider w-px h-4 mx-2 rounded-full self-center" aria-hidden />
            <div className="flex items-center gap-0.5">
              {toolbarSlot}
              <ThemeToggle className={chromeBtnPad} />
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className={chromeBtnSettings}
                  aria-label="Open settings"
                  title="Timer and app settings"
                >
                  <SettingsIcon className="w-4 h-4 opacity-80" />
                  <span>Settings</span>
                </button>
              )}
            </div>
            {user ? (
              <div className="ml-1.5">
                <UserMenu />
              </div>
            ) : (
              <Link
                href="/login"
                className="nav-chrome-login ml-2 text-sm px-4 py-2 rounded-xl transition-colors"
              >
                Log in
              </Link>
            )}
          </div>

          <div className="flex sm:hidden items-center gap-0.5 ml-auto">
            <ThemeToggle className={`${chromeBtnPad} touch-target-sm`} />
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
                  className="nav-chrome-login mx-3 mt-2 text-sm font-semibold text-center px-4 py-2.5 rounded-xl transition-colors"
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
