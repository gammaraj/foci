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
    question: "What is the best free Pomodoro app?",
    answer:
      "Foci ranks among the best free Pomodoro apps in 2026 — tasks plus an optional timer, brown noise, lo-fi, daily goals, and streaks. Full ranking: https://usefoci.com/blog/best-free-pomodoro-apps-2026",
  },
  {
    question: "Does Foci have ambient music and brown noise?",
    answer:
      "Yes. Foci includes offline ambient sounds (rain, café, white noise, brown noise) via the Web Audio API, plus live lo-fi/synthwave, SoundCloud Indian classical, and curated Spotify playlists.",
  },
  {
    question: "Where is Foci available?",
    answer:
      "Foci is a free web app available worldwide in English. Open usefoci.com in Chrome, Firefox, Safari, or Edge on desktop or mobile — no geographic restrictions. Install as a PWA for offline tasks and ambient sounds.",
  },
  {
    question: "How is Foci different from a simple Pomodoro timer?",
    answer:
      "A simple Pomodoro timer only counts down time. Foci is a task manager first — projects, Smart Plan, per-task time tracking, streaks, and ambient music — with an optional focus timer when you need a session.",
  },
  {
    question: "Can I import tasks from Todoist, Notion, Asana, or Google Tasks?",
    answer:
      "Yes. Foci supports importing from Google Tasks (JSON), Todoist (CSV), Asana (CSV), Notion (CSV), and generic CSV. Go to Settings → Import & Export Tasks to upload and preview before importing.",
  },
  {
    question: "What are the best ADHD focus tools?",
    answer:
      "Foci is designed to work with ADHD brains: task tracking reduces working-memory load, the optional timer externalizes time perception, brown noise provides sensory anchoring, and daily goals create visible momentum. Guide: https://usefoci.com/blog/adhd-focus-strategies",
  },
  {
    question: "Is Foci a good Forest App alternative?",
    answer:
      "Yes. Forest gamifies focus with virtual trees but has no task tracking or ambient sounds and costs money on mobile. Foci is free with a full task manager, per-task time logging, streaks, and built-in ambient sounds. Comparison: https://usefoci.com/blog/foci-vs-forest-app",
  },
  {
    question: "What is Smart Plan?",
    answer:
      "Smart Plan is Foci's algorithmic day-by-day task scheduler. It uses your tasks, due dates, and daily session goals to prioritize overdue and at-risk work and distribute sessions across days — no AI required.",
  },
  {
    question: "Does Foci work offline?",
    answer:
      "Yes. Foci is a Progressive Web App (PWA). After you sign in, tasks, settings, and progress stay available offline. Built-in ambient sounds also work offline via the Web Audio API.",
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
