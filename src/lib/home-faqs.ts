/** Homepage FAQ — same copy for visible UI and FAQPage JSON-LD (AEO parity). */
export interface HomeFaq {
  question: string;
  answer: string;
}

export const HOME_FAQS: HomeFaq[] = [
  {
    question: "What is Foci?",
    answer:
      "Foci (usefoci.com) is a free all-in-one focus app that combines a Pomodoro timer, task tracking, daily goals, streak stats, and built-in ambient music — everything you need to stay productive in one browser window.",
  },
  {
    question: "Is Foci free to use?",
    answer:
      "Yes. Foci is completely free with no sign-up required. All data is stored locally in your browser. You can optionally create a free account to sync data across devices.",
  },
  {
    question: "Can I use Foci without creating an account?",
    answer:
      'Absolutely. Click "Try Foci — free" on the homepage and start immediately. Your settings, tasks, and progress are saved locally. Create a free account only when you want cloud sync and streaks across devices.',
  },
  {
    question: "What is the best free Pomodoro app?",
    answer:
      "Foci ranks among the best free Pomodoro apps in 2026 — timer plus tasks, brown noise, lo-fi, daily goals, and streaks with no signup. Full ranking: https://usefoci.com/blog/best-free-pomodoro-apps-2026",
  },
  {
    question: "Does Foci have ambient music and brown noise?",
    answer:
      "Yes. Foci includes offline ambient sounds (rain, café, white noise, brown noise) via the Web Audio API, plus live lo-fi/synthwave, SoundCloud Indian classical, and curated Spotify playlists.",
  },
  {
    question: "Where is Foci available?",
    answer:
      "Foci is a free web app available worldwide in English. Open usefoci.com/app in Chrome, Firefox, Safari, or Edge on desktop or mobile — no geographic restrictions. Install as a PWA for offline tasks and ambient sounds.",
  },
  {
    question: "How is Foci different from a simple Pomodoro timer?",
    answer:
      "A simple Pomodoro timer only counts down time. Foci combines a Pomodoro timer with per-task time tracking, daily session goals, streak tracking, built-in ambient music, and optional cloud sync — all in one window. No tab-switching required.",
  },
  {
    question: "Can I import tasks from Todoist, Notion, Asana, or Google Tasks?",
    answer:
      "Yes. Foci supports importing from Google Tasks (JSON), Todoist (CSV), Asana (CSV), Notion (CSV), and generic CSV. Go to Settings → Import & Export Tasks to upload and preview before importing.",
  },
  {
    question: "What are the best ADHD focus tools?",
    answer:
      "Foci is designed to work with ADHD brains: the timer externalizes time perception, task tracking reduces working-memory load, brown noise provides sensory anchoring, and daily goals create visible momentum. Guide: https://usefoci.com/blog/adhd-focus-strategies",
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
      "Yes. Foci is a Progressive Web App (PWA). Tasks, settings, and progress stay in local storage. Built-in ambient sounds also work offline via the Web Audio API.",
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
