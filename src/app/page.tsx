import type { Metadata } from "next";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import { getPostsBySlugs } from "@/lib/blog";
import { FEATURED_POST_SLUGS } from "@/lib/blog-seo";
import GuideLinkHub from "@/components/GuideLinkHub";
import SatTutoringPromo from "@/components/SatTutoringPromo";
import CertStudInboundRedirect from "@/components/CertStudInboundRedirect";
import BoostLogikInboundRedirect from "@/components/BoostLogikInboundRedirect";
import WanderingHermitInboundRedirect from "@/components/WanderingHermitInboundRedirect";
import HomeAppMockup from "@/components/HomeAppMockup";
import HomeFaq from "@/components/HomeFaq";
import { FOCI_HERO_HEADLINE } from "@/lib/logo-brand";
import { homeFaqsToJsonLd } from "@/lib/home-faqs";
import {
  SITE_URL,
  FOCI_ONE_LINER,
  FOCI_SHORT_DESCRIPTION,
  FOCI_SAME_AS,
  PRODUCT_DATE_MODIFIED,
} from "@/lib/product-facts";

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  title: {
    absolute: "Foci – Free Task Manager & Focus App",
  },
  description: FOCI_SHORT_DESCRIPTION,
  alternates: { canonical: "/" },
};

/** Safely serialize JSON-LD: escapes </ to prevent </script> injection. */
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Foci",
  url: siteUrl,
  logo: `${siteUrl}/logo.svg`,
  sameAs: [...FOCI_SAME_AS],
  areaServed: { "@type": "Place", name: "Worldwide" },
  knowsLanguage: "en",
  description: FOCI_ONE_LINER,
  foundingDate: "2025",
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Foci",
  url: siteUrl,
  description: FOCI_SHORT_DESCRIPTION,
  inLanguage: "en-US",
  audience: { "@type": "Audience", audienceType: "Students, developers, writers, remote workers, and knowledge workers worldwide" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Foci",
  url: siteUrl,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser with JavaScript enabled",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/OnlineOnly" },
  description: FOCI_ONE_LINER,
  image: `${siteUrl}/opengraph-image`,
  inLanguage: "en-US",
  areaServed: { "@type": "Place", name: "Worldwide" },
  dateModified: PRODUCT_DATE_MODIFIED,
  featureList: [
    "Task tracking with projects, subtasks, and automatic per-task time logging",
    "Smart Plan: day-by-day scheduling from due dates and capacity, with One Thing and Focus actions",
    "Shareable layouts: /app/cards, /app/buckets, /app/list, /app/calendar, /app/plan",
    "Done tally for completions today, this week, and this month (mobile compact labels; pulses on complete)",
    "Today's One Thing as a borderless intent row under When/Layout",
    "Solid Add project CTA opens Projects manage with a one-row shortLabel template scroller",
    "Shared with me multi-column list; Remove access to drop shared project or account access",
    "Projects manage: 2–3 column grid, full-width expand, muted compact color swatches",
    "Card view (default): project cards with drag-and-drop task reorder and slide-over task detail drawer",
    "Bucket board view: kanban columns per project with drag-and-drop reorder and cross-project moves",
    "List and calendar task views",
    "Import tasks from Google Tasks, Todoist, Asana, and Notion with destination picker and new vs existing project preview",
    "Export tasks as JSON or CSV for backup and migration",
    "Today, This Week, This Month, and This Year smart task filters with project tabs",
    "Optional Pomodoro-style focus timer with customizable work and break durations",
    "Timer presets: Classic Pomodoro (25/5), Short Sprint (15/3), Deep Work (50/10), 52/17 Rule, Ultra Focus (90/20)",
    "Daily session goals and streak tracking",
    "Built-in ambient sounds (rain, café, white noise, brown noise) and live lo-fi/synthwave via YouTube channel streams",
    "Calm light atmosphere with softer chrome — clear hierarchy for tasks, timer, and music",
    "Task detail drawer with Save, Focus, due date, priority, waiting/someday, recurrence, and subtasks",
    "Mobile urgency chips for overdue vs due-today tasks and a compact tasks toolbar",
    "Print the active task view (cards, list, or buckets)",
    "Project tab reorder: drag tabs or use Projects admin; pin favorites to the front",
    "Delete project permanently removes the project and its tasks; archive to keep tasks",
    "Status bar flyouts for timer and music — compact strip with expandable panels",
    "Daily motivational quote in the tasks header on desktop",
    "Projects and subtasks for organized workflows",
    "Browser notifications and motivational quotes",
    "Installable PWA — works offline",
    "Optional free account for cloud sync across devices",
    "Modern light theme atmosphere plus dark mode (Light / Dark / System)",
    "Brown noise generator for deep focus and ADHD support",
    "Muted project color accents with compact swatches, plus due date tracking",
    "Productivity stats dashboard with heatmap, charts, streak tracking, overdue count, and completion rate",
    "Recurring tasks with daily, weekly, monthly, and yearly recurrence",
    "Subtask due dates for granular deadline tracking",
    "Move tasks between projects with drag-free reassignment",
    "Calendar view that auto-sets due dates when selecting a day",
    "Expand tasks and Zen mode for distraction-free sessions",
    "Indian classical music playlists via SoundCloud for deep focus",
    "In-app due/overdue tray plus optional browser notifications",
    "Project templates with preset tasks: workflows (Dev Sprint, Trip Planning, and more) plus financial planning (Financial Life Plan, Monthly Budget, Debt Payoff, Investing Setup) — one-row shortLabel chips in Projects manage",
    "App Focus Bar with session progress, local weather, live clock, and streak when active",
    "Curated Spotify playlists for meditation, ambient, deep focus, Indian indie, and lo-fi",
    "Collapsible timer panel for full-width task management",
    "Guided onboarding tour for new users (replay via Take product tour)",
    "Daily goal presets: Light (4), Standard (8), Intense (12)",
    "Account collaboration with viewer/editor roles (in-app invites; copy invite text)",
    "Project sharing with viewer/editor roles (no public invite links)",
    "In-app bells for collaboration invites and due/overdue reminders",
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Use Foci to Stay Focused and Productive",
  description: "A step-by-step guide to using Foci — a free task manager with Smart Plan, ambient music, streaks, and an optional focus timer.",
  step: [
    { "@type": "HowToStep", name: "Open the app", text: "Visit usefoci.com/app — no signup required to start. Optionally create a free account later to sync across devices." },
    { "@type": "HowToStep", name: "Add your tasks", text: "Create tasks and organize them into projects. Break larger tasks into subtasks for clarity." },
    { "@type": "HowToStep", name: "Plan your day", text: "Open Smart Plan (usefoci.com/app/plan) to turn due dates and daily capacity into a day-by-day schedule. Set Today's One Thing and start Focus. Or switch Cards, Buckets, List, and Calendar via Layout." },
    { "@type": "HowToStep", name: "Focus when you need it", text: "Optionally start a focus session with presets like Classic Pomodoro (25/5), Deep Work (50/10), or 52/17. Turn on ambient sound if you like. Time is logged per-task." },
    { "@type": "HowToStep", name: "Build your streak", text: "Hit your daily session goal and watch your streak grow. Track progress with stats, charts, and a calendar view." },
  ],
};

