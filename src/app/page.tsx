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
import { FOCI_TAGLINE_CALM } from "@/lib/logo-brand";
import { homeFaqsToJsonLd } from "@/lib/home-faqs";

const siteUrl = "https://usefoci.com";
/** Real signed-in users (cloud sync) — keep honest; update when the count moves. */
const SIGNED_USER_COUNT = 129;

export const metadata: Metadata = {
  title: {
    absolute: "Foci – Free Pomodoro Timer, Tasks & Focus App",
  },
  description:
    "Free Pomodoro timer with tasks, brown noise, lo-fi, and streaks. Flowtime, 52/17, and Pomodoro presets — no signup. Open Foci in your browser at usefoci.com.",
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
  sameAs: ["https://twitter.com/usefoci"],
  areaServed: { "@type": "Place", name: "Worldwide" },
  knowsLanguage: "en",
  description:
    "Foci builds a free all-in-one focus system: Pomodoro timer, tasks, Smart Plan, ambient music, and streaks — usefoci.com.",
  foundingDate: "2025",
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Foci",
  url: siteUrl,
  description: "Free all-in-one focus system: Pomodoro timer, task tracking, Smart Plan, daily goals, streak stats, and built-in ambient music.",
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
  description: "Foci is a free all-in-one focus system: Pomodoro timer, task tracking, Smart Plan scheduling, daily goals, streak stats, built-in ambient music, and motivational quotes — everything you need to stay productive, in one calm window.",
  image: `${siteUrl}/opengraph-image`,
  inLanguage: "en-US",
  areaServed: { "@type": "Place", name: "Worldwide" },
  dateModified: "2026-07-17",
  featureList: [
    "Pomodoro focus timer with customizable work and break durations",
    "Task tracking with automatic per-task time logging",
    "Daily session goals and streak tracking",
    "Built-in ambient sounds (rain, café, white noise, brown noise) and live lo-fi/synthwave via YouTube channel streams",
    "Calm interface with clear visual hierarchy — timer, tasks, and music without visual noise",
    "Card view (default): project cards with drag-and-drop task reorder and slide-over task detail drawer",
    "Bucket board view: kanban columns per project with drag-and-drop reorder and cross-project moves",
    "List and calendar task views plus Smart Plan scheduling",
    "Task detail drawer with Save, Focus, due date, priority, waiting/someday, recurrence, and subtasks",
    "Mobile urgency chips for overdue vs due-today tasks and a compact tasks toolbar",
    "Print the active task view (cards, list, or buckets)",
    "Project tab reorder: drag tabs or use Manage projects Tab order panel; pin favorites to the front",
    "Status bar flyouts for timer and music — compact strip with expandable panels",
    "Daily motivational quote in the navbar on desktop",
    "Projects and subtasks for organized workflows",
    "Browser notifications and motivational quotes",
    "Installable PWA — works offline",
    "Cloud sync across devices",
    "Dark mode support",
    "Brown noise generator for deep focus and ADHD support",
    "Import tasks from Google Tasks, Todoist, Asana, and Notion",
    "Export tasks as JSON or CSV for backup and migration",
    "Today, This Week, This Month, and This Year smart task filters with project tabs",
    "Smart Plan: algorithmic day-by-day task scheduling based on due dates and daily goals",
    "Project color coding and due date tracking",
    "Productivity stats dashboard with heatmap, charts, streak tracking, overdue count, and completion rate",
    "Recurring tasks with daily, weekly, monthly, and yearly recurrence",
    "Subtask due dates for granular deadline tracking",
    "Move tasks between projects with drag-free reassignment",
    "Calendar view that auto-sets due dates when selecting a day",
    "Fullscreen task mode for distraction-free task management",
    "Indian classical music playlists via SoundCloud for deep focus",
    "Due date reminder notifications for upcoming and overdue tasks",
    "Task templates for common workflows: Morning Routine, Study Session, Dev Sprint, Writing Block, Meeting Prep, Weekly Review, and Trip Planning",
    "Timer presets: Classic Pomodoro (25/5), Short Sprint (15/3), Deep Work (50/10), 52/17 Rule, Ultra Focus (90/20)",
    "Compact status bar with session progress, local weather, live clock, and streak when active",
    "Curated Spotify playlists for meditation, ambient, deep focus, Indian indie, and lo-fi",
    "Collapsible timer panel for full-width task management",
    "Guided onboarding tour for new users",
    "Daily goal presets: Light (4), Standard (8), Intense (12)",
    "Account collaboration with role-based permissions",
    "Project collaboration invites for team workflows",
    "Notification bell for invite alerts and reminders",
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Use Foci to Stay Focused and Productive",
  description: "A step-by-step guide to using Foci — a free all-in-one focus system with a Pomodoro timer, task tracking, ambient music, daily goals, and streak stats.",
  step: [
    { "@type": "HowToStep", name: "Try Foci", text: "Visit usefoci.com and click \"Try Foci — free\" to start instantly, or sign up for free to sync across devices." },
    { "@type": "HowToStep", name: "Add your tasks", text: "Create tasks and organize them into projects. Break larger tasks into subtasks for clarity." },
    { "@type": "HowToStep", name: "Set your preferences", text: "Open Settings to configure work duration (default 25 min), break duration (default 5 min), daily session goal, and notification preferences." },
    { "@type": "HowToStep", name: "Pick a task and start", text: "Select a task from Today or a project tab. Start highlights when a task is selected. Turn on ambient music or lo-fi if you like, then press Start. The circular timer counts down your work session." },
    { "@type": "HowToStep", name: "Take a break", text: "When the session ends, Foci automatically starts your break. Sessions and time are logged per-task." },
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
          {/* Proof badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200/70 dark:border-blue-700/40 text-xs font-semibold text-blue-700 dark:text-blue-300 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden />
              Free · No signup · Works instantly
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            {FOCI_TAGLINE_CALM}
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Free Pomodoro timer, tasks, session tracking, and ambient sound — the focus app at usefoci.com, no signup required.
          </p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-500">
            {SIGNED_USER_COUNT}+ people sync streaks across devices
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/app"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-base transition-colors shadow-lg shadow-blue-700/25 dark:shadow-blue-600/20"
            >
              Try Foci — free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 font-medium text-base hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Create free account to sync →
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
              <span>No sign-up required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{SIGNED_USER_COUNT}+ synced accounts</span>
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
              <span>Works offline (PWA)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>100% free</span>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Start the timer</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Hit play. Foci runs a focused work sprint, then gives you a break. Sessions are tracked per-task automatically.
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
        <section className="w-full max-w-4xl mx-auto pb-12 sm:pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-4">
            More than just a countdown timer
          </h2>
          <p className="text-center text-base sm:text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-xl mx-auto">
            A simple timer counts down and beeps. Foci gives you tasks, time tracking, ambient
            music, and streaks — so you actually stay focused and see your progress.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "Timer + tasks, same screen",
                desc: "No more Alt-Tab between your timer and to-do app.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                iconClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
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
                title: "Automatic time logging",
                desc: "Every session is tracked per task so you know where your hours went.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                ),
                iconClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30",
              },
              {
                title: "Streaks that stick",
                desc: "Daily session goals and streak tracking build a consistent focus habit.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                ),
                iconClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
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

        {/* Sync conversion — guest-first product still needs a clear account value prop */}
        <section className="w-full max-w-3xl mx-auto pb-12 sm:pb-16">
          <div className="rounded-2xl border border-blue-200/80 dark:border-blue-800/50 bg-blue-50/80 dark:bg-blue-950/30 px-6 py-8 sm:px-10 sm:py-10 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Keep your streak when you switch devices
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Guest mode keeps everything in this browser. A free account syncs tasks, settings, and streaks to the cloud — join {SIGNED_USER_COUNT}+ people already syncing.
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
                Continue as guest →
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
            No credit card. No setup. Just start a timer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-base transition-colors shadow-lg shadow-blue-700/25 dark:shadow-blue-600/20"
            >
              Try Foci — free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 font-medium text-base hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Sync across devices →
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
          {" "}· Filantus
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-600">
          <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400">
            About
          </Link>
          {" · "}
          Built for focus.
        </p>
      </footer>
    </div>
    </>
  );
}
