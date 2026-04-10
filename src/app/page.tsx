import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getAllPosts } from "@/lib/blog";

const siteUrl = "https://usefoci.com";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Foci",
  url: siteUrl,
  logo: `${siteUrl}/logo.svg`,
  sameAs: [],
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Foci",
  url: siteUrl,
  description: "Free all-in-one focus system: Pomodoro timer, task tracking, Smart Plan, daily goals, streak stats, and built-in ambient music.",
  inLanguage: "en-US",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Foci",
  url: siteUrl,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser with JavaScript enabled",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Foci is a free all-in-one focus system: Pomodoro timer, task tracking, Smart Plan scheduling, daily goals, streak stats, built-in ambient music, and motivational quotes — everything you need to stay productive, in one window.",
  image: `${siteUrl}/opengraph-image`,
  featureList: [
    "Pomodoro focus timer with customizable work and break durations",
    "Task tracking with automatic per-task time logging",
    "Daily session goals and streak tracking",
    "Built-in ambient sounds (rain, café, white noise, brown noise) and lo-fi radio",
    "Projects and subtasks for organized workflows",
    "Browser notifications and motivational quotes",
    "Installable PWA — works offline",
    "Cloud sync across devices",
    "Dark mode support",
    "Brown noise generator for deep focus and ADHD support",
    "Import tasks from Google Tasks, Todoist, Asana, and Notion",
    "Export tasks as JSON or CSV for backup and migration",
    "Today and This Week smart task filters",
    "Smart Plan: algorithmic day-by-day task scheduling based on due dates and daily goals",
    "Project color coding and due date tracking",
    "Productivity stats dashboard with heatmap, charts, and streak tracking",
    "Recurring tasks with daily, weekly, monthly, and yearly recurrence",
    "Subtask due dates for granular deadline tracking",
    "Move tasks between projects with drag-free reassignment",
    "Calendar view that auto-sets due dates when selecting a day",
    "Fullscreen task mode for distraction-free task management",
    "Indian classical music playlists via SoundCloud for deep focus",
    "Due date reminder notifications for upcoming and overdue tasks",
    "Task templates for common workflows: Morning Routine, Study Session, Dev Sprint, Writing Block, Meeting Prep, Weekly Review",
    "Timer presets: Classic Pomodoro (25/5), Short Sprint (15/3), Deep Work (50/10), 52/17 Rule, Ultra Focus (90/20)",
    "Weather and time widget with local temperature and live clock",
    "Curated Spotify playlists for meditation, ambient, deep focus, Indian indie, and lo-fi",
    "Collapsible timer panel for full-width task management",
    "Guided onboarding tour for new users",
    "Daily goal presets: Light (4), Standard (8), Intense (12)",
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Use Foci to Stay Focused and Productive",
  description: "A step-by-step guide to using Foci — a free all-in-one focus system with a Pomodoro timer, task tracking, ambient music, daily goals, and streak stats.",
  step: [
    { "@type": "HowToStep", name: "Open Foci", text: "Visit usefoci.com and click 'Try without account' or sign up for free to sync across devices." },
    { "@type": "HowToStep", name: "Add your tasks", text: "Create tasks and organize them into projects. Break larger tasks into subtasks for clarity." },
    { "@type": "HowToStep", name: "Set your preferences", text: "Open Settings to configure work duration (default 25 min), break duration (default 5 min), daily session goal, and notification preferences." },
    { "@type": "HowToStep", name: "Pick a task and start", text: "Select a task, turn on ambient music if you like, and press Start. The circular timer counts down your work session." },
    { "@type": "HowToStep", name: "Take a break", text: "When the session ends, Foci automatically starts your break. Sessions and time are logged per-task." },
    { "@type": "HowToStep", name: "Build your streak", text: "Hit your daily session goal and watch your streak grow. Track progress with stats, charts, and a calendar view." },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is Foci?", acceptedAnswer: { "@type": "Answer", text: "Foci is a free all-in-one focus system that combines a Pomodoro timer, task tracking, daily goals, streak stats, and built-in ambient music — everything you need to stay productive, in one window." } },
    { "@type": "Question", name: "Is Foci free to use?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci is completely free with no sign-up required. All data is stored locally in your browser. You can optionally create a free account to sync data across devices." } },
    { "@type": "Question", name: "Can I use Foci without creating an account?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Click 'Try without account' on the homepage and start using Foci immediately. Your settings, tasks, and progress are saved locally in your browser." } },
    { "@type": "Question", name: "Does Foci have ambient music?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci includes built-in ambient sounds like rain, café, white noise, and brown noise that work offline, plus optional lo-fi YouTube radio streams — perfect for getting in the zone." } },
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
    { "@type": "Question", name: "Does Foci have task templates?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci includes one-click task templates for Morning Routine, Study Session, Dev Sprint, Writing Block, Meeting Prep, and Weekly Review. Each creates a set of pre-configured tasks so you can start immediately." } },
    { "@type": "Question", name: "Does Foci have timer presets?", acceptedAnswer: { "@type": "Answer", text: "Yes. Choose from Classic Pomodoro (25/5), Short Sprint (15/3), Deep Work (50/10), 52/17 Rule, and Ultra Focus (90/20), or set custom durations." } },
    { "@type": "Question", name: "What are the best ADHD focus tools?", acceptedAnswer: { "@type": "Answer", text: "Foci is designed to work with ADHD brains. Its timer externalizes time perception, task tracking removes the burden on working memory, brown noise provides sensory anchoring, and the daily goal system creates visible momentum." } },
    { "@type": "Question", name: "What is the best music for studying?", acceptedAnswer: { "@type": "Answer", text: "Research shows the best study music is instrumental, predictable, and consistent volume. Brown noise and rain are ideal for deep reading and writing. Lo-fi hip-hop works for routine studying. Classical music (Western or Indian ragas) suits long sessions. Foci includes all of these built-in." } },
  ],
};

