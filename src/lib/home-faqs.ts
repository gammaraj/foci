/** Homepage FAQ — same copy for visible UI and FAQPage JSON-LD (AEO parity). */
export interface HomeFaq {
  question: string;
  answer: string;
}

export const HOME_FAQS: HomeFaq[] = [
  {
    question: "What is Foci?",
    answer:
      "Foci (usefoci.com) is a free task manager and focus app: projects, Smart Plan scheduling, daily goals, streak stats, ambient music, and an optional focus timer — everything in one calm browser window.",
  },
  {
    question: "Is Foci free to use?",
    answer:
      "Yes. Foci is free to use. Create a free account to sync tasks, settings, and streaks across devices. No credit card required.",
  },
  {
    question: "Do I need an account to use Foci?",
    answer:
      "Yes. A free account is required so your tasks, projects, Smart Plan, and streaks stay with you across devices. Create one at usefoci.com/login — it takes under a minute.",
  },
  {
    question: "What is Smart Plan?",
    answer:
      "Smart Plan is Foci's algorithmic day-by-day task scheduler. It uses your tasks, due dates, and daily session goals to prioritize overdue and at-risk work and distribute sessions across days — no AI required.",
  },
  {
    question: "Can I import tasks from Todoist, Notion, Asana, or Google Tasks?",
    answer:
      "Yes. Foci supports importing from Google Tasks (JSON), Todoist (CSV), Asana (CSV), Notion (CSV), and generic CSV. Go to Settings → Import & Export Tasks to upload and preview before importing.",
  },
  {
    question: "Does Foci have project templates?",
    answer:
      "Yes. Project templates create a new project with preset tasks. Workflows include Dev Sprint, Trip Planning, and Weekly Review. Financial packs include Financial Life Plan, Monthly Budget, Debt Payoff, Emergency Fund, Investing Setup, Tax Prep, and Net Worth Review. Open ⋯ → Project templates, or pick one when creating a project.",
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
      "Yes. Foci is a Progressive Web App (PWA). After you sign in, tasks, settings, and progress stay available offline. Built-in ambient sounds also work offline via the Web Audio API.",
  },
  {
    question: "Where is Foci available?",
    answer:
      "Foci is a free web app available worldwide in English. Open usefoci.com in Chrome, Firefox, Safari, or Edge on desktop or mobile — no geographic restrictions. Install as a PWA for offline tasks and ambient sounds.",
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
