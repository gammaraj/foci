"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { appViewPath, isExactTasksAppPath, isTasksAppPath } from "@/lib/task-view-url";
interface NavbarProps {
  /** When set (e.g. on /app), shows a settings button in the nav bar. */
  onOpenSettings?: () => void;
  /** App tools (due bell, sharing) — sits with Settings, before theme + avatar. */
  toolbarSlot?: ReactNode;
  /** Optional center content between logo and nav links (clock, weather, partner promo). */
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
  const tone = active ? "nav-chrome-link nav-chrome-link-active" : "nav-chrome-link";
  if (mobile) {
    return `${tone} px-3 py-2.5 rounded-lg text-base transition-colors text-left w-full${
      active ? " bg-blue-500/10 dark:bg-blue-400/10" : ""
    }`;
  }
  return `${tone} text-[0.9375rem] transition-colors`;
}

const chromeIconBtn = "nav-chrome-icon-btn";
const chromeLabelBtn = "nav-chrome-label-btn";

function NavbarContent({ onOpenSettings, toolbarSlot, centerSlot }: NavbarProps) {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isLight = resolvedTheme === "light";
  const logoSurface = isLight ? "light" : "dark";
  const wordmarkTone = isLight ? "light" : "dark";
  const taglineClass = isLight ? FOCI_TAGLINE_ON_LIGHT : FOCI_TAGLINE_ON_DARK;

  const onTasksApp = isTasksAppPath(pathname);
  /** TaskList is mounted only for exact `/app` / `/app/{view}` — not workspace 404 URLs. */
  const onExactTasksApp = isExactTasksAppPath(pathname);
  const projectsOpen = onExactTasksApp && searchParams.get("projects") === "1";
  const cardsHomeHref = appViewPath("card");

  const openProjects = (e: React.MouseEvent) => {
    if (onExactTasksApp) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("foci-open-project-menu"));
    }
    // else: let the Link navigate (e.g. recovering from `/app/cards/1` 404)
  };

  const closeProjectsIfOpen = (e: React.MouseEvent) => {
    if (onExactTasksApp && projectsOpen) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("foci-close-project-menu"));
    }
  };

  const navLinks: NavLink[] = user
    ? [
        {
          key: "tasks",
          href: cardsHomeHref,
          label: "Tasks",
          active: onTasksApp && !projectsOpen,
          onClick: (e) => {
            closeProjectsIfOpen(e);
            // Soft-reset when already in the app shell; otherwise Link navigates.
            if (onExactTasksApp && !projectsOpen) {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("foci-go-home-cards"));
              if (pathname !== cardsHomeHref || searchParams.toString()) {
                router.push(cardsHomeHref);
              }
            }
          },
        },
        { key: "stats", href: "/stats", label: "Stats", active: pathname === "/stats" || pathname.startsWith("/stats/") },
        {
          key: "projects",
          href: `${cardsHomeHref}?projects=1`,
          label: "Projects",
          title: "Manage projects — pin, rename, share, delete, import",
          active: projectsOpen,
          onClick: openProjects,
        },
      ]
    : onTasksApp || pathname === "/stats"
      ? []
      : [
          { key: "blog", href: "/blog", label: "Blog", active: pathname.startsWith("/blog") },
          { key: "about", href: "/about", label: "About", active: pathname === "/about" },
        ];

  const logoHref = user ? cardsHomeHref : "/";

  const goHomeCards = (e: React.MouseEvent) => {
    if (!user) return;
    e.preventDefault();
    setMenuOpen(false);
    // Reset TaskList when mounted (no-op on 404 where layout skipped the app shell).
    window.dispatchEvent(new CustomEvent("foci-go-home-cards"));
    try {
      sessionStorage.setItem("foci-go-home-cards", "1");
    } catch {
      /* ignore */
    }
    // Always navigate — recovers from invalid URLs like /app/cards/1 (workspace 404).
    if (pathname !== cardsHomeHref || searchParams.toString()) {
      router.push(cardsHomeHref);
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
                <p className={`${FOCI_TAGLINE_NAV} ${taglineClass} whitespace-nowrap hidden min-[380px]:block [@media(max-height:500px)]:hidden`}>
                  {FOCI_TAGLINE_FOCUS}
                </p>
              ) : null}
            </div>
          </Link>

          {centerSlot ? (
            <div className="hidden roomy:flex flex-1 min-w-0 items-center justify-center px-1 sm:px-2">
              {centerSlot}
            </div>
          ) : (
            <div className="hidden roomy:block flex-1 min-w-0" aria-hidden />
          )}

          <div className="hidden roomy:flex items-center flex-shrink-0 ml-auto">
            {navLinks.length > 0 ? (
              <>
                <div className="flex items-center">
                  {navLinks.map((link) => renderNavLink(link))}
                </div>
                <span className="nav-chrome-divider w-px h-4 mx-2.5 rounded-full self-center" aria-hidden />
              </>
            ) : null}
            <div className="flex items-center">
              {toolbarSlot}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className={chromeLabelBtn}
                  aria-label="Open settings"
                  title="Timer, data, and sharing settings"
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              )}
            </div>
            {toolbarSlot || onOpenSettings ? (
              <span className="nav-chrome-divider w-px h-4 mx-2.5 rounded-full self-center" aria-hidden />
            ) : null}
            <div className="flex items-center">
              <ThemeToggle className={chromeIconBtn} />
              {user ? (
                <UserMenu />
              ) : (
                <ButtonLink href="/login" size="md" className="ml-1.5">
                  Log in
                </ButtonLink>
              )}
            </div>
          </div>

          <div className="flex roomy:hidden items-center gap-0.5 ml-auto">
            <ThemeToggle className={`${chromeIconBtn} touch-target-sm`} />
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className={`${chromeIconBtn} touch-target-sm`}
                aria-label="Open settings"
                title="Timer, data, and sharing settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={`${chromeIconBtn} touch-target-sm`}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="roomy:hidden mt-3 pb-1 border-t nav-chrome-menu">
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
                <ButtonLink
                  href="/login"
                  size="lg"
                  onClick={() => setMenuOpen(false)}
                  className="mx-3 mt-2 text-center"
                >
                  Log in
                </ButtonLink>
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
