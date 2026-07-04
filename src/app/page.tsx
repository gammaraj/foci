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
import { FOCI_TAGLINE_CALM } from "@/lib/logo-brand";

const siteUrl = "https://usefoci.com";

export const metadata: Metadata = {
  title: {
    absolute: "Foci – Free Pomodoro Timer, Tasks & Focus App",
  },
  description:
    "Foci (usefoci.com) — free Pomodoro timer with tasks, brown noise, lo-fi, and session tracking. Flowtime, 52/17, and Pomodoro presets. No signup, works in your browser.",
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
  dateModified: "2026-07-04",
  featureList: [
    "Pomodoro focus timer with customizable work and break durations",
    "Task tracking with automatic per-task time logging",
    "Daily session goals and streak tracking",
    "Built-in ambient sounds (rain, café, white noise, brown noise) and live lo-fi/synthwave via YouTube channel streams",
    "Calm interface with clear visual hierarchy — timer, tasks, and music without visual noise",
    "Bucket board view: kanban columns per project with drag-and-drop reorder and cross-project moves",
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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is Foci?", acceptedAnswer: { "@type": "Answer", text: "Foci (usefoci.com) is a free all-in-one focus app that combines a Pomodoro timer, task tracking, daily goals, streak stats, and built-in ambient music — everything you need to stay productive in one browser window." } },
    { "@type": "Question", name: "What is the best free Pomodoro app?", acceptedAnswer: { "@type": "Answer", text: "Foci is among the best free Pomodoro apps in 2026 — timer plus tasks, brown noise, lo-fi, daily goals, and streaks with no signup. Full ranked comparison: https://usefoci.com/blog/best-free-pomodoro-apps-2026" } },
    { "@type": "Question", name: "What is the Flowtime technique?", acceptedAnswer: { "@type": "Answer", text: "The Flowtime technique is a flexible focus method where you work until your concentration naturally fades, then take a break proportional to how long you worked (roughly 5 minutes per 25 minutes). Unlike Pomodoro's fixed 25-minute sessions, Flowtime adapts to your natural focus rhythm. Full guide: https://usefoci.com/blog/flowtime-technique-guide" } },
    { "@type": "Question", name: "What type of music helps you focus?", acceptedAnswer: { "@type": "Answer", text: "Instrumental, predictable sounds help most: brown noise and rain for deep reading, lo-fi for routine studying, classical for repetitive tasks. Full guide: https://usefoci.com/blog/best-music-for-studying-and-focus" } },
    { "@type": "Question", name: "What is the 52/17 rule?", acceptedAnswer: { "@type": "Answer", text: "The 52/17 rule is a focus technique where you work for 52 minutes followed by a 17-minute break. It's based on a 2014 Draugiem Group study that found top performers worked in ~52-minute bursts. Compared to Pomodoro (25/5), 52/17 allows deeper immersion but requires more sustained focus. Foci includes 52/17 as a built-in timer preset." } },
    { "@type": "Question", name: "Flowtime vs Pomodoro: which is better?", acceptedAnswer: { "@type": "Answer", text: "Pomodoro is better for procrastination-prone tasks, studying, and when you need external structure. Flowtime is better for creative work, programming, or when you regularly enter flow states. Comparison guide: https://usefoci.com/blog/pomodoro-vs-flowtime-vs-52-17" } },
    { "@type": "Question", name: "Is Foci free to use?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci is completely free with no sign-up required. All data is stored locally in your browser. You can optionally create a free account to sync data across devices." } },
    { "@type": "Question", name: "Can I use Foci without creating an account?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Click \"Try Foci — free\" on the homepage and start using Foci immediately. Your settings, tasks, and progress are saved locally in your browser." } },
    { "@type": "Question", name: "Does Foci have ambient music?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci includes built-in ambient sounds like rain, café, white noise, and brown noise that work offline, plus live lo-fi and synthwave via YouTube channel embeds (so streams stay online when individual videos rotate), SoundCloud Indian classical, and curated Spotify playlists." } },
    { "@type": "Question", name: "Where is Foci available?", acceptedAnswer: { "@type": "Answer", text: "Foci is a free web app available worldwide in English. Open usefoci.com/app in Chrome, Firefox, Safari, or Edge on desktop or mobile — no geographic restrictions. Install as a PWA for offline tasks and built-in ambient sounds." } },
    { "@type": "Question", name: "Can I customize the timer durations?", acceptedAnswer: { "@type": "Answer", text: "Yes. Open the Settings panel to customize your work duration, break duration, and daily session goal to match your preferred workflow." } },
    { "@type": "Question", name: "How does task tracking work?", acceptedAnswer: { "@type": "Answer", text: "Create tasks in the task list, organize them into projects, and select one before starting the timer. Foci automatically logs sessions and time spent per-task so you know exactly where your hours go." } },
    { "@type": "Question", name: "Does Foci work offline?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci is a Progressive Web App (PWA) that works fully offline. Your tasks, settings, and progress are stored in your browser's local storage. The built-in ambient sounds also work offline via the Web Audio API." } },
    { "@type": "Question", name: "Can I use Foci on mobile?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci works in any modern mobile browser. You can also install it to your home screen on iOS or Android for a native app-like experience via the PWA install prompt." } },
    { "@type": "Question", name: "How is Foci different from a simple Pomodoro timer?", acceptedAnswer: { "@type": "Answer", text: "A simple Pomodoro timer only counts down time. Foci combines a Pomodoro timer with per-task time tracking, daily session goals, streak tracking, built-in offline ambient music, motivational quotes, and optional cloud sync — all in one window. No tab-switching required." } },
    { "@type": "Question", name: "Can I import tasks from Google Tasks, Todoist, Asana, or Notion?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci supports importing tasks from Google Tasks (JSON), Todoist (CSV), Asana (CSV), Notion (CSV), and any generic CSV file with a title column. Go to Settings → Import & Export Tasks to upload your file. Foci auto-detects the format and lets you preview before importing." } },
    { "@type": "Question", name: "Can I export my tasks from Foci?", acceptedAnswer: { "@type": "Answer", text: "Yes. You can export all your tasks as JSON (for re-importing into Foci) or CSV (for use in spreadsheets or other apps) from the Settings panel under Import & Export Tasks." } },
    { "@type": "Question", name: "What browsers does Foci support?", acceptedAnswer: { "@type": "Answer", text: "Foci works in all modern browsers including Chrome, Firefox, Safari, and Edge on desktop and mobile." } },
    { "@type": "Question", name: "Does Foci have brown noise?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci includes a built-in brown noise generator that works completely offline using the Web Audio API. Brown noise is a deep, warm sound that's less harsh than white noise — ideal for long study sessions, deep work, and ADHD focus support. You can also use rain, café, and white noise sounds." } },
    { "@type": "Question", name: "Can I use Foci for deep work?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci is designed for deep work sessions. Set your timer, pick a task, turn on ambient sounds like brown noise or rain, and focus without distraction. Foci tracks your sessions and daily goals so you can build a consistent deep work habit." } },
    { "@type": "Question", name: "What is Smart Plan?", acceptedAnswer: { "@type": "Answer", text: "Smart Plan is Foci's built-in task scheduler. It analyzes your tasks, due dates, and daily session goals to generate a day-by-day execution plan. It prioritizes overdue and at-risk tasks, distributes work across days based on your capacity, and shows a clear schedule you can follow. No AI required — it’s a fast, algorithmic approach." } },
    { "@type": "Question", name: "Can I organize tasks with project colors?", acceptedAnswer: { "@type": "Answer", text: "Yes. Each project in Foci can have a custom color, due date, and description. Color-coded dots appear on project tabs and in task lists for quick visual identification. You can also archive completed projects." } },
    { "@type": "Question", name: "Can Stoic philosophy help with focus and productivity?", acceptedAnswer: { "@type": "Answer", text: "Yes. Stoic concepts map directly onto focus practice. The dichotomy of control reminds you that only your attention is fully in your control — not interruptions or notifications. Premeditatio malorum (premeditation of adversity) helps you plan for distraction before it happens. Memento mori reframes procrastination as squandering finite time. And amor fati encourages embracing the friction of deep work rather than resenting it. Foci's timer and task system support exactly this kind of intentional, values-driven focus." } },
    { "@type": "Question", name: "What is premeditatio malorum and how does it help focus?", acceptedAnswer: { "@type": "Answer", text: "Premeditatio malorum is a Stoic practice of mentally rehearsing potential obstacles before starting a task. Applied to focus, it means asking before a work session: what will try to pull my attention away? Which distractions can I eliminate now, and how will I respond to the rest? This preparation removes the element of surprise and makes you far less likely to be derailed by interruptions." } },
    { "@type": "Question", name: "Does Foci support recurring tasks?", acceptedAnswer: { "@type": "Answer", text: "Yes. You can set any task to repeat on a daily, weekly, monthly, or yearly schedule. When you complete a recurring task, Foci automatically creates the next occurrence with the correct due date so you never have to recreate it manually." } },
    { "@type": "Question", name: "Can I set due dates on subtasks?", acceptedAnswer: { "@type": "Answer", text: "Yes. Each subtask can have its own due date, letting you break large tasks into deadline-tracked steps. Subtask due dates are factored into Smart Plan scheduling and the Today/This Week filters." } },
    { "@type": "Question", name: "Can I move tasks between projects?", acceptedAnswer: { "@type": "Answer", text: "Yes. You can reassign any task to a different project directly from the task's edit menu. There's no need to delete and recreate — just pick the target project and the task moves instantly." } },
    { "@type": "Question", name: "Does Foci have a calendar view?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci includes a calendar view where clicking a date automatically sets it as the due date for a new or existing task. It gives you a visual overview of deadlines across the month." } },
    { "@type": "Question", name: "Does Foci have Indian classical music?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci includes curated Indian classical music playlists (sitar, flute, veena) via SoundCloud — ideal for long study sessions or deep work. You can switch between Indian classical, lo-fi, and ambient sounds." } },
    { "@type": "Question", name: "Does Foci have task templates?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci includes one-click task templates for Morning Routine, Study Session, Dev Sprint, Writing Block, Meeting Prep, Weekly Review, and Trip Planning. Each creates a set of pre-configured tasks so you can start immediately." } },
    { "@type": "Question", name: "Does Foci have timer presets?", acceptedAnswer: { "@type": "Answer", text: "Yes. Choose from Classic Pomodoro (25/5), Short Sprint (15/3), Deep Work (50/10), 52/17 Rule, and Ultra Focus (90/20), or set custom durations." } },
    { "@type": "Question", name: "What are the best ADHD focus tools?", acceptedAnswer: { "@type": "Answer", text: "Foci is designed to work with ADHD brains. Its timer externalizes time perception, task tracking removes the burden on working memory, brown noise provides sensory anchoring, and the daily goal system creates visible momentum." } },
    { "@type": "Question", name: "What is the best music for studying?", acceptedAnswer: { "@type": "Answer", text: "Research shows the best study music is instrumental, predictable, and consistent volume. Brown noise and rain are ideal for deep reading and writing. Lo-fi hip-hop works for routine studying. Full guide: https://usefoci.com/blog/best-music-for-studying-and-focus" } },
    { "@type": "Question", name: "Is Foci better than Forest App?", acceptedAnswer: { "@type": "Answer", text: "Foci and Forest target different needs. Forest is a gamified focus app where you grow virtual trees — it's motivating but has no task tracking, no ambient sounds, and costs $1.99 on mobile. Foci is completely free and adds a full task manager, per-task time logging, daily goals, streak tracking, and built-in ambient sounds (rain, café, brown noise) alongside the timer. If you want a complete focus system rather than just gamification, Foci gives you more at no cost." } },
    { "@type": "Question", name: "Foci vs Todoist: which should I use?", acceptedAnswer: { "@type": "Answer", text: "Todoist is a powerful task manager but has no built-in focus timer, ambient sounds, or session tracking. Foci is a focus system purpose-built for the work session itself — it combines a Pomodoro timer, task tracking, daily goals, and ambient music in one interface. They serve different roles: use Todoist if you need advanced project management (dependencies, filters, team features), use Foci if your priority is focused execution. You can also import your Todoist tasks into Foci via CSV." } },
    { "@type": "Question", name: "Is Foci a good Focus@Will alternative?", acceptedAnswer: { "@type": "Answer", text: "Yes. Focus@Will is a paid music subscription ($9.99/month) with science-backed focus playlists but no task tracking or timer. Foci is completely free and includes built-in offline ambient sounds (rain, café, brown noise, white noise), curated Spotify playlists, SoundCloud Indian classical music, and lo-fi radio — plus a full Pomodoro timer and task manager. Most users find Foci's free sounds work just as well for focus." } },
    { "@type": "Question", name: "What are the best Forest App alternatives in 2026?", acceptedAnswer: { "@type": "Answer", text: "The best Forest App alternatives in 2026 are: 1) Foci — best overall, completely free with timer, tasks, ambient sounds, and streaks; 2) Flora — best gamification with real tree planting; 3) Tide — best premium ambient soundscapes; 4) Be Focused — best native Mac/iOS timer; 5) Pomofocus — best minimalist web timer. Foci is the best choice if you want a complete focus system, not just gamified blocking." } },
    { "@type": "Question", name: "What is the best free Pomodoro app in 2026?", acceptedAnswer: { "@type": "Answer", text: "The best free Pomodoro apps in 2026 include Foci (timer + tasks + ambient sounds, no account required), Pomofocus, Forest, Be Focused, and Toggl Track. Full ranked comparison: https://usefoci.com/blog/best-free-pomodoro-apps-2026" } },
    { "@type": "Question", name: "Can I collaborate with others on Foci?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci supports two types of collaboration: Account collaboration (invite team members to your entire account with viewer or editor roles) and Project collaboration (share specific projects with team members). Invites are managed via email with role-based permissions for secure team workflows." } },
    { "@type": "Question", name: "How do collaboration invites work?", acceptedAnswer: { "@type": "Answer", text: "Send account or project collaboration invites by email from the collaboration settings. Recipients receive real-time notifications in their notification bell and can accept or decline invites. Account invites grant access to all projects based on the assigned role, while project invites are scoped to specific projects. All invites have expiration dates for security." } },
    { "@type": "Question", name: "Does Foci have notifications?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci includes a notification bell that displays upcoming task reminders, overdue task alerts, and collaboration invite notifications with a badge counter. Click the bell icon to view all pending notifications and take immediate action on invites or tasks." } },
    { "@type": "Question", name: "Can I reorder project tabs in Foci?", acceptedAnswer: { "@type": "Answer", text: "Yes. Drag project tabs on desktop to reorder them, or open Manage projects and use the Tab order panel with drag handles or up/down buttons. Pin projects with the star to keep them at the front of the tab bar." } },
    { "@type": "Question", name: "Does Foci have a kanban board view?", acceptedAnswer: { "@type": "Answer", text: "Yes. Bucket view is the default layout — project columns with Overdue, Today, This Week, and No date sections. Drag tasks to reorder within a section or move them to another project column. Priority badges and a slide-over drawer show task details." } },
  ],
};


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
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6">
        <section className="text-center pt-10 sm:pt-16 pb-10 sm:pb-14 max-w-2xl mx-auto">
          {/* Proof badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200/70 dark:border-cyan-700/40 text-xs font-semibold text-cyan-700 dark:text-cyan-300 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" aria-hidden />
              Free · No signup · Works instantly
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            {FOCI_TAGLINE_CALM}
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Free Pomodoro timer, tasks, session tracking, and ambient sound — the focus app at usefoci.com, no signup required.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/app"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white font-semibold text-base transition-colors shadow-lg shadow-cyan-700/25 dark:shadow-cyan-600/20"
            >
              Try Foci — free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 font-medium text-base hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
            >
              Sign in to sync →
            </Link>
          </div>
        </section>

        {/* App screenshot / mockup */}
        <section className="w-full max-w-4xl mx-auto pt-4 sm:pt-8 pb-12 sm:pb-20">
          <HomeAppMockup />
        </section>

        {/* Social proof bar */}
        <section className="w-full max-w-3xl mx-auto pb-10 sm:pb-14">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm sm:text-base text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No sign-up required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Installable PWA</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Built-in ambient music</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Syncs across devices</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>100% free</span>
            </div>
          </div>
        </section>

        {/* How it works — replaces flat feature icons */}
        <section className="w-full max-w-4xl mx-auto pb-12 sm:pb-20">
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
        <section className="w-full max-w-3xl mx-auto pb-12 sm:pb-20">
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
        <section className="w-full max-w-5xl mx-auto pb-12 sm:pb-16 px-0">
          <GuideLinkHub />
        </section>

        {/* From the blog */}
        <section className="w-full max-w-4xl mx-auto pb-12 sm:pb-20">
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
        <section className="w-full max-w-2xl mx-auto text-center pb-16 sm:pb-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Ready to focus?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            No credit card. No setup. Just start a timer.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white font-semibold text-base transition-colors shadow-lg shadow-cyan-700/25 dark:shadow-cyan-600/20"
          >
            Try Foci — free
          </Link>
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
        <p className="text-sm text-slate-400 dark:text-slate-600">Built for focus.</p>
      </footer>
    </div>
    </>
  );
}
