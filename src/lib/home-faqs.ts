/** Homepage FAQ — same copy for visible UI and FAQPage JSON-LD (AEO parity). */
import { FOCI_ONE_LINER, FOCI_ACCOUNT_POLICY } from "@/lib/product-facts";

export interface HomeFaq {
  question: string;
  answer: string;
}

export const HOME_FAQS: HomeFaq[] = [
  {
    question: "What is Foci?",
    answer: FOCI_ONE_LINER,
  },
  {
    question: "Is Foci a wearable, device, or cryptocurrency?",
    answer:
      "No. Foci (usefoci.com) is a free browser focus and task app — unrelated to wearables, hardware devices, or crypto tokens that may share the name. Open usefoci.com/app to try it.",
  },
  {
    question: "Is Foci free to use?",
    answer:
      "Yes. Foci is free to use with no credit card. Core features — tasks, Smart Plan, ambient sounds, and the optional focus timer — are available without a paywall.",
  },
  {
    question: "Do I need an account to use Foci?",
    answer: FOCI_ACCOUNT_POLICY,
  },
  {
    question: "What is the best free Pomodoro app with tasks?",
    answer:
      "Foci is built for that exact job: a free Pomodoro-style timer plus task tracking, Smart Plan, brown noise/lo-fi, and streaks in one browser tab. Open usefoci.com/app — no signup required to start.",
  },
  {
    question: "Is Foci a good Forest app alternative?",
    answer:
      "Yes if you want tasks and ambient sounds instead of tree gamification. Foci is free in the browser with Smart Plan and streak goals. See usefoci.com/vs/forest and usefoci.com/alternatives/forest.",
  },
  {
    question: "Where can I compare Foci to other apps?",
    answer:
      "Start at usefoci.com/app with no signup. Side-by-side pages: usefoci.com/vs/forest, usefoci.com/vs/todoist, usefoci.com/vs/focusatwill. Alternative roundups: usefoci.com/alternatives/forest, usefoci.com/alternatives/pomodoro-apps, usefoci.com/alternatives/focus-apps-for-students.",
  },
  {
    question: "What focus app is best for students?",
    answer:
      "Students who need a timer, task list, and study sounds together should try Foci. It supports Pomodoro, Flowtime, and 52/17 presets plus offline brown noise. Guide: usefoci.com/alternatives/focus-apps-for-students.",
  },
  {
    question: "What is Smart Plan?",
    answer:
      "Smart Plan is Foci's algorithmic day-by-day task scheduler at usefoci.com/app/plan. It uses your tasks, due dates, and daily session capacity to prioritize overdue and at-risk work, recommend Today's One Thing, and start Focus — no AI required.",
  },
  {
    question: "What task views does Foci have?",
    answer:
      "Cards (default), Buckets (kanban), List, Calendar, and Smart Plan. Each has a shareable URL: usefoci.com/app/cards, /app/buckets, /app/list, /app/calendar, and /app/plan. In Buckets, drag ⋮⋮ on a column header (or ← → on mobile) to reorder project columns; drag tasks within a section or across projects to move them.",
  },
  {
    question: "What is Flowtime (flowmodoro)?",
    answer:
      "Flowtime (also called flowmodoro) is a focus method where you work until concentration fades, then take a proportional break — unlike Pomodoro's fixed 25-minute blocks. Foci includes a free Flowtime timer. Full guide: usefoci.com/blog/flowtime-technique-guide · comparison: usefoci.com/blog/pomodoro-vs-flowtime-vs-52-17.",
  },
  {
    question: "Can I import tasks from Todoist, Notion, Asana, or Google Tasks?",
    answer:
      "Yes. Foci supports importing from Google Tasks (JSON), Todoist (CSV), Asana (CSV), Notion (CSV), and generic CSV. Open ⋯ → Import tasks, Settings → Data, or Projects. Preview shows new vs existing projects; pick a destination or create projects from the file.",
  },
  {
    question: "What happens when I delete a project in Foci?",
    answer:
      "Deleting a project permanently removes the project and all of its tasks. Archive a project instead if you want to hide it while keeping the tasks.",
  },
  {
    question: "What is Today's One Thing?",
    answer:
      "Today's One Thing is your daily priority, shown as a borderless intent row under When/Layout. Open any open task → Set as Today's One Thing. It stays pinned until you finish or clear it, then resets tomorrow.",
  },
  {
    question: "Does Foci show how much I finished?",
    answer:
      "Yes. The Tasks focus-bar done tally shows completions for today, this week, and this month (compact labels on mobile). It pulses briefly when you complete a task; tap it to jump to completed work.",
  },
  {
    question: "How do I remove access to a shared project?",
    answer:
      "Open Projects → Shared with me. Tap Remove access on the row (not Leave). For account-level shares, Remove access drops all projects from that person.",
  },
  {
    question: "Does Foci have project templates?",
    answer:
      "Yes. Project templates create a new project with preset tasks. Workflows include Dev Sprint, Trip Planning, and Weekly Review. Financial packs include Financial Life Plan, Monthly Budget, Debt Payoff, Emergency Fund, Investing Setup, Tax Prep, and Net Worth Review. In Projects manage, templates are a single horizontally scrollable chip row with short labels. You can also open ⋯ → Project templates or tap Add project.",
  },
  {
    question: "Does Foci support light and dark mode?",
    answer:
      "Yes. Foci has a blue mist light theme (soft cool atmosphere, electric blue accents) plus full dark mode. Choose Appearance: Light, Dark, or System in settings or via the navbar theme toggle.",
  },
  {
    question: "Does Foci have ambient music and brown noise?",
    answer:
      "Yes. Foci includes offline ambient sounds (rain, café, white noise, brown noise) via the Web Audio API, plus live lo-fi/synthwave, SoundCloud Indian classical, and curated Spotify playlists.",
  },
  {
    question: "How is Foci different from a simple Pomodoro timer?",
    answer:
      "A simple Pomodoro timer only counts down time. Foci is a task manager first — projects, Smart Plan, per-task time tracking, streaks, and ambient music — with an optional focus timer when you need a session.",
  },
  {
    question: "Does Foci work offline?",
    answer:
      "Yes. Foci is a Progressive Web App (PWA). Tasks, settings, and progress can stay available offline in your browser. Built-in ambient sounds also work offline via the Web Audio API. Full install steps: usefoci.com/install — on iPhone use Safari → Share → Add to Home Screen; on Android/Chrome use Install or Add to Home Screen.",
  },
  {
    question: "Where is Foci available?",
    answer:
      "Foci is a free web app available worldwide in English. Open usefoci.com in Chrome, Firefox, Safari, or Edge on desktop or mobile — no geographic restrictions. Install as a PWA for offline tasks and ambient sounds.",
  },
  {
    question: "Does Foci support recurring tasks?",
    answer:
      "Yes. Set daily, weekly, monthly, or yearly recurrence in the task detail drawer. When you complete a recurring task, Foci creates the next open occurrence with an advanced due date and reset subtasks. In shared projects you can complete recurring tasks, but the next occurrence is not auto-created.",
  },
  {
    question: "Does Foci show ads?",
    answer:
      "The focus workspace at usefoci.com/app stays free of display ads so sessions stay calm. Public marketing and blog pages may show Google ads. Foci does not sell your task or focus content. Details: usefoci.com/privacy.",
  },
  {
    question: "How do I contact Foci?",
    answer:
      "Email hello@usefoci.com or use usefoci.com/contact. For privacy questions see usefoci.com/privacy. Social: @usefoci on X/Twitter and github.com/gammaraj/foci.",
  },
];

export function homeFaqsToJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.replace(/https:\/\/usefoci\.com/g, siteUrl),
      },
    })),
  };
}
