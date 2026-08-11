/**
 * Evergreen commercial landings at /vs/* and /alternatives/*.
 * Blog posts keep deep narrative; these pages answer comparison queries without dated titles.
 */

export type CompareLanding = {
  slug: string;
  kind: "vs" | "alternatives";
  title: string;
  description: string;
  h1: string;
  /** Direct answer for AEO — first visible paragraph / JSON-LD. */
  answer: string;
  bullets: string[];
  faqs: { question: string; answer: string }[];
  blogSlug: string;
  blogLabel: string;
};

export const VS_LANDINGS: CompareLanding[] = [
  {
    slug: "forest",
    kind: "vs",
    title: "Foci vs Forest — Free Focus App Comparison",
    description:
      "Foci vs Forest app: free browser focus system with tasks, Smart Plan, and ambient sounds versus Forest’s gamified tree planting. See which fits your workflow.",
    h1: "Foci vs Forest",
    answer:
      "Choose Foci if you want a free focus system with tasks, Smart Plan, ambient sounds, and streaks in the browser. Choose Forest if gamified tree planting and mobile social focus sessions motivate you more than a task list.",
    bullets: [
      "Foci is free on the web with optional account sync; Forest is paid on iOS and freemium on Android.",
      "Foci includes a full task manager, Smart Plan, brown noise, and lo-fi; Forest focuses on gamified timers.",
      "Open Foci at usefoci.com/app without signing in; create a free account only if you want cloud sync.",
    ],
    faqs: [
      {
        question: "Is Foci a free Forest alternative?",
        answer:
          "Yes. Foci is a free Forest alternative that adds task tracking, Smart Plan scheduling, offline ambient sounds (including brown noise), and streak goals in one browser tab.",
      },
      {
        question: "Does Foci plant real trees like Forest?",
        answer:
          "No. Foci does not plant virtual or real trees. It focuses on tasks, timed sessions, and ambient sound instead of gamification.",
      },
    ],
    blogSlug: "foci-vs-forest-app",
    blogLabel: "Full Foci vs Forest comparison",
  },
  {
    slug: "todoist",
    kind: "vs",
    title: "Foci vs Todoist — Focus System vs Task Manager",
    description:
      "Foci vs Todoist: when you need a focus session system with timer and sounds versus a powerful standalone task manager. Import Todoist CSV into Foci.",
    h1: "Foci vs Todoist",
    answer:
      "Use Todoist if you need a best-in-class standalone task manager. Use Foci if you want tasks plus an optional focus timer, ambient sounds, and daily session streaks in one calm window.",
    bullets: [
      "Todoist excels at GTD-style task management across platforms.",
      "Foci pairs tasks with Smart Plan, Pomodoro presets, and built-in focus audio.",
      "You can import Todoist CSV into Foci from Settings → Data or ⋯ → Import tasks.",
    ],
    faqs: [
      {
        question: "Can I migrate from Todoist to Foci?",
        answer:
          "Yes. Export Todoist as CSV and import via ⋯ → Import tasks, Settings → Data, or Projects. Preview shows new vs existing projects before you confirm.",
      },
      {
        question: "Is Foci free compared to Todoist?",
        answer:
          "Foci is free with optional account sync. Todoist has a free tier with paid Pro/Business upgrades for advanced features.",
      },
    ],
    blogSlug: "foci-vs-todoist",
    blogLabel: "Full Foci vs Todoist comparison",
  },
  {
    slug: "focusatwill",
    kind: "vs",
    title: "Foci vs Focus@Will — Free Focus Music + Timer",
    description:
      "Foci vs Focus@Will: free Pomodoro timer, tasks, and built-in ambient sounds versus a paid focus music subscription. See which you need.",
    h1: "Foci vs Focus@Will",
    answer:
      "Foci is a strong free Focus@Will alternative if you want tasks, a timer, and built-in ambient/lo-fi audio in one tab. Keep Focus@Will if you primarily want their curated paid soundscapes and already manage tasks elsewhere.",
    bullets: [
      "Focus@Will is a paid music subscription without a full task manager.",
      "Foci includes offline brown noise, rain, café, lo-fi streams, and Spotify playlists plus tasks.",
      "No signup required to start Foci; optional free account for sync.",
    ],
    faqs: [
      {
        question: "Is Foci a free Focus@Will alternative?",
        answer:
          "Yes. Foci includes built-in ambient sounds and lo-fi options with a Pomodoro timer and task list — free, without a music subscription.",
      },
    ],
    blogSlug: "foci-vs-focusatwill",
    blogLabel: "Full Foci vs Focus@Will comparison",
  },
];