const faqJsonLd = homeFaqsToJsonLd(siteUrl);


export default function LandingPage() {
  return (
    <>
      <CertStudInboundRedirect />
      <BoostLogikInboundRedirect />
      <WanderingHermitInboundRedirect />
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a] hero-gradient-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
      <AppNavbar />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center app-container">
        <section className="text-center pt-10 sm:pt-16 pb-10 sm:pb-14 max-w-3xl mx-auto w-full">
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200/70 dark:border-blue-700/40 text-xs font-semibold text-blue-700 dark:text-blue-300 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden />
              Free · Optional sync with account
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            {FOCI_HERO_HEADLINE}
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Organize projects, plan the day, and finish what matters — in one calm window. Try free in the browser, or create an account to sync across devices.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-base transition-colors shadow-lg shadow-blue-700/25 dark:shadow-blue-600/20"
            >
              Create free account
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 font-medium text-base hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Try without signing in →
            </Link>
          </div>
        </section>

        {/* App screenshot / mockup */}
        <section className="w-full max-w-5xl mx-auto pt-4 sm:pt-8 pb-12 sm:pb-20">
          <HomeAppMockup />
        </section>

        {/* Trust bar */}
        <section className="w-full max-w-4xl mx-auto pb-10 sm:pb-14">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm sm:text-base text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Optional sync with free account</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Import Todoist, Notion &amp; more</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Built-in ambient music</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <Link href="/install" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                Works offline (PWA)
              </Link>
            </div>
          </div>
        </section>

        {/* How it works — replaces flat feature icons */}
        <section className="w-full max-w-5xl mx-auto pb-12 sm:pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-10">
            How Foci works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="relative bg-white dark:bg-[#0f1b33] rounded-2xl p-6 border border-slate-200 dark:border-[#1e3355] shadow-sm">
              <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                1
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 mt-1">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Add your tasks</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Create tasks, organize them into projects, and break them into subtasks. Pick one to focus on.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white dark:bg-[#0f1b33] rounded-2xl p-6 border border-slate-200 dark:border-[#1e3355] shadow-sm">
              <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                2
              </div>
              <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-4 mt-1">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Plan your day</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Smart Plan schedules work from due dates and daily capacity — set One Thing and Focus from{" "}
                <a href="/app/plan" className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-200">
                  /app/plan
                </a>
                . Use Cards, Buckets, List, or Calendar — and an optional focus timer when a session helps.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white dark:bg-[#0f1b33] rounded-2xl p-6 border border-slate-200 dark:border-[#1e3355] shadow-sm">
              <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                3
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-4 mt-1">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Build your streak</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Hit your daily session goal and watch your streak grow. Stats, charts, and a calendar show your progress over time.
              </p>
            </div>
          </div>
        </section>

        {/* Why Foci vs. others */}
        <section id="features" className="w-full max-w-4xl mx-auto pb-12 sm:pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-4">
            More than a to-do list
          </h2>
          <p className="text-center text-base sm:text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-xl mx-auto">
            Most task apps stop at the checklist. Foci adds Smart Plan scheduling, focus sessions,
            ambient sound, and streaks — so you finish what you planned.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "Tasks + projects, same screen",
                desc: "Cards, Buckets, List, Calendar, and Smart Plan — shareable /app/… layout URLs.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                ),
                iconClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
              },
              {
                title: "Smart Plan scheduling",
                desc: "Day-by-day capacity plan with One Thing and Focus — open /app/plan anytime.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                ),
                iconClass: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30",
              },
              {
                title: "Import from your tools",
                desc: "Bring tasks from Todoist, Notion, Asana, or Google Tasks — pick a destination project in the preview.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                ),
                iconClass: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30",
              },
              {
                title: "Automatic time logging",
                desc: "Optional focus sessions track time per task so you know where hours went.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                ),
                iconClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30",
              },
              {
                title: "Built-in ambient sound",
                desc: "Rain, café, brown noise, and curated playlists — offline sounds included.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                ),
                iconClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30",
              },
              {
                title: "Streaks that stick",
                desc: "Daily session goals and streak tracking build a consistent focus habit.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                ),
                iconClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
              },
              {
                title: "Focus timer when you need it",
                desc: "Pomodoro, Deep Work, 52/17, and Ultra Focus presets — optional, not the whole product.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                iconClass: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0f1b33] border border-slate-200 dark:border-[#1e3355]">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconClass}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    {item.icon}
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">{item.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Focus guides hub — internal links for SEO */}
        <section className="w-full max-w-6xl mx-auto pb-12 sm:pb-16 px-0">
          <GuideLinkHub />
        </section>

        {/* Account CTA */}
        <section className="w-full max-w-3xl mx-auto pb-12 sm:pb-16">
          <div className="rounded-2xl border border-blue-200/80 dark:border-blue-800/50 bg-blue-50/80 dark:bg-blue-950/30 px-6 py-8 sm:px-10 sm:py-10 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Your tasks, synced everywhere
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              A free Foci account keeps projects, Smart Plan, settings, and streaks with you on every device.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              >
                Create free account
              </Link>
              <Link
                href="/app"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 font-medium text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Try without signing in →
              </Link>
            </div>
          </div>
        </section>

        <HomeFaq />

        {/* From the blog */}
        <section className="w-full max-w-5xl mx-auto pb-12 sm:pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
            From the blog
          </h2>
          <p className="text-center text-base text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Practical guides on focus, time management, and productivity.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {getPostsBySlugs(FEATURED_POST_SLUGS).slice(0, 5).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white dark:bg-[#0f1b33] rounded-2xl p-5 border border-slate-200 dark:border-[#1e3355] shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all"
              >
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {post.description}
                </p>
                <span className="inline-block mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                  Read more →
                </span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/blog"
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              View all posts →
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full max-w-3xl mx-auto text-center pb-16 sm:pb-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Ready to focus?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Try the app free, or create an account to sync your tasks everywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-base transition-colors shadow-lg shadow-blue-700/25 dark:shadow-blue-600/20"
            >
              Create free account
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 font-medium text-base hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Try without signing in →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t border-slate-200 dark:border-slate-800">
        <GuideLinkHub variant="footer" className="mb-4" />
        <SatTutoringPromo variant="footer" className="mb-3" />
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
          Preparing for a certification?{" "}
          <a
            href="https://certstud.com/certifications?ref=foci-footer"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline-offset-2 hover:underline"
          >
            Free practice questions on CertStud
          </a>
          {" "}· Running SEO for your business?{" "}
          <a
            href="https://boostlogik.com/dashboard?ref=foci-footer"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 underline-offset-2 hover:underline"
          >
            SEO workspace on BoostLogik
          </a>
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400">
            About
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">
            Terms
          </Link>
          {" · "}
          Built for focus.
        </p>
      </footer>
    </div>
    </>
  );
}
