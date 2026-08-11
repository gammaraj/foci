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
    question: "What focus app is best for students?",
    answer:
      "Students who need a timer, task list, and study sounds together should try Foci. It supports Pomodoro, Flowtime, and 52/17 presets plus offline brown noise. Guide: usefoci.com/alternatives/focus-apps-for-students.",
  },
  {
    question: "What is Smart Plan?",
    answer:
      "Smart Plan is Foci's algorithmic day-by-day task scheduler. It uses your tasks, due dates, and daily session goals to prioritize overdue and at-risk work and distribute sessions across days — no AI required.",
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
      "Yes. Foci is a Progressive Web App (PWA). Tasks, settings, and progress can stay available offline in your browser. Built-in ambient sounds also work offline via the Web Audio API. On iPhone, open usefoci.com/app in Safari → Share → Add to Home Screen. On Android/Chrome, use Install or Add to Home Screen from the browser menu (or the in-app prompt after your first session).",
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