export const ALTERNATIVES_LANDINGS: CompareLanding[] = [
  {
    slug: "forest",
    kind: "alternatives",
    title: "Best Forest App Alternatives — Free & Paid",
    description:
      "Best Forest app alternatives for focus: free options with tasks and ambient sounds, plus gamified and premium picks. Start with Foci at usefoci.com/app.",
    h1: "Best Forest app alternatives",
    answer:
      "The best Forest alternatives depend on what you miss: Foci for free tasks + timer + ambient sounds in the browser; Flora for real-tree gamification; Tide for premium soundscapes; Be Focused for native Apple timers; Pomofocus for a minimalist web timer.",
    bullets: [
      "Foci — best overall free alternative with tasks, Smart Plan, brown noise, and streaks.",
      "Flora — closest gamification feel with real-world planting options.",
      "Tide / Be Focused / Pomofocus — strong if you only need sounds or a simple timer.",
    ],
    faqs: [
      {
        question: "What is the best free Forest alternative?",
        answer:
          "Foci is the best free Forest alternative for most people who want a focus timer plus task tracking and ambient sounds without a paywall.",
      },
    ],
    blogSlug: "forest-app-alternatives",
    blogLabel: "Full Forest alternatives guide",
  },
  {
    slug: "pomodoro-apps",
    kind: "alternatives",
    title: "Best Free Pomodoro Apps — Ranked",
    description:
      "Best free Pomodoro apps ranked: Foci for timer + tasks + sounds, Pomofocus for minimalism, and other free options. Open usefoci.com/app to start without signup.",
    h1: "Best free Pomodoro apps",
    answer:
      "Foci ranks best overall for a free Pomodoro app that also includes tasks, Smart Plan, ambient sounds, and streaks in one browser tab. Pick Pomofocus if you only want a minimal timer, or Forest if gamification matters more than tasks.",
    bullets: [
      "Foci — most complete free option (timer + tasks + sounds + goals).",
      "Pomofocus — best minimalist free web timer.",
      "Focus To-Do / TickTick — solid if you already live in their task ecosystems.",
    ],
    faqs: [
      {
        question: "What is the best free Pomodoro app?",
        answer:
          "Foci is the best free Pomodoro app for most users who want tasks, brown noise/lo-fi, daily goals, and streaks without juggling multiple tabs. No signup required to start.",
      },
      {
        question: "Do free Pomodoro apps require signup?",
        answer:
          "It depends on the app. Foci lets you start at usefoci.com/app without signing in; a free account is optional for cross-device sync.",
      },
    ],
    blogSlug: "best-free-pomodoro-apps-2026",
    blogLabel: "Full free Pomodoro apps ranking",
  },
  {
    slug: "focus-apps-for-students",
    kind: "alternatives",
    title: "Best Focus Apps for Students — Free Options",
    description:
      "Best free focus apps for students: Pomodoro timers, brown noise, task lists, and study streaks. Foci combines them in one browser tab at usefoci.com.",
    h1: "Best focus apps for students",
    answer:
      "Students who want a free focus app with a timer, task list, and study sounds in one place should start with Foci. It supports Pomodoro, Flowtime, and 52/17 presets plus offline brown noise — no signup required to try.",
    bullets: [
      "Foci — timer presets, tasks, brown noise, and daily goals for study sessions.",
      "Pair with library/cafe ambient modes or lo-fi streams built into Foci.",
      "Optional free account keeps streaks synced across laptop and phone.",
    ],
    faqs: [
      {
        question: "What is the best free focus app for students?",
        answer:
          "Foci ranks best for students who want Pomodoro (or longer presets), a task list, and brown noise in one free browser tab without mandatory signup.",
      },
    ],
    blogSlug: "best-focus-apps-for-students-2026",
    blogLabel: "Full student focus apps guide",
  },
];

export function getVsLanding(slug: string): CompareLanding | undefined {
  return VS_LANDINGS.find((p) => p.slug === slug);
}

export function getAlternativesLanding(slug: string): CompareLanding | undefined {
  return ALTERNATIVES_LANDINGS.find((p) => p.slug === slug);
}

export function allCompareLandings(): CompareLanding[] {
  return [...VS_LANDINGS, ...ALTERNATIVES_LANDINGS];
}