// ── Inline app mockup (dark UI preview) ──────────────────
function AppMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Browser chrome */}
      <div className="rounded-t-2xl bg-[#1a1a2e] px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-[#0d1117] rounded-md px-4 py-1 text-xs text-slate-400 font-mono">
            usefoci.com/app
          </div>
        </div>
      </div>

      {/* App content */}
      <div className="bg-[#0a1628] rounded-b-2xl p-4 sm:p-6 border border-[#1e3355] border-t-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Timer column */}
          <div className="sm:w-[38%] flex flex-col gap-3">
            {/* Focus Timer header */}
            <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "linear-gradient(135deg, #0f1b33 0%, #1a2d4a 100%)" }}>
              <span className="text-sm font-semibold text-white tracking-wide">Focus Timer</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10">
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10">
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </div>
            </div>

            {/* Circular timer */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1e3355" strokeWidth="6" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#3b82f6" strokeWidth="6"
                    strokeDasharray="326.7" strokeDashoffset="81.7" strokeLinecap="round"
                    transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-400 mb-0.5">Focus Time</span>
                  <span className="text-2xl sm:text-3xl font-bold text-white font-mono">22:30</span>
                  <span className="text-[10px] text-blue-400 mt-0.5">Working...</span>
                </div>
              </div>
              {/* Controls */}
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-full bg-[#1e3355] flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#1e3355] flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Nudge text */}
            <p className="text-[10px] text-slate-500 text-center -mt-1">Working on: Research API integration</p>

            {/* Progress */}
            <div className="bg-[#0f1b33] rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">Today&apos;s Sessions</div>
              <div className="flex items-center gap-2 justify-center">
                <span className="text-lg font-bold text-white">2</span>
                <span className="text-xs text-slate-500">/ 3 sessions</span>
              </div>
              <div className="w-full bg-[#1a2744] rounded-full h-2 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: "66%" }} />
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="text-yellow-400 text-xs">✨</span>
                <span className="text-[10px] text-slate-400">3 day streak</span>
              </div>
            </div>

            {/* Ambient sounds */}
            <div className="bg-[#0f1b33] rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-2">🎵 Music &amp; Sounds</div>
              <div className="flex gap-1.5">
                {["Rain", "Café", "Brown"].map((s, i) => (
                  <div key={s} className={`flex-1 text-center text-[10px] py-1.5 rounded-lg border ${i === 2 ? "border-blue-500/40 bg-blue-600/10 text-blue-300" : "border-[#243350] text-slate-500"}`}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks column */}
          <div className="sm:w-[62%] flex flex-col gap-2">
            {/* Tasks header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Tasks</span>
              <div className="flex gap-1">
                {["Today", "Week"].map((f, i) => (
                  <span key={f} className={`text-[10px] px-2 py-1 rounded-md ${i === 0 ? "bg-blue-600/20 text-blue-400" : "text-slate-500"}`}>{f}</span>
                ))}
              </div>
            </div>

            {/* Smart Plan button */}
            <button className="w-full flex items-center justify-center gap-1.5 text-[11px] text-blue-400 border border-blue-500/20 rounded-lg py-1.5 bg-blue-600/5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Recommend Execution Plan
            </button>

            {/* Project tabs */}
            <div className="flex gap-1">
              <div className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-[11px] font-medium">All <span className="text-blue-400/60">5</span></div>
              <div className="px-2.5 py-1 rounded-lg text-slate-500 text-[11px]">General <span className="text-slate-600">3</span></div>
              <div className="px-2.5 py-1 rounded-lg text-slate-500 text-[11px]">Work <span className="text-slate-600">2</span></div>
            </div>

            {/* Add task input */}
            <div className="flex gap-1.5">
              <div className="flex-1 flex items-center bg-[#131d30] border border-[#243350] rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] text-slate-500">Add a task...</span>
              </div>
              <div className="px-2.5 py-1.5 bg-blue-600 text-white text-[11px] font-semibold rounded-lg">Add</div>
            </div>

            {/* Task items */}
            {[
              { title: "Research API integration", sessions: 3, time: "1h 30m", active: true },
              { title: "Draft design mockups", sessions: 1, time: "30m", active: false },
              { title: "Review pull requests", sessions: 0, time: "0m", done: true },
              { title: "Write unit tests", sessions: 2, time: "1h", active: false },
            ].map((task, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${
                task.active ? "bg-blue-600/10 border border-blue-500/30" : "bg-[#0f1b33] border border-transparent"
              }`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  task.done ? "border-green-500 bg-green-500" : task.active ? "border-blue-500" : "border-slate-600"
                }`}>
                  {task.done && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm flex-1 ${task.done ? "line-through text-slate-500" : "text-slate-200"}`}>
                  {task.title}
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">{task.sessions}s · {task.time}</span>
                {!task.done && !task.active && (
                  <span className="text-[10px] text-blue-400 font-medium">Start</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glow effects */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 rounded-3xl -z-10 blur-2xl" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6">
        <section className="text-center pt-12 sm:pt-20 pb-10 sm:pb-14 max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Get sh**t done</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            Focus timer, tasks<br />&amp; ambient music,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300">
              finally in one place.
            </span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Manage tasks, run focused sprints, track time per task, and build streaks — with ambient music to keep you in the zone. All in one window.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-base hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-md"
            >
              Start focusing — free
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-base hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Try without an account
            </Link>
          </div>
        </section>

        {/* App screenshot / mockup */}
        <section className="w-full max-w-4xl mx-auto pt-4 sm:pt-8 pb-12 sm:pb-20">
          <AppMockup />
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
              { icon: "🎯", title: "Timer + tasks, same screen", desc: "No more Alt-Tab between your timer and to-do app." },
              { icon: "🎵", title: "Built-in ambient music", desc: "Rain, café, white noise, plus lo-fi YouTube radio — all built in." },
              { icon: "📊", title: "Automatic time logging", desc: "Every session is tracked per-task. See exactly where your hours go." },
              { icon: "🔥", title: "Streaks that stick", desc: "Daily goals and streak tracking keep you coming back." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0f1b33] border border-slate-200 dark:border-[#1e3355]">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">{item.title}</h3>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* From the blog */}
        <section className="w-full max-w-4xl mx-auto pb-12 sm:pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
            From the blog
          </h2>
          <p className="text-center text-base text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Practical guides on focus, time management, and productivity.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {getAllPosts().slice(0, 3).map((post) => (
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-base hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-md"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-base hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Try without account
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-slate-400 dark:text-slate-600">
        Built for focus.
      </footer>
    </div>
  );
}
